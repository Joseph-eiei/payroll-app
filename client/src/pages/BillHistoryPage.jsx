import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BillHistoryPage() {
  const [waterAddresses, setWaterAddresses] = useState([]);
  const [electricAddresses, setElectricAddresses] = useState([]);
  const [selectedWater, setSelectedWater] = useState('');
  const [selectedElectric, setSelectedElectric] = useState('');
  const [waterBills, setWaterBills] = useState([]);
  const [electricBills, setElectricBills] = useState([]);
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    try {
      const wRes = await axios.get('/api/deductions/water');
      const eRes = await axios.get('/api/deductions/electric');
      setWaterAddresses(wRes.data.map((d) => d.address_name));
      setElectricAddresses(eRes.data.map((d) => d.address_name));
    } catch (err) {
      console.error(err);
      setError('โหลดข้อมูลไม่สำเร็จ');
    }
  };

  const fetchWaterHistory = async (addr) => {
    if (!addr) return;
    try {
      const res = await axios.get(`/api/deductions/water/history/${encodeURIComponent(addr)}`);
      setWaterBills(res.data);
    } catch (err) {
      console.error(err);
      setError('โหลดประวัติค่าน้ำไม่สำเร็จ');
    }
  };

  const fetchElectricHistory = async (addr) => {
    if (!addr) return;
    try {
      const res = await axios.get(`/api/deductions/electric/history/${encodeURIComponent(addr)}`);
      setElectricBills(res.data);
    } catch (err) {
      console.error(err);
      setError('โหลดประวัติค่าไฟไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    fetchWaterHistory(selectedWater);
  }, [selectedWater]);

  useEffect(() => {
    fetchElectricHistory(selectedElectric);
  }, [selectedElectric]);

  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4">ประวัติค่าน้ำค่าไฟ</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">ค่าน้ำ</h3>
        <select
          value={selectedWater}
          onChange={(e) => setSelectedWater(e.target.value)}
          className="border p-2 mb-2"
        >
          <option value="">เลือกที่อยู่</option>
          {waterAddresses.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {selectedWater && (
          <table className="min-w-full bg-white shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">เดือน</th>
                <th className="px-4 py-2 text-left">ค่าน้ำ</th>
                <th className="px-4 py-2 text-left">บิล</th>
              </tr>
            </thead>
            <tbody>
              {waterBills.map((b, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{b.bill_month}</td>
                  <td className="px-4 py-2">{b.water_charge}</td>
                  <td className="px-4 py-2">
                    {b.bill_image && (
                      <img
                        src={`/uploads/${b.bill_image}`}
                        alt="บิลน้ำ"
                        className="max-h-24"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">ค่าไฟ</h3>
        <select
          value={selectedElectric}
          onChange={(e) => setSelectedElectric(e.target.value)}
          className="border p-2 mb-2"
        >
          <option value="">เลือกที่อยู่</option>
          {electricAddresses.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {selectedElectric && (
          <table className="min-w-full bg-white shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">เดือน</th>
                <th className="px-4 py-2 text-left">หน่วยก่อนหน้า</th>
                <th className="px-4 py-2 text-left">หน่วยปัจจุบัน</th>
                <th className="px-4 py-2 text-left">บิลก่อน</th>
                <th className="px-4 py-2 text-left">บิลปัจจุบัน</th>
                <th className="px-4 py-2 text-left">ยอดค่าไฟ</th>
              </tr>
            </thead>
            <tbody>
              {electricBills.map((b, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{b.bill_month}</td>
                  <td className="px-4 py-2">{b.last_unit}</td>
                  <td className="px-4 py-2">{b.current_unit}</td>
                  <td className="px-4 py-2">
                    {b.bill_last_image && (
                      <img
                        src={`/uploads/${b.bill_last_image}`}
                        alt="บิลก่อนหน้า"
                        className="max-h-24"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {b.bill_current_image && (
                      <img
                        src={`/uploads/${b.bill_current_image}`}
                        alt="บิลปัจจุบัน"
                        className="max-h-24"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {((b.last_unit - b.current_unit) * 5).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BillHistoryPage;
