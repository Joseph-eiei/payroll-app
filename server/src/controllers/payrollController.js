const pool = require('../config/db');

function calcWorkTime(checkIn, checkOut) {
  if (!checkIn || !checkOut) return { days: 0, hours: 0 };
  const start = new Date(`1970-01-01T${checkIn}Z`);
  const end = new Date(`1970-01-01T${checkOut}Z`);
  let diff = (end - start) / 3600000;
  if (checkIn <= '12:00:00' && checkOut >= '13:00:00') diff -= 1;
  if (diff >= 8) return { days: 1, hours: diff - 8 };
  if (diff >= 4) return { days: 0.5, hours: diff - 4 };
  return { days: 0, hours: diff };
}

async function calculateRange(emp, startDate, endDate) {
  let days = 0;
  let hours = 0;
  let bonus = 0;
  let otHours = 0;
  let sunDays = 0;

  const { rows: att } = await pool.query(
    `SELECT a.attendance_date, a.site_supervisor_id, a.supervisor_ot,
            a.supervisor_check_in, a.supervisor_check_out,
            a.is_sunday, a.is_bonus,
            ae.check_in, ae.check_out, ae.ot_hours
       FROM AttendanceForms a
       LEFT JOIN AttendanceEmployees ae ON a.id = ae.attendance_id AND ae.employee_id=$3
      WHERE a.is_verified=true
        AND a.attendance_date >= $1 AND a.attendance_date < $2
        AND (ae.id IS NOT NULL OR a.site_supervisor_id=$3)`,
    [startDate, endDate, emp.id]
  );

  for (const r of att) {
    const isSun = r.is_sunday === true;

    if (!isSun) {
      if (r.check_in && r.check_out) {
        const w = calcWorkTime(r.check_in, r.check_out);
        days += w.days;
        hours += w.hours;
      }
      if (
        r.site_supervisor_id === emp.id &&
        r.supervisor_check_in &&
        r.supervisor_check_out
      ) {
        const w = calcWorkTime(r.supervisor_check_in, r.supervisor_check_out);
        days += w.days;
        hours += w.hours;
      }
    }

    if (r.is_bonus) bonus += 1;
    if (r.ot_hours) otHours += parseFloat(r.ot_hours);
    if (r.site_supervisor_id === emp.id && r.supervisor_ot) {
      otHours += parseFloat(r.supervisor_ot);
    }

    if (isSun) sunDays += 1;
  }

  const daily = parseFloat(emp.daily_wage);
  const basePay = days * daily + hours * (daily / 8) + bonus * 50;
  const otRate = (daily / 8) * 1.5;
  const otPay = otHours * otRate;
  const sunRate = daily * 1.5;
  const sunPay = sunDays * sunRate;
  const totalIncome = basePay + otPay + sunPay;

  return {
    days,
    hours: parseFloat(hours.toFixed(2)),
    bonus,
    otHours: parseFloat(otHours.toFixed(2)),
    sunDays,
    basePay: parseFloat(basePay.toFixed(2)),
    otPay: parseFloat(otPay.toFixed(2)),
    sunPay: parseFloat(sunPay.toFixed(2)),
    totalIncome: parseFloat(totalIncome.toFixed(2)),
  };
}

async function calcWaterDed(emp, month) {
  if (!emp.water_address) return 0;
  const { rows: bill } = await pool.query(
    'SELECT water_charge FROM WaterBills WHERE address_name=$1 AND bill_month=$2',
    [emp.water_address, month]
  );
  if (!bill.length) return 0;
  const charge = parseFloat(bill[0].water_charge);
  const { rows: cnt } = await pool.query(
    'SELECT COUNT(*) FROM Employees WHERE water_address=$1',
    [emp.water_address]
  );
  const people = parseInt(cnt[0].count) || 0;
  return people >= 0 ? charge / (people + 3) : 0;
}

async function calcElectricDed(emp, month) {
  if (!emp.electric_address) return 0;
  const { rows: bill } = await pool.query(
    'SELECT last_unit, current_unit FROM ElectricBills WHERE address_name=$1 AND bill_month=$2',
    [emp.electric_address, month]
  );
  if (!bill.length) return 0;
  const usage = parseFloat(bill[0].current_unit) - parseFloat(bill[0].last_unit);
  const charge = usage * 5;
  const { rows: cnt } = await pool.query(
    'SELECT COUNT(*) FROM Employees WHERE electric_address=$1',
    [emp.electric_address]
  );
  const people = parseInt(cnt[0].count) || 0;
  return people > 0 ? charge / people : 0;
}

exports.getMonthlyPayroll = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  try {
    const { rows: employees } = await pool.query(
      "SELECT * FROM Employees WHERE payment_cycle='รายเดือน' ORDER BY id"
    );
    const { rows: deductionTypes } = await pool.query(
      'SELECT name, rate FROM DeductionTypes WHERE is_active=true ORDER BY id'
    );
    const result = [];

    for (const emp of employees) {
      const details = await calculateRange(emp, monthStart, monthEnd);
      const waterDed = await calcWaterDed(emp, `${month}-01`);
      const electricDed = await calcElectricDed(emp, `${month}-01`);

      // fetch outstanding advances for this employee
      const { rows: adv } = await pool.query(
        'SELECT id, name, total_amount FROM AdvanceLoans WHERE employee_id=$1 AND total_amount > 0 ORDER BY id',
        [emp.id]
      );

      // fetch current savings balance
      const { rows: sav } = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN is_deposit THEN amount ELSE -amount END),0) AS balance
         FROM SavingsTransactions WHERE employee_id=$1`,
        [emp.id]
      );
      const savingsBalance = sav.length ? parseFloat(sav[0].balance) : 0;

      let otherDed = 0;
      const deductionDetails = [];
      const baseForDeduction = details.basePay + details.otPay;
      for (const d of deductionTypes) {
        const rate = parseFloat(d.rate) || 0;
        const amount = (baseForDeduction * rate) / 100;
        otherDed += amount;
        deductionDetails.push({ name: d.name, amount: parseFloat(amount.toFixed(2)) });
      }

      const deductionsTotal = waterDed + electricDed + otherDed;
      const netPay = details.totalIncome - deductionsTotal;

      result.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        nationality: emp.nationality,
        days_worked: details.days,
        hours_worked: details.hours,
        bonus_count: details.bonus,
        base_pay: details.basePay,
        ot_hours: details.otHours,
        ot_pay: details.otPay,
        sunday_days: details.sunDays,
        sunday_pay: details.sunPay,
        total_income: details.totalIncome,
        water_deduction: parseFloat(waterDed.toFixed(2)),
        electric_deduction: parseFloat(electricDed.toFixed(2)),
        other_deductions: parseFloat(otherDed.toFixed(2)),
        deductions_total: parseFloat(deductionsTotal.toFixed(2)),
        net_pay: parseFloat(netPay.toFixed(2)),
        deduction_details: deductionDetails,
        advances: adv,
        savings_balance: parseFloat(savingsBalance.toFixed(2)),
        savings_monthly_amount: parseFloat(emp.savings_monthly_amount) || 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getMonthlyPayroll:', err.message);
    res.status(500).send('Server error while calculating payroll');
  }
};

exports.getSemiMonthlyPayroll = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const period = req.query.period === 'second' ? 'second' : 'first';
  const monthStart = new Date(`${month}-01`);
  const midDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 16);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const rangeStart = period === 'first' ? monthStart : midDate;
  const rangeEnd = period === 'first' ? midDate : monthEnd;

  try {
    const { rows: employees } = await pool.query(
      "SELECT * FROM Employees WHERE payment_cycle='ครึ่งเดือน' ORDER BY id"
    );
    const { rows: deductionTypes } = await pool.query(
      'SELECT name, rate FROM DeductionTypes WHERE is_active=true ORDER BY id'
    );
    const result = [];

    for (const emp of employees) {
      const monthly = await calculateRange(emp, monthStart, monthEnd);
      const part = await calculateRange(emp, rangeStart, rangeEnd);

      const waterDed = await calcWaterDed(emp, `${month}-01`);
      const electricDed = await calcElectricDed(emp, `${month}-01`);

      let otherDed = 0;
      const deductionDetails = [];
      const baseForDeduction = monthly.basePay + monthly.otPay;
      for (const d of deductionTypes) {
        const rate = parseFloat(d.rate) || 0;
        const amount = (baseForDeduction * rate) / 100;
        otherDed += amount;
        deductionDetails.push({ name: d.name, amount: parseFloat(amount.toFixed(2)) });
      }

      const deductionsTotal = period === 'second' ? waterDed + electricDed + otherDed : 0;
      const netPay = part.totalIncome - deductionsTotal;

      const { rows: adv } = await pool.query(
        'SELECT id, name, total_amount FROM AdvanceLoans WHERE employee_id=$1 AND total_amount > 0 ORDER BY id',
        [emp.id]
      );
      const { rows: sav } = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN is_deposit THEN amount ELSE -amount END),0) AS balance
         FROM SavingsTransactions WHERE employee_id=$1`,
        [emp.id]
      );
      const savingsBalance = sav.length ? parseFloat(sav[0].balance) : 0;

      result.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        nationality: emp.nationality,
        period,
        days_worked: part.days,
        hours_worked: part.hours,
        bonus_count: part.bonus,
        base_pay: part.basePay,
        ot_hours: part.otHours,
        ot_pay: part.otPay,
        sunday_days: part.sunDays,
        sunday_pay: part.sunPay,
        total_income: part.totalIncome,
        water_deduction: parseFloat(waterDed.toFixed(2)),
        electric_deduction: parseFloat(electricDed.toFixed(2)),
        other_deductions: parseFloat(otherDed.toFixed(2)),
        deductions_total: parseFloat(deductionsTotal.toFixed(2)),
        net_pay: parseFloat(netPay.toFixed(2)),
        deduction_details: deductionDetails,
        advances: adv,
        savings_balance: parseFloat(savingsBalance.toFixed(2)),
        savings_monthly_amount: parseFloat(emp.savings_monthly_amount) || 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error in getSemiMonthlyPayroll:', err.message);
    res.status(500).send('Server error while calculating semimonthly payroll');
  }
};

exports.recordMonthlyPayroll = async (req, res) => {
  const {
    employeeId,
    month,
    advanceDeductions = [],
    savingsWithdraw = false,
    savingsRemark = '',
  } = req.body;
  const payMonth = month || new Date().toISOString().slice(0, 7);
  const monthStart = new Date(`${payMonth}-01`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  try {
    const empRes = await pool.query('SELECT * FROM Employees WHERE id=$1', [employeeId]);
    if (!empRes.rows.length) return res.status(404).json({ msg: 'Employee not found' });
    const emp = empRes.rows[0];
    const { rows: deductionTypes } = await pool.query(
      'SELECT name, rate FROM DeductionTypes WHERE is_active=true ORDER BY id'
    );

    const details = await calculateRange(emp, monthStart, monthEnd);
    const waterDed = await calcWaterDed(emp, `${payMonth}-01`);
    const electricDed = await calcElectricDed(emp, `${payMonth}-01`);

    let otherDed = 0;
    for (const d of deductionTypes) {
      const rate = parseFloat(d.rate) || 0;
      const amount = ((details.basePay + details.otPay) * rate) / 100;
      otherDed += amount;
    }

    let advanceTotal = 0;
    for (const ad of advanceDeductions) {
      const amt = parseFloat(ad.amount) || 0;
      if (amt <= 0) continue;
      advanceTotal += amt;
      await pool.query(
        'UPDATE AdvanceLoans SET total_amount = total_amount - $1, updated_at=$3 WHERE id = $2',
        [amt, ad.id, `${payMonth}-01`]
      );
      await pool.query(
        `INSERT INTO AdvanceTransactions (advance_id, amount, transaction_date, remark)
         VALUES ($1, $2, $3, $4)`,
        [ad.id, -amt, `${payMonth}-01`, ad.remark || '']
      );
    }

    let savingsIncome = 0;
    let savingsDed = 0;
    const savingsMonthly = parseFloat(emp.savings_monthly_amount) || 0;
    if (savingsWithdraw) {
      const { rows: sav } = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN is_deposit THEN amount ELSE -amount END),0) AS bal
         FROM SavingsTransactions WHERE employee_id=$1`,
        [employeeId]
      );
      let bal = sav.length ? parseFloat(sav[0].bal) : 0;
      const payDate = new Date(`${payMonth}-01`);
      if (payDate.getMonth() === 11 && bal >= 5500) bal += 1375;
      savingsIncome = bal;
      if (bal > 0) {
        await pool.query(
          `INSERT INTO SavingsTransactions (employee_id, amount, transaction_date, is_deposit, remark)
           VALUES ($1, $2, $3, false, $4)`,
          [employeeId, bal, `${payMonth}-01`, savingsRemark]
        );
      }
    } else {
      savingsDed = savingsMonthly;
      if (savingsMonthly > 0) {
        await pool.query(
          `INSERT INTO SavingsTransactions (employee_id, amount, transaction_date, is_deposit, remark)
           VALUES ($1, $2, $3, true, $4)`,
          [employeeId, savingsMonthly, `${payMonth}-01`, savingsRemark]
        );
      }
    }

    otherDed += advanceTotal + savingsDed;
    const totalIncome = details.totalIncome + savingsIncome;
    const deductionsTotal = waterDed + electricDed + otherDed;
    const netPay = totalIncome - deductionsTotal;

    await pool.query(
      `INSERT INTO PayrollRecords (
        employee_id, pay_month, days_worked, hours_worked, bonus_count,
        ot_hours, sunday_days, base_pay, ot_pay, sunday_pay,
        water_deduction, electric_deduction, other_deductions, deductions_total,
        total_income, net_pay
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )
      ON CONFLICT (employee_id, pay_month)
      DO UPDATE SET
        days_worked=EXCLUDED.days_worked,
        hours_worked=EXCLUDED.hours_worked,
        bonus_count=EXCLUDED.bonus_count,
        ot_hours=EXCLUDED.ot_hours,
        sunday_days=EXCLUDED.sunday_days,
        base_pay=EXCLUDED.base_pay,
        ot_pay=EXCLUDED.ot_pay,
        sunday_pay=EXCLUDED.sunday_pay,
        water_deduction=EXCLUDED.water_deduction,
        electric_deduction=EXCLUDED.electric_deduction,
        other_deductions=EXCLUDED.other_deductions,
        deductions_total=EXCLUDED.deductions_total,
        total_income=EXCLUDED.total_income,
        net_pay=EXCLUDED.net_pay`,
      [
        emp.id,
        `${payMonth}-01`,
        details.days,
        details.hours,
        details.bonus,
        details.otHours,
        details.sunDays,
        details.basePay,
        details.otPay,
        details.sunPay,
        parseFloat(waterDed.toFixed(2)),
        parseFloat(electricDed.toFixed(2)),
        parseFloat(otherDed.toFixed(2)),
        parseFloat(deductionsTotal.toFixed(2)),
        totalIncome,
        parseFloat(netPay.toFixed(2)),
      ]
    );

    res.json({ msg: 'recorded' });
  } catch (err) {
    console.error('Error in recordMonthlyPayroll:', err.message);
    res.status(500).send('Server error while recording payroll');
  }
};

exports.recordSemiMonthlyPayroll = async (req, res) => {
  const {
    employeeId,
    month,
    period,
    advanceDeductions = [],
    savingsWithdraw = false,
    savingsRemark = '',
  } = req.body;
  const payMonth = month || new Date().toISOString().slice(0, 7);
  const per = period === 'second' ? 'second' : 'first';
  const monthStart = new Date(`${payMonth}-01`);
  const midDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 16);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const rangeStart = per === 'first' ? monthStart : midDate;
  const rangeEnd = per === 'first' ? midDate : monthEnd;

  try {
    const empRes = await pool.query('SELECT * FROM Employees WHERE id=$1', [employeeId]);
    if (!empRes.rows.length) return res.status(404).json({ msg: 'Employee not found' });
    const emp = empRes.rows[0];
    const { rows: deductionTypes } = await pool.query(
      'SELECT name, rate FROM DeductionTypes WHERE is_active=true ORDER BY id'
    );

    const monthly = await calculateRange(emp, monthStart, monthEnd);
    const part = await calculateRange(emp, rangeStart, rangeEnd);
    const waterDed = await calcWaterDed(emp, `${payMonth}-01`);
    const electricDed = await calcElectricDed(emp, `${payMonth}-01`);

    let otherDed = 0;
    for (const d of deductionTypes) {
      const rate = parseFloat(d.rate) || 0;
      const amount = ((monthly.basePay + monthly.otPay) * rate) / 100;
      otherDed += amount;
    }

    let advanceTotal = 0;
    for (const ad of advanceDeductions) {
      const amt = parseFloat(ad.amount) || 0;
      if (amt <= 0) continue;
      advanceTotal += amt;
      await pool.query(
        'UPDATE AdvanceLoans SET total_amount = total_amount - $1, updated_at=$3 WHERE id = $2',
        [amt, ad.id, `${payMonth}-01`]
      );
      await pool.query(
        `INSERT INTO AdvanceTransactions (advance_id, amount, transaction_date, remark)
         VALUES ($1, $2, $3, $4)`,
        [ad.id, -amt, `${payMonth}-01`, ad.remark || '']
      );
    }

    let savingsIncome = 0;
    let savingsDed = 0;
    const savingsMonthly = parseFloat(emp.savings_monthly_amount) || 0;
    if (savingsWithdraw) {
      const { rows: sav } = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN is_deposit THEN amount ELSE -amount END),0) AS bal
         FROM SavingsTransactions WHERE employee_id=$1`,
        [employeeId]
      );
      let bal = sav.length ? parseFloat(sav[0].bal) : 0;
      const payDate = new Date(`${payMonth}-01`);
      if (payDate.getMonth() === 11 && bal >= 5500) bal += 1375;
      savingsIncome = bal;
      if (bal > 0) {
        await pool.query(
          `INSERT INTO SavingsTransactions (employee_id, amount, transaction_date, is_deposit, remark)
           VALUES ($1, $2, $3, false, $4)`,
          [employeeId, bal, `${payMonth}-01`, savingsRemark]
        );
      }
    } else {
      savingsDed = savingsMonthly;
      if (savingsMonthly > 0) {
        await pool.query(
          `INSERT INTO SavingsTransactions (employee_id, amount, transaction_date, is_deposit, remark)
           VALUES ($1, $2, $3, true, $4)`,
          [employeeId, savingsMonthly, `${payMonth}-01`, savingsRemark]
        );
      }
    }

    otherDed += advanceTotal + savingsDed;
    const totalIncome = part.totalIncome + savingsIncome;
    const deductionsTotal = per === 'second' ? waterDed + electricDed + otherDed : 0;
    const netPay = totalIncome - deductionsTotal;

    await pool.query(
      `INSERT INTO HalfPayrollRecords (
        employee_id, pay_month, period, days_worked, hours_worked, bonus_count,
        ot_hours, sunday_days, base_pay, ot_pay, sunday_pay,
        water_deduction, electric_deduction, other_deductions, deductions_total,
        total_income, net_pay
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )
      ON CONFLICT (employee_id, pay_month, period)
      DO UPDATE SET
        days_worked=EXCLUDED.days_worked,
        hours_worked=EXCLUDED.hours_worked,
        bonus_count=EXCLUDED.bonus_count,
        ot_hours=EXCLUDED.ot_hours,
        sunday_days=EXCLUDED.sunday_days,
        base_pay=EXCLUDED.base_pay,
        ot_pay=EXCLUDED.ot_pay,
        sunday_pay=EXCLUDED.sunday_pay,
        water_deduction=EXCLUDED.water_deduction,
        electric_deduction=EXCLUDED.electric_deduction,
        other_deductions=EXCLUDED.other_deductions,
        deductions_total=EXCLUDED.deductions_total,
        total_income=EXCLUDED.total_income,
        net_pay=EXCLUDED.net_pay`,
      [
        emp.id,
        `${payMonth}-01`,
        per,
        part.days,
        part.hours,
        part.bonus,
        part.otHours,
        part.sunDays,
        part.basePay,
        part.otPay,
        part.sunPay,
        parseFloat(waterDed.toFixed(2)),
        parseFloat(electricDed.toFixed(2)),
        parseFloat(otherDed.toFixed(2)),
        parseFloat(deductionsTotal.toFixed(2)),
        totalIncome,
        parseFloat(netPay.toFixed(2)),
      ]
    );

    res.json({ msg: 'recorded' });
  } catch (err) {
    console.error('Error in recordSemiMonthlyPayroll:', err.message);
    res.status(500).send('Server error while recording semimonthly payroll');
  }
};

exports.getMonthlyHistory = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const { rows } = await pool.query(
      `SELECT p.*, e.first_name, e.last_name, e.nationality
       FROM PayrollRecords p
       JOIN Employees e ON p.employee_id = e.id
       WHERE to_char(p.pay_month, 'YYYY-MM') = $1`,
      [month]
    );

    const { rows: types } = await pool.query(
      'SELECT name, rate FROM DeductionTypes ORDER BY id'
    );

    for (const r of rows) {
      const base = parseFloat(r.base_pay) + parseFloat(r.ot_pay);
      r.deduction_details = types.map((t) => {
        const rate = parseFloat(t.rate) || 0;
        const amt = (base * rate) / 100;
        return { name: t.name, amount: parseFloat(amt.toFixed(2)) };
      });

      const { rows: adv } = await pool.query(
        `SELECT a.name, a.total_amount, -t.amount AS amount, t.remark
           FROM AdvanceTransactions t
           JOIN AdvanceLoans a ON t.advance_id = a.id
          WHERE a.employee_id = $1
            AND t.transaction_date = $2
            AND t.amount < 0`,
        [r.employee_id, r.pay_month]
      );
      r.advance_details = adv.map((a) => ({
        name: a.name,
        remaining: parseFloat(a.total_amount),
        amount: parseFloat(a.amount),
        remark: a.remark || '',
      }));
      r.advance_total = r.advance_details.reduce((sum, a) => sum + a.amount, 0);

      const { rows: sav } = await pool.query(
        'SELECT amount, is_deposit FROM SavingsTransactions WHERE employee_id=$1 AND transaction_date=$2',
        [r.employee_id, r.pay_month]
      );
      r.savings_deposit = 0;
      r.savings_withdraw = 0;
      if (sav.length) {
        if (sav[0].is_deposit) r.savings_deposit = parseFloat(sav[0].amount);
        else r.savings_withdraw = parseFloat(sav[0].amount);
      }
    }

    rows.sort((a, b) => {
      if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
      if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
      return a.employee_id - b.employee_id;
    });
    res.json(rows);
  } catch (err) {
    console.error('Error in getMonthlyHistory:', err.message);
    res.status(500).send('Server error while fetching payroll history');
  }
};

exports.getSemiMonthlyHistory = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const { rows } = await pool.query(
      `SELECT h.*, e.first_name, e.last_name, e.nationality, e.daily_wage
       FROM HalfPayrollRecords h
       JOIN Employees e ON h.employee_id = e.id
       WHERE to_char(h.pay_month, 'YYYY-MM') = $1`,
      [month]
    );

    const { rows: types } = await pool.query(
      'SELECT name, rate FROM DeductionTypes ORDER BY id'
    );

    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    for (const r of rows) {
      const emp = { id: r.employee_id, daily_wage: r.daily_wage };
      const monthly = await calculateRange(emp, monthStart, monthEnd);
      const base = monthly.basePay + monthly.otPay;
      r.deduction_details = types.map((t) => {
        const rate = parseFloat(t.rate) || 0;
        const amt = (base * rate) / 100;
        return { name: t.name, amount: parseFloat(amt.toFixed(2)) };
      });

      const { rows: adv } = await pool.query(
        `SELECT a.name, a.total_amount, -t.amount AS amount, t.remark
           FROM AdvanceTransactions t
           JOIN AdvanceLoans a ON t.advance_id = a.id
          WHERE a.employee_id = $1
            AND t.transaction_date = $2
            AND t.amount < 0`,
        [r.employee_id, r.pay_month]
      );
      r.advance_details = adv.map((a) => ({
        name: a.name,
        remaining: parseFloat(a.total_amount),
        amount: parseFloat(a.amount),
        remark: a.remark || '',
      }));
      r.advance_total = r.advance_details.reduce((sum, a) => sum + a.amount, 0);

      const { rows: sav } = await pool.query(
        'SELECT amount, is_deposit FROM SavingsTransactions WHERE employee_id=$1 AND transaction_date=$2',
        [r.employee_id, r.pay_month]
      );
      r.savings_deposit = 0;
      r.savings_withdraw = 0;
      if (sav.length) {
        if (sav[0].is_deposit) r.savings_deposit = parseFloat(sav[0].amount);
        else r.savings_withdraw = parseFloat(sav[0].amount);
      }
    }

    rows.sort((a, b) => {
      if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
      if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
      if (a.employee_id === b.employee_id) {
        return a.period === b.period ? 0 : a.period === 'first' ? -1 : 1;
      }
      return a.employee_id - b.employee_id;
    });
    res.json(rows);
  } catch (err) {
    console.error('Error in getSemiMonthlyHistory:', err.message);
    res.status(500).send('Server error while fetching semimonthly history');
  }
};
