import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TABLE_ROW_HEIGHT = 50; // px
const fixedRowClass = "payroll-fixed-row";

function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState('รายเดือน');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [halfPeriod, setHalfPeriod] = useState('1-15');
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [advanceInputs, setAdvanceInputs] = useState({});
  const [savingInputs, setSavingInputs] = useState({});

  const computeNetPay = (p) => {
    const advs = advanceInputs[p.employee_id] || {};
    const advTotal = Object.values(advs).reduce(
      (sum, val) => sum + (parseFloat(val.amount) || 0),
      0,
    );
    const sav = savingInputs[p.employee_id] || {};
    const deposit = sav.withdraw ? 0 : p.savings_monthly_amount;
    let withdrawAmt = 0;
    if (sav.withdraw) {
      withdrawAmt = p.savings_balance;
      const payDate = new Date(`${month}-01`);
      if (payDate.getMonth() === 11 && p.savings_balance >= 5500) {
        withdrawAmt += 1375;
      }
    }
    return (p.net_pay - advTotal - deposit + withdrawAmt).toFixed(2);
  };

  const fetchPayroll = async (m) => {
    try {
      const res = await axios.get(`/api/payroll/monthly?month=${m}`);
      const sorted = res.data.sort((a, b) => {
        if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
        if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
        return a.employee_id - b.employee_id;
      });
      setPayroll(sorted);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลเงินเดือน');
    }
  };

  const fetchSemiPayroll = async (m, period) => {
    try {
      const p = period === '16-สิ้นเดือน' ? 'second' : 'first';
      const res = await axios.get(`/api/payroll/semi-monthly?month=${m}&period=${p}`);
      const sorted = res.data.sort((a, b) => {
        if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
        if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
        return a.employee_id - b.employee_id;
      });
      setPayroll(sorted);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลเงินเดือน');
    }
  };

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const { data } = await axios.get('/api/deductions/types');
        setDeductionTypes(data.filter(t => t.is_active));
      } catch (err) {
        console.error(err);
      }
    };
    loadTypes();
  }, []);

  useEffect(() => {
    if (cycle === 'รายเดือน') {
      fetchPayroll(month);
    } else {
      fetchSemiPayroll(month, halfPeriod);
    }
  }, [cycle, month, halfPeriod]);


  const handleConfirm = async (id) => {
    if (!window.confirm('เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้')) return;
    const adv = advanceInputs[id] || {};
    const advArr = Object.keys(adv).map((key) => ({
      id: parseInt(key, 10),
      amount: adv[key].amount || 0,
      remark: adv[key].remark || '',
    }));
    const sav = savingInputs[id] || {};
    const payload = {
      employeeId: id,
      month,
      advanceDeductions: advArr,
      savingsWithdraw: sav.withdraw || false,
      savingsRemark: sav.remark || '',
    };
    try {
      if (cycle === 'รายเดือน') {
        await axios.post('/api/payroll/monthly/record', payload);
      } else {
        const p = halfPeriod === '16-สิ้นเดือน' ? 'second' : 'first';
        await axios.post('/api/payroll/semi-monthly/record', { ...payload, period: p });
      }
      alert('บันทึกสำเร็จ');
      setPayroll((prev) => prev.filter((p) => p.employee_id !== id));
    } catch (err) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const renderIncomeHeader = () => (
    <tr className="bg-gray-100">
      <th className="px-2 py-2 text-left">ชื่อพนักงาน</th>
      <th className="px-2 py-2">วันทำงาน</th>
      <th className="px-2 py-2">ชั่วโมง</th>
      <th className="px-2 py-2">เบี้ยขยัน</th>
      <th className="px-2 py-2">ค่าแรงรวม</th>
      <th className="px-2 py-2">OT(ชม.)</th>
      <th className="px-2 py-2">ค่า OT</th>
      <th className="px-2 py-2">อาทิตย์(วัน)</th>
      <th className="px-2 py-2">ค่าอาทิตย์</th>
      <th className="px-2 py-2">รวมรายได้</th>
      <th colSpan={10} />
    </tr>
  );

  const renderDeductionHeader = (showDeduction) => (
    <tr className="bg-gray-100">
      {showDeduction && (
        <>
          <th className="px-2 py-2">ค่าน้ำ</th>
          <th className="px-2 py-2">ค่าไฟ</th>
          {deductionTypes.map((d) => (
            <th key={d.id} className="px-2 py-2">
              {`${d.name} (${parseFloat(d.rate)}%)`}
            </th>
          ))}
          <th className="px-2 py-2">เงินเบิก</th>
          <th className="px-2 py-2">เงินเก็บสะสม</th>
          <th className="px-2 py-2">รวมยอดหัก</th>
          <th colSpan={12}/>
        </>
      )}
    </tr>
  );

  const renderNetHeader = () => (
    <tr className="bg-gray-100">
      <th className="px-2 py-2">รับสุทธิ</th>
      <th colSpan={20} />
    </tr>
  );

  const renderPayrollTable = (data, showDeduction = true) => (
    <table className="min-w-full bg-white shadow rounded text-sm border border-gray-300">
      <style>
        {`
          .${fixedRowClass} {
            height: ${TABLE_ROW_HEIGHT}px;
            min-height: ${TABLE_ROW_HEIGHT}px;
          }
          .payroll-bordered th, .payroll-bordered td {
            border: 1px solid #d1d5db;
          }
        `}
      </style>
      <tbody className="payroll-bordered">
        {data.map((p) => (
          <React.Fragment key={p.employee_id}>
            {renderIncomeHeader()}
            <tr className={`border-t ${fixedRowClass}`}>
              <td rowSpan="5" className="px-2 py-1">
                {`${p.first_name} ${p.last_name}${p.nickname ? `(${p.nickname})` : ''}`}
              </td>
              <td className="px-2 py-1 text-center">{p.days_worked}</td>
              <td className="px-2 py-1 text-center">{p.hours_worked}</td>
              <td className="px-2 py-1 text-center">{p.bonus_count}</td>
              <td className="px-2 py-1 text-center">{p.base_pay.toFixed(2)}</td>
              <td className="px-2 py-1 text-center">{p.ot_hours}</td>
              <td className="px-2 py-1 text-center">{p.ot_pay.toFixed(2)}</td>
              <td className="px-2 py-1 text-center">{p.sunday_days}</td>
              <td className="px-2 py-1 text-center">{p.sunday_pay.toFixed(2)}</td>
              <td className="px-2 py-1 text-center text-green-800 font-bold">{p.total_income.toFixed(2)}</td>
            </tr>
            {renderDeductionHeader(showDeduction)}
              {showDeduction && (
                <tr className={fixedRowClass}>
                  <>
                    <td className="px-2 py-1 text-center">{p.water_deduction.toFixed(2)}</td>
                    <td className="px-2 py-1 text-center">{p.electric_deduction.toFixed(2)}</td>
                    {deductionTypes.map((d) => {
                      const detail = p.deduction_details.find((dd) => dd.name === d.name);
                      return (
                        <td key={`${p.employee_id}-${d.id}`} className="px-2 py-1 text-center">
                          {detail ? detail.amount.toFixed(2) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center">
                      {p.advances && p.advances.length > 0 ? (
                        p.advances.map((a) => (
                          <div key={a.id} className="mb-1">
                            <div className="text-xs">{a.name}</div>
                            <input
                              type="number"
                              className="border p-1 w-20"
                              value={advanceInputs[p.employee_id]?.[a.id]?.amount || ''}
                              onChange={(e) =>
                                setAdvanceInputs((prev) => ({
                                  ...prev,
                                  [p.employee_id]: {
                                    ...(prev[p.employee_id] || {}),
                                    [a.id]: {
                                      ...(prev[p.employee_id]?.[a.id] || {}),
                                      amount: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="border p-1 w-20 mt-1"
                              placeholder="หมายเหตุ"
                              value={advanceInputs[p.employee_id]?.[a.id]?.remark || ''}
                              onChange={(e) =>
                                setAdvanceInputs((prev) => ({
                                  ...prev,
                                  [p.employee_id]: {
                                    ...(prev[p.employee_id] || {}),
                                    [a.id]: {
                                      ...(prev[p.employee_id]?.[a.id] || {}),
                                      remark: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                            <div className="text-xs">
                              คงเหลือ {(
                                a.total_amount -
                                (parseFloat(advanceInputs[p.employee_id]?.[a.id]?.amount) || 0)
                              ).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <div className="mb-1 text-xs whitespace-pre-line">
                        {(() => {
                          const withdraw = savingInputs[p.employee_id]?.withdraw;
                          const depositAmt = withdraw ? 0 : p.savings_monthly_amount;
                          const newBal = withdraw ? 0 : p.savings_balance + depositAmt;
                          return `ฝาก ${depositAmt.toFixed(2)}\nยอดสะสม ${newBal.toFixed(2)}`;
                        })()}
                      </div>
                      <label className="text-xs mr-2">
                        <input
                          className='mr-1'
                          type="checkbox"
                          checked={savingInputs[p.employee_id]?.withdraw || false}
                          onChange={(e) =>
                            setSavingInputs((prev) => ({
                              ...prev,
                              [p.employee_id]: {
                                ...(prev[p.employee_id] || {}),
                                withdraw: e.target.checked,
                              },
                            }))
                          }
                        />
                        ถอน
                      </label>
                      <input
                        type="text"
                        className="border p-1 w-20"
                        placeholder="หมายเหตุ"
                        value={savingInputs[p.employee_id]?.remark || ''}
                        onChange={(e) =>
                          setSavingInputs((prev) => ({
                            ...prev,
                            [p.employee_id]: {
                              ...(prev[p.employee_id] || {}),
                              remark: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center text-red-800 font-bold">{p.deductions_total.toFixed(2)}</td>
                  </>
                </tr>
              )}
            
            {renderNetHeader()}
            <tr className={fixedRowClass}>
              <td className="px-2 py-1 text-center font-bold">{computeNetPay(p)}</td>
              <td className="px-2 py-1 text-center">
                <button
                  onClick={() => handleConfirm(p.employee_id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  ยืนยันบิล
                </button>
              </td>
            </tr>
            {!showDeduction && (
              <tr />
          )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6 text-black space-y-6">
      <h2 className="text-2xl font-semibold">จ่ายเงินเดือน</h2>
      {error && <div className="text-red-600">{error}</div>}

      <div className="mb-4">
        <label className="mr-2 font-semibold">รอบจ่าย</label>
        <select
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
          className="border p-2"
        >
          <option value="รายเดือน">รายเดือน</option>
          <option value="ครึ่งเดือน">ครึ่งเดือน</option>
        </select>
      </div>
      {(cycle === 'รายเดือน' || cycle === 'ครึ่งเดือน') && (
        <div className="mb-4">
          <label className="mr-2 font-semibold">เดือน</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2"
          />
        </div>
      )}

      {cycle === 'ครึ่งเดือน' && (
        <div className="mb-4">
          <label className="mr-2 font-semibold">รอบ</label>
          <select
            value={halfPeriod}
            onChange={(e) => setHalfPeriod(e.target.value)}
            className="border p-2"
          >
            <option value="1-15">1-15</option>
            <option value="16-สิ้นเดือน">16-สิ้นเดือน</option>
          </select>
        </div>
      )}

      {payroll.length > 0 ? (
        renderPayrollTable(payroll, cycle === 'รายเดือน' || halfPeriod === '16-สิ้นเดือน')
      ) : (
        <p className="text-red-500">ไม่พบข้อมูลเงินเดือน</p>
      )}
    </div>
  );
}

export default PayrollPage;
