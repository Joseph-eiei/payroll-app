import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState('รายเดือน');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [halfPeriod, setHalfPeriod] = useState('1-15');
  const [deductionTypes, setDeductionTypes] = useState([]);


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
    try {
      if (cycle === 'รายเดือน') {
        await axios.post('/api/payroll/monthly/record', { employeeId: id, month });
      } else {
        const p = halfPeriod === '16-สิ้นเดือน' ? 'second' : 'first';
        await axios.post('/api/payroll/semi-monthly/record', { employeeId: id, month, period: p });
      }
      alert('บันทึกสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ');
    }
  };

  const renderPayrollTable = (data, showDeduction = true) => (
    <table className="min-w-full bg-white shadow rounded text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-2 py-2">รหัส</th>
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
          {showDeduction && <th className="px-2 py-2">ค่าน้ำ</th>}
          {showDeduction && <th className="px-2 py-2">ค่าไฟ</th>}
          {showDeduction &&
            deductionTypes.map((d) => (
              <th key={d.id} className="px-2 py-2">
                {`${d.name} (${parseFloat(d.rate)}%)`}
              </th>
            ))}
          {showDeduction && <th className="px-2 py-2">รวมยอดหัก</th>}
          <th className="px-2 py-2">รับสุทธิ</th>
          <th className="px-2 py-2" />
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.employee_id} className="border-t">
            <td className="px-2 py-1 text-center">{p.employee_id}</td>
            <td className="px-2 py-1">{p.name}</td>
            <td className="px-2 py-1 text-center">{p.days_worked}</td>
            <td className="px-2 py-1 text-center">{p.hours_worked}</td>
            <td className="px-2 py-1 text-center">{p.bonus_count}</td>
            <td className="px-2 py-1 text-right">{p.base_pay.toFixed(2)}</td>
            <td className="px-2 py-1 text-center">{p.ot_hours}</td>
            <td className="px-2 py-1 text-right">{p.ot_pay.toFixed(2)}</td>
            <td className="px-2 py-1 text-center">{p.sunday_days}</td>
            <td className="px-2 py-1 text-right">{p.sunday_pay.toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{p.total_income.toFixed(2)}</td>
            {showDeduction && (
              <td className="px-2 py-1 text-right">{p.water_deduction.toFixed(2)}</td>
            )}
            {showDeduction && (
              <td className="px-2 py-1 text-right">{p.electric_deduction.toFixed(2)}</td>
            )}
            {showDeduction &&
              deductionTypes.map((d) => {
                const detail = p.deduction_details.find((dd) => dd.name === d.name);
                return (
                  <td key={d.id} className="px-2 py-1 text-right">
                    {detail ? detail.amount.toFixed(2) : '0.00'}
                  </td>
                );
              })}
            {showDeduction && (
              <td className="px-2 py-1 text-right">{p.deductions_total.toFixed(2)}</td>
            )}
            <td className="px-2 py-1 text-right">{p.net_pay.toFixed(2)}</td>
            <td className="px-2 py-1 text-center">
              <button
                onClick={() => handleConfirm(p.employee_id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
              >
                ยืนยันบิล
              </button>
            </td>
          </tr>
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
