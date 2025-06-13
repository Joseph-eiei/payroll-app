import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdvanceHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState('');
  const [history, setHistory] = useState([]);

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
      const res = await axios.get(`/api/advances/history/${empId}`);
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

  const grouped = history.reduce((acc, row) => {
    if (!acc[row.id]) acc[row.id] = { ...row, transactions: [] };
    if (row.tx_id) {
      acc[row.id].transactions.push({
        id: row.tx_id,
        amount: row.amount,
        date: row.transaction_date,
        remark: row.remark
      });
    }
    return acc;
  }, {});

  const list = Object.values(grouped);

  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4">ประวัติเงินเบิก</h2>
      <select value={selected} onChange={(e)=>setSelected(e.target.value)} className="border p-2 mb-4">
        <option value="">เลือกพนักงาน</option>
        {employees.map(e=> (
          <option key={e.id} value={e.id}>{`${e.first_name} ${e.last_name}`}</option>
        ))}
      </select>
      {list.map(adv => (
        <div key={adv.id} className="mb-6 bg-white shadow p-4 rounded">
          <div className="font-semibold mb-2">{adv.name} - ยอดคงเหลือ {adv.total_amount}</div>
          {adv.transactions.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">วันที่</th>
                  <th className="px-2 py-1 text-left">ประเภท</th>
                  <th className="px-2 py-1 text-left">จำนวน</th>
                  <th className="px-2 py-1 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {adv.transactions.map(t => {
                  const amt = Number(t.amount);
                  const isAdd = amt >= 0;
                  return (
                    <tr key={t.id} className="border-t">
                      <td className="px-2 py-1">{t.date}</td>
                      <td className="px-2 py-1">{isAdd ? 'เบิกเพิ่ม' : 'หักเงินเบิก'}</td>
                      <td className={`px-2 py-1 ${isAdd ? 'text-green-600' : 'text-red-600'}`}>{t.amount}</td>
                      <td className="px-2 py-1">{t.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-gray-500">ไม่มีประวัติ</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdvanceHistoryPage;
