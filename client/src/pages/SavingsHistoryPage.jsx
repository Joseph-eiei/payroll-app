import React, { useEffect, useState } from 'react';
import axios from 'axios';

function SavingsHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState('');
  const [history, setHistory] = useState([]);
  const total = history.reduce(
    (sum, t) => sum + (t.is_deposit ? parseFloat(t.amount) : -parseFloat(t.amount)),
    0,
  );

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (empId) => {
    if (!empId) return;
    try {
      const res = await axios.get(`/api/savings/history/${empId}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchHistory(selected);
  }, [selected]);

  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4">ประวัติเงินเก็บสะสม</h2>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border p-2 mb-4"
      >
        <option value="">เลือกพนักงาน</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{`${e.first_name} ${e.last_name}`}</option>
        ))}
      </select>
      {history.length > 0 ? (
        <>
        <table className="min-w-full text-sm bg-white shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left">วันที่</th>
              <th className="px-2 py-1 text-left">จำนวน</th>
              <th className="px-2 py-1 text-left">ประเภท</th>
              <th className="px-2 py-1 text-left">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {history.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-2 py-1">{t.transaction_date}</td>
                <td className={`px-2 py-1 font-bold ${t.is_deposit ? 'text-green-600' : 'text-red-600'}`}>{t.amount}</td>
                <td className="px-2 py-1">{t.is_deposit ? 'ฝาก' : 'ถอน'}</td>
                <td className="px-2 py-1">{t.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-sm font-semibold">ยอดรวม {total.toFixed(2)}</div>
        </>
      ) : (
        selected && <div className="text-sm text-gray-500">ไม่มีประวัติ</div>
      )}
    </div>
  );
}

export default SavingsHistoryPage;
