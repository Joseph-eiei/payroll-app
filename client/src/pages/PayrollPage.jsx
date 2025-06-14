import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState('รายเดือน');

  const fetchEmployees = async (selectedCycle) => {
    try {
      const res = await axios.get(`/api/employees/cycle/${selectedCycle}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลพนักงาน');
    }
  };

  useEffect(() => {
    fetchEmployees(cycle);
  }, [cycle]);

  const renderTable = emps => (
    <table className="min-w-full bg-white shadow rounded">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">รหัส</th>
          <th className="px-4 py-2 text-left">ชื่อพนักงาน</th>
          <th className="px-4 py-2 text-left">ค่าแรง/วัน</th>
          <th className="px-4 py-2 text-left">เงินเดือนประมาณ</th>
        </tr>
      </thead>
      <tbody>
        {emps.map(e => (
          <tr key={e.id} className="border-t">
            <td className="px-4 py-2">{e.employee_code || e.id}</td>
            <td className="px-4 py-2">{e.first_name} {e.last_name}</td>
            <td className="px-4 py-2 text-right">{parseFloat(e.daily_wage).toFixed(2)}</td>
            <td className="px-4 py-2 text-right">
              {e.payment_cycle === 'รายเดือน'
                ? (e.daily_wage * 30).toFixed(2)
                : (e.daily_wage * 15).toFixed(2)}
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

      {employees.length > 0 ? (
        renderTable(employees)
      ) : (
        <p className="text-red-500">ไม่พบข้อมูลพนักงานรอบจ่าย{cycle}</p>
      )}
    </div>
  );
}

export default PayrollPage;
