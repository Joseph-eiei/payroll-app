import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatThaiMonth, getNextMonth } from '../utils/date';

function DeductionManagementPage() {
  const [types, setTypes] = useState([]);
  const [typeForm, setTypeForm] = useState({ id: null, name: '', rate: '', is_active: true });
  const [waterCharges, setWaterCharges] = useState([]);
  const [electricCharges, setElectricCharges] = useState([]);
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
      const waterRes = await axios.get('/api/deductions/water');
      const waterData = waterRes.data.map((c) => ({
        ...c,
        billFile: null,
        water_charge: '',
        bill_month: getNextMonth(c.bill_month || new Date().toISOString().slice(0, 7)),
      }));

      const eleRes = await axios.get('/api/deductions/electric');
      const electricData = eleRes.data.map((c) => ({
        ...c,
        last_unit: c.current_unit,
        current_unit: '',
        bill_month: getNextMonth(c.bill_month || new Date().toISOString().slice(0, 7)),
        lastBillFile: null,
        currentBillFile: null,
      }));

      setWaterCharges(waterData);
      setElectricCharges(electricData);

      return { waterData, electricData };
    } catch (err) {
      console.error(err);
      setError('โหลดค่าน้ำค่าไฟไม่สำเร็จ');
      return { waterData: [], electricData: [] };
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

  const handleChargeChange = (type, idx, field, value) => {
    if (type === 'water') {
      setWaterCharges((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], [field]: value };
        return arr;
      });
    } else {
      setElectricCharges((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], [field]: value };
        return arr;
      });
    }
  };

  const handleFileChange = (type, idx, field, file) => {
    if (type === 'water') {
      setWaterCharges((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], [field]: file };
        return arr;
      });
    } else {
      setElectricCharges((prev) => {
        const arr = [...prev];
        arr[idx] = { ...arr[idx], [field]: file };
        return arr;
      });
    }
  };

  const addWater = () => {
    setWaterCharges((prev) => [
      ...prev,
      {
        address_name: '',
        water_charge: '',
        bill_image: null,
        bill_month: new Date().toISOString().slice(0,7),
        billFile: null,
        isNew: true,
      },
    ]);
  };

  const addElectric = () => {
    setElectricCharges((prev) => [
      ...prev,
      {
        address_name: '',
        last_unit: 0,
        current_unit: 0,
        bill_last_image: null,
        bill_current_image: null,
        bill_month: new Date().toISOString().slice(0,7),
        lastBillFile: null,
        currentBillFile: null,
        isNew: true,
      },
    ]);
  };

  const deleteWaterCharge = async (charge) => {
    if (charge.isNew) {
      setWaterCharges((prev) => prev.filter((c) => c !== charge));
      return;
    }
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    try {
      await axios.delete(`/api/deductions/water/${encodeURIComponent(charge.address_name)}`);
      fetchCharges();
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถลบรายการค่าน้ำได้');
    }
  };

  const deleteElectricCharge = async (charge) => {
    if (charge.isNew) {
      setElectricCharges((prev) => prev.filter((c) => c !== charge));
      return;
    }
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    try {
      await axios.delete(`/api/deductions/electric/${encodeURIComponent(charge.address_name)}`);
      fetchCharges();
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถลบรายการค่าไฟได้');
    }
  };

  const saveWater = async (c) => {
    try {
      const formData = new FormData();
      formData.append('water_charge', c.water_charge);
      formData.append('bill_month', c.bill_month);
      if (c.billFile) formData.append('bill', c.billFile);

      await axios.put(`/api/deductions/water/${encodeURIComponent(c.address_name)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const { waterData } = await fetchCharges();
      setWaterCharges(waterData.map((w) =>
        w.address_name === c.address_name ? { ...w, bill_image: null } : w
      ));
      alert('บันทึกค่าน้ำสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('บันทึกค่าน้ำไม่สำเร็จ');
    }
  };

  const saveElectric = async (c) => {
    try {
      const formData = new FormData();
      formData.append('current_unit', c.current_unit);
      formData.append('bill_month', c.bill_month);
      if (c.lastBillFile) formData.append('lastBill', c.lastBillFile);
      if (c.currentBillFile) formData.append('currentBill', c.currentBillFile);

      await axios.put(`/api/deductions/electric/${encodeURIComponent(c.address_name)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const { electricData } = await fetchCharges();
      setElectricCharges(electricData.map((e) =>
        e.address_name === c.address_name ? { ...e, bill_last_image: null, bill_current_image: null } : e
      ));
      alert('บันทึกค่าไฟสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('บันทึกค่าไฟไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans text-black">
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

      <h2 className="text-2xl font-semibold mb-2">ค่าน้ำ</h2>
      <button onClick={addWater} className="mb-2 bg-green-600 text-white px-3 py-1 rounded">เพิ่มค่าน้ำ</button>
      <table className="min-w-full bg-white shadow mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ที่อยู่</th>
            <th className="px-4 py-2 text-left">เดือน</th>
            <th className="px-4 py-2 text-left">ค่าน้ำ</th>
            <th className="px-4 py-2 text-left">บิลน้ำ</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {waterCharges.map((c, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-2">
                {c.isNew ? (
                  <input
                    type="text"
                    value={c.address_name}
                    onChange={(e) => handleChargeChange('water', idx, 'address_name', e.target.value)}
                    className="border p-1"
                  />
                ) : (
                  c.address_name
                )}
              </td>
              <td className="px-4 py-2">
                <input
                  type="month"
                  value={c.bill_month}
                  onChange={(e) => handleChargeChange('water', idx, 'bill_month', e.target.value)}
                  className="border p-1 w-40"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {formatThaiMonth(c.bill_month)}
                </div>
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={c.water_charge}
                  onChange={(e) => handleChargeChange('water', idx, 'water_charge', e.target.value)}
                  className="border p-1 w-24"
                />
              </td>
              <td className="px-4 py-2">
                {c.bill_image && (
                  <img
                    src={`/uploads/${c.bill_image}`}
                    alt="บิลน้ำ"
                    className="max-h-24 mb-1"
                  />
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange('water', idx, 'billFile', e.target.files[0])}
                  className="mt-1"
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <button onClick={() => saveWater(c)} className="bg-sky-600 text-white px-3 py-1 rounded mr-2">
                  บันทึก
                </button>
                <button onClick={() => deleteWaterCharge(c)} className="text-red-600">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold mb-2">ค่าไฟ</h2>
      <button onClick={addElectric} className="mb-2 bg-green-600 text-white px-3 py-1 rounded">เพิ่มค่าไฟ</button>
      <table className="min-w-full bg-white shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ที่อยู่</th>
            <th className="px-4 py-2 text-left">เดือน</th>
            <th className="px-4 py-2 text-left">หน่วยก่อนหน้า</th>
            <th className="px-4 py-2 text-left">หน่วยปัจจุบัน</th>
            <th className="px-4 py-2 text-left">บิลก่อน</th>
            <th className="px-4 py-2 text-left">บิลปัจจุบัน</th>
            <th className="px-4 py-2 text-left">ยอดค่าไฟ</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {electricCharges.map((c, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-2">
                {c.isNew ? (
                  <input
                    type="text"
                    value={c.address_name}
                    onChange={(e) => handleChargeChange('electric', idx, 'address_name', e.target.value)}
                    className="border p-1"
                  />
                ) : (
                  c.address_name
                )}
              </td>
              <td className="px-4 py-2">
                <input
                  type="month"
                  value={c.bill_month}
                  onChange={(e) => handleChargeChange('electric', idx, 'bill_month', e.target.value)}
                  className="border p-1 w-40"
                />
                <div className="text-xs text-gray-600 mt-1">
                  {formatThaiMonth(c.bill_month)}
                </div>
              </td>
              <td className="px-4 py-2">{c.last_unit}</td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  value={c.current_unit}
                  onChange={(e) => handleChargeChange('electric', idx, 'current_unit', e.target.value)}
                  className="border p-1 w-24"
                />
              </td>
              <td className="px-4 py-2">
                {c.bill_last_image && (
                  <img
                    src={`/uploads/${c.bill_last_image}`}
                    alt="บิลก่อนหน้า"
                    className="max-h-24 mb-1"
                  />
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange('electric', idx, 'lastBillFile', e.target.files[0])}
                  className="mt-1"
                />
              </td>
              <td className="px-4 py-2">
                {c.bill_current_image && (
                  <img
                    src={`/uploads/${c.bill_current_image}`}
                    alt="บิลปัจจุบัน"
                    className="max-h-24 mb-1"
                  />
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange('electric', idx, 'currentBillFile', e.target.files[0])}
                  className="mt-1"
                />
              </td>
              <td className="px-4 py-2">{((c.current_unit - c.last_unit) * 5).toFixed(2)}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <button onClick={() => saveElectric(c)} className="bg-sky-600 text-white px-3 py-1 rounded mr-2">
                  บันทึก
                </button>
                <button onClick={() => deleteElectricCharge(c)} className="text-red-600">ลบ</button>
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
