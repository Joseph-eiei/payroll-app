import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PayrollHistoryPage() {
  const [cycle, setCycle] = useState('รายเดือน');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [error, setError] = useState('');

  const fetchHistory = async (m, c) => {
    try {
      if (c === 'รายเดือน') {
        const res = await axios.get(`/api/payroll/monthly/history?month=${m}`);
        setRecords(res.data);
      } else {
        const res = await axios.get(`/api/payroll/semi-monthly/history?month=${m}`);
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูล');
    }
  };

  useEffect(() => {
    fetchHistory(month, cycle);
  }, [cycle, month]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const { data } = await axios.get('/api/deductions/types');
        setDeductionTypes(data.filter((t) => t.is_active));
      } catch (err) {
        console.error(err);
      }
    };
    loadTypes();
  }, []);

  const renderTable = () => (
    <table className="min-w-full bg-white shadow rounded text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-2 py-2">รหัส</th>
          <th className="px-2 py-2 text-left">ชื่อพนักงาน</th>
          {cycle === 'ครึ่งเดือน' && <th className="px-2 py-2">รอบ</th>}
          <th className="px-2 py-2">วันทำงาน</th>
          <th className="px-2 py-2">ชั่วโมง</th>
          <th className="px-2 py-2">เบี้ยขยัน</th>
          <th className="px-2 py-2">ค่าแรงรวม</th>
          <th className="px-2 py-2">OT(ชม.)</th>
          <th className="px-2 py-2">ค่า OT</th>
          <th className="px-2 py-2">อาทิตย์(วัน)</th>
          <th className="px-2 py-2">ค่าอาทิตย์</th>
          <th className="px-2 py-2">รวมรายได้</th>
          <th className="px-2 py-2">ค่าน้ำ</th>
          <th className="px-2 py-2">ค่าไฟ</th>
          {deductionTypes.map((d) => (
            <th key={d.id} className="px-2 py-2">{`${d.name} (${parseFloat(d.rate)}%)`}</th>
          ))}
          <th className="px-2 py-2">เงินเบิก</th>
          <th className="px-2 py-2">เงินเก็บสะสม</th>
          <th className="px-2 py-2">รวมยอดหัก</th>
          <th className="px-2 py-2">รับสุทธิ</th>
        </tr>
      </thead>
      <tbody>
        {records.map((p) => (
          <tr key={`${p.employee_id}-${p.period || 'm'}`} className="border-t">
            <td className="px-2 py-1 text-center">{p.employee_id}</td>
            <td className="px-2 py-1">
              <div>{`${p.first_name} ${p.last_name}`}</div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {p.bank_account_name || '-'} {p.bank_account_number || ''} {p.bank_name || ''}
              </div>
            </td>
            {cycle === 'ครึ่งเดือน' && (
              <td className="px-2 py-1 text-center">
                {p.period === 'first' ? '1-15' : '16-สิ้นเดือน'}
              </td>
            )}
            <td className="px-2 py-1 text-center">{p.days_worked}</td>
            <td className="px-2 py-1 text-center">{p.hours_worked}</td>
            <td className="px-2 py-1 text-center">{p.bonus_count}</td>
            <td className="px-2 py-1 text-right">{Number(p.base_pay).toFixed(2)}</td>
            <td className="px-2 py-1 text-center">{p.ot_hours}</td>
            <td className="px-2 py-1 text-right">{Number(p.ot_pay).toFixed(2)}</td>
            <td className="px-2 py-1 text-center">{p.sunday_days}</td>
            <td className="px-2 py-1 text-right">{Number(p.sunday_pay).toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{Number(p.total_income).toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{Number(p.water_deduction).toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{Number(p.electric_deduction).toFixed(2)}</td>
            {deductionTypes.map((d) => {
              const detail = p.deduction_details?.find((dd) => dd.name === d.name);
              return (
                <td key={d.id} className="px-2 py-1 text-right">
                  {detail ? Number(detail.amount).toFixed(2) : '0.00'}
                </td>
              );
            })}
            <td className="px-2 py-1">
              {p.advance_details && p.advance_details.length > 0 ? (
                <div className="space-y-1">
                  {p.advance_details.map((a, idx) => (
                    <div key={idx} className="whitespace-nowrap">
                      {`${idx + 1}. ${a.name} หักเพิ่ม ${Number(a.amount).toLocaleString()} คงเหลือ ${Number(a.remaining).toFixed(2)}`}
                    </div>
                  ))}
                </div>
              ) : (
                Number(p.advance_total || 0).toFixed(2)
              )}
            </td>
            <td className="px-2 py-1 text-right">
              {p.savings_deposit > 0 && `ฝาก ${Number(p.savings_deposit).toFixed(2)}`}
              {p.savings_withdraw > 0 && `ถอน ${Number(p.savings_withdraw).toFixed(2)}`}
              {p.savings_deposit === 0 && p.savings_withdraw === 0 && '-'}
            </td>
            <td className="px-2 py-1 text-right">{Number(p.deductions_total).toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{Number(p.net_pay).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6 text-black space-y-6">
      <h2 className="text-2xl font-semibold">ประวัติเงินเดือน</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div className="mb-4">
        <label className="mr-2 font-semibold">รอบจ่าย</label>
        <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="border p-2">
          <option value="รายเดือน">รายเดือน</option>
          <option value="ครึ่งเดือน">ครึ่งเดือน</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="mr-2 font-semibold">เดือน</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2" />
      </div>
      {records.length > 0 ? renderTable() : <p className="text-red-500">ไม่พบข้อมูล</p>}
    </div>
  );
}

export default PayrollHistoryPage;
