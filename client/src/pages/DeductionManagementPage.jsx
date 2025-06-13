import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DeductionManagementPage() {
  const [types, setTypes] = useState([]);
  const [typeForm, setTypeForm] = useState({ id: null, name: '', rate: '', is_active: true });
  const [charges, setCharges] = useState([]);
  const [error, setError] = useState('');

  const fetchTypes = async () => {
    try {
      const { data } = await axios.get('/api/deductions/types');
      setTypes(data);
    } catch (err) {
      console.error(err);
      setError('โหลดข้อมูลการหักเงินไม่สำเร็จ');
    }
  };

  const fetchCharges = async () => {
    try {
      const { data } = await axios.get('/api/deductions/accommodation');
      setCharges(
        data.map((c) => ({ ...c, waterBillFile: null, electricBillFile: null }))
      );
    } catch (err) {
      console.error(err);
      setError('โหลดค่าน้ำค่าไฟไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchCharges();
  }, []);

  const handleTypeFormChange = (e) => {
    const { name, value } = e.target;
    setTypeForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveType = async (e) => {
    e.preventDefault();
    try {
      if (typeForm.id) {
        await axios.put(`/api/deductions/types/${typeForm.id}`, {
          name: typeForm.name,
          rate: typeForm.rate,
          is_active: typeForm.is_active,
        });
      } else {
        await axios.post('/api/deductions/types', {
          name: typeForm.name,
          rate: typeForm.rate,
          is_active: typeForm.is_active,
        });
      }
      setTypeForm({ id: null, name: '', rate: '', is_active: true });
      fetchTypes();
    } catch (err) {
      console.error(err);
      setError('บันทึกข้อมูลการหักเงินไม่สำเร็จ');
    }
  };

  const editType = (t) => {
    setTypeForm({ id: t.id, name: t.name, rate: t.rate, is_active: t.is_active });
  };

  const deleteType = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    try {
      await axios.delete(`/api/deductions/types/${id}`);
      fetchTypes();
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถลบรายการได้');
    }
  };

  const handleChargeChange = (idx, field, value) => {
    setCharges((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
  };

  const handleFileChange = (idx, field, file) => {
    setCharges((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: file };
      return arr;
    });
  };

  const saveCharge = async (c) => {
    try {
      const formData = new FormData();
      formData.append('water_charge', c.water_charge);
      formData.append('electric_charge', c.electric_charge);
      if (c.waterBillFile) formData.append('waterBill', c.waterBillFile);
      if (c.electricBillFile) formData.append('electricBill', c.electricBillFile);

      await axios.put(
        `/api/deductions/accommodation/${encodeURIComponent(c.accommodation_type)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      fetchCharges();
    } catch (err) {
      console.error(err);
      setError('บันทึกค่าน้ำค่าไฟไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans">
      <h2 className="text-2xl font-semibold mb-4">จัดการประเภทการหักเงิน</h2>
      <form onSubmit={saveType} className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          type="text"
          name="name"
          value={typeForm.name}
          onChange={handleTypeFormChange}
          placeholder="ชื่อการหัก"
          className="border p-2 flex-1 min-w-[150px]"
          required
        />
        <input
          type="number"
          name="rate"
          value={typeForm.rate}
          onChange={handleTypeFormChange}
          placeholder="อัตราหัก %"
          className="border p-2 w-28"
        />
        <select
          name="is_active"
          value={typeForm.is_active ? 'true' : 'false'}
          onChange={(e) => setTypeForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
          className="border p-2 w-28"
        >
          <option value="true">ใช้งาน</option>
          <option value="false">ไม่ใช้งาน</option>
        </select>
        <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">
          {typeForm.id ? 'บันทึก' : 'เพิ่ม'}
        </button>
      </form>
      <table className="min-w-full bg-white shadow mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ชื่อ</th>
            <th className="px-4 py-2 text-left">อัตราหัก (%)</th>
            <th className="px-4 py-2 text-left">สถานะ</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-4 py-2">{t.name}</td>
              <td className="px-4 py-2">{t.rate}</td>
              <td className="px-4 py-2">{t.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <button onClick={() => editType(t)} className="text-blue-600 mr-2">แก้ไข</button>
                <button onClick={() => deleteType(t.id)} className="text-red-600">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold mb-4">ค่าน้ำค่าไฟที่พัก</h2>
      <table className="min-w-full bg-white shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ที่พัก</th>
            <th className="px-4 py-2 text-left">ค่าน้ำ</th>
            <th className="px-4 py-2 text-left">ค่าไฟ</th>
            <th className="px-4 py-2 text-left">บิลน้ำ</th>
            <th className="px-4 py-2 text-left">บิลไฟ</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {charges.map((c, idx) => (
            <tr key={c.accommodation_type} className="border-t">
              <td className="px-4 py-2">{c.accommodation_type}</td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={c.water_charge}
                  onChange={(e) => handleChargeChange(idx, 'water_charge', e.target.value)}
                  className="border p-1 w-24"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={c.electric_charge}
                  onChange={(e) => handleChargeChange(idx, 'electric_charge', e.target.value)}
                  className="border p-1 w-24"
                />
              </td>
              <td className="px-4 py-2">
                {c.water_bill_image && (
                  <a href={`/uploads/${c.water_bill_image}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 mr-2">ดูรูป</a>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(idx, 'waterBillFile', e.target.files[0])}
                  className="mt-1"
                />
              </td>
              <td className="px-4 py-2">
                {c.electric_bill_image && (
                  <a href={`/uploads/${c.electric_bill_image}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 mr-2">ดูรูป</a>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(idx, 'electricBillFile', e.target.files[0])}
                  className="mt-1"
                />
              </td>
              <td className="px-4 py-2">
                <button onClick={() => saveCharge(c)} className="bg-sky-600 text-white px-3 py-1 rounded">
                  บันทึก
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  );
}

export default DeductionManagementPage;
