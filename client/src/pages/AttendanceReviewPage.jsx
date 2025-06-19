import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AttendanceReviewPage() {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [editingForm, setEditingForm] = useState(null);
  const [editData, setEditData] = useState(null);
  const [employeesMap, setEmployeesMap] = useState({});
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  const handleBonusChange = (id, value) => {
    setForms(prev => prev.map(f => (f.id === id ? { ...f, is_bonus: value } : f)));
  };

  const fetchForms = async () => {
    try {
      const res = await axios.get('/api/attendance/pending');
      setForms(res.data);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const fetchEmployees = async () => {
    try {
      const [allRes, supRes, empRes, techRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/employees/role/หัวหน้างาน'),
        axios.get('/api/employees/role/พนักงาน'),
        axios.get('/api/employees/role/ช่าง'),
      ]);
      const map = {};
      allRes.data.forEach(e => {
        map[e.id] = `${e.first_name} ${e.last_name}`;
      });
      setEmployeesMap(map);
      setAvailableSupervisors(supRes.data);
      setAvailableEmployees([...empRes.data, ...techRes.data]);
    } catch (err) {
      console.error('failed to fetch employees', err);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchEmployees();
  }, []);

  const handleVerify = async (id, isBonus) => {
    if (!window.confirm('คุณต้องการยืนยันการลงชื่อไซต์ ใช่ไหม?')) return;
    try {
      await axios.put(`/api/attendance/${id}/verify`, { isBonus });
      fetchForms();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการยืนยัน');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('การลบฟอร์มนี้จะไม่สามารถแก้ไขทีหลังได้')) return;
    try {
      await axios.delete(`/api/attendance/${id}`);
      fetchForms();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const openEdit = (form) => {
    setEditingForm(form.id);
    setEditData({
      siteName: form.site_name,
      attendanceDate: form.attendance_date.slice(0,10),
      siteSupervisorId: form.site_supervisor_id || '',
      supervisorCheckIn: form.supervisor_check_in || '',
      supervisorCheckOut: form.supervisor_check_out || '',
      supervisorOT: form.supervisor_ot || '',
      supervisorRemarks: form.supervisor_remarks || '',
      currentImage: form.image_attachment || null,
      imageAttachment: null,
      employees: form.employees.map(e => ({
        employeeId: e.employeeId || '',
        checkIn: e.checkIn || '',
        checkOut: e.checkOut || '',
        otHours: e.otHours || '',
        remarks: e.remarks || ''
      }))
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (file) => {
    setEditData(prev => ({ ...prev, imageAttachment: file }));
  };

  const handleEmpChange = (index, field, value) => {
    const emps = [...editData.employees];
    emps[index][field] = value;
    setEditData({ ...editData, employees: emps });
  };

  const addEmpRow = () => {
    setEditData({
      ...editData,
      employees: [...editData.employees, { employeeId: '', checkIn: '', checkOut: '', otHours: '', remarks: '' }]
    });
  };

  const removeEmpRow = (idx) => {
    setEditData({
      ...editData,
      employees: editData.employees.filter((_, i) => i !== idx)
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('siteName', editData.siteName);
      formData.append('attendanceDate', editData.attendanceDate);
      formData.append('siteSupervisorId', editData.siteSupervisorId);
      formData.append('supervisorCheckIn', editData.supervisorCheckIn);
      formData.append('supervisorCheckOut', editData.supervisorCheckOut);
      formData.append('supervisorOT', editData.supervisorOT);
      formData.append('supervisorRemarks', editData.supervisorRemarks);
      formData.append('employeeAttendances', JSON.stringify(editData.employees));
      if (editData.imageAttachment) {
        formData.append('imageAttachment', editData.imageAttachment);
      }

      await axios.put(`/api/attendance/${editingForm}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingForm(null);
      setEditData(null);
      fetchForms();
      } catch (err) {
        console.error(err);
        alert('บันทึกไม่สำเร็จ');
      }
    };

  return (
    <div className="p-6 max-w-6xl mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-4">ตรวจสอบการลงชื่อทำงาน</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!error && forms.length === 0 && (
        <p className="text-red-500">ไม่พบข้อมูลที่รอการตรวจสอบ</p>
      )}
      <div className="space-y-4">
        {forms.map(form => (
          <div key={form.id} className="border p-4 rounded bg-white shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-medium">{form.site_name} - วันที่: {form.attendance_date.slice(8,10)}-{form.attendance_date.slice(5,7)}-{form.attendance_date.slice(0,4)}</p> {/*วัน-เดือน-ปี*/}
                <p className="text-sm text-gray-600">
                  หัวหน้าไซต์:
                  {form.site_supervisor_id ? `${employeesMap[form.site_supervisor_id] ? employeesMap[form.site_supervisor_id] + ' (' + form.site_supervisor_id + ')' : form.site_supervisor_id}` : '-'}
                </p>
                <p className="text-sm text-gray-600">เข้า: {form.supervisor_check_in || '-'} ออก: {form.supervisor_check_out || '-'}</p>
                <p className="text-sm text-gray-600">OT: {form.supervisor_ot || '-'} หมายเหตุ: {form.supervisor_remarks || '-'}</p>
                {form.is_sunday && (
                  <p className="text-sm text-red-600 font-bold">วันอาทิตย์</p>
                )}
                {form.image_attachment && (
                  <div className="mt-2">
                    <img
                      src={`/uploads/${form.image_attachment}`}
                      alt="แนบรูปไซต์"
                      className="max-h-48 rounded"
                    />
                  </div>
                )}
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_bonus || false}
                    onChange={e => handleBonusChange(form.id, e.target.checked)}
                  />
                  <span>เบี้ยขยัน</span>
                </label>
                {form.employees.length > 0 && (
                  <table className="mt-2 w-full text-sm text-left">
                    <thead>
                      <tr>
                        <th className="border px-2">รหัสพนักงาน</th>
                        <th className="border px-2">ชื่อพนักงาน</th>
                        <th className="border px-2">เข้า</th>
                        <th className="border px-2">ออก</th>
                        <th className="border px-2">OT</th>
                        <th className="border px-2">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.employees.map((emp, i) => (
                        <tr key={i}>
                          <td className="border px-2">{emp.employeeId}</td>
                          <td className="border px-2">{employeesMap[emp.employeeId] || '-'}</td>
                          <td className="border px-2">{emp.checkIn || '-'}</td>
                          <td className="border px-2">{emp.checkOut || '-'}</td>
                          <td className="border px-2">{emp.otHours || '-'}</td>
                          <td className="border px-2">{emp.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="space-x-2">
                <button className="text-green-500" onClick={() => handleVerify(form.id, form.is_bonus)}>ยืนยัน</button>
                <button className="text-blue-500" onClick={() => openEdit(form)}>แก้ไข</button>
                <button className="text-red-500" onClick={() => handleDelete(form.id)}>ลบ</button>
              </div>
            </div>
            {editingForm === form.id && editData && (
              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 bg-gray-50 p-4 rounded">
                <p className='text-2xl font-bold'>แก้ไข</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อไซต์งาน</label>
                    <input type="text" value={editData.siteName} onChange={(e)=>handleEditChange('siteName', e.target.value)} className="border p-2 w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">วันที่</label>
                    <input type="date" lang="en-GB" value={editData.attendanceDate} onChange={(e)=>handleEditChange('attendanceDate', e.target.value)} className="border p-2 w-full" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">หัวหน้าไซต์งาน</label>
                    <select value={editData.siteSupervisorId} onChange={(e)=>handleEditChange('siteSupervisorId', e.target.value)} className="border p-2 w-full">
                      <option value="">เลือกหัวหน้าไซต์</option>
                      {availableSupervisors.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เวลาเข้า (หัวหน้า)</label>
                    <input type="time" value={editData.supervisorCheckIn} onChange={(e)=>handleEditChange('supervisorCheckIn', e.target.value)} className="border p-2 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เวลาออก (หัวหน้า)</label>
                    <input type="time" value={editData.supervisorCheckOut} onChange={(e)=>handleEditChange('supervisorCheckOut', e.target.value)} className="border p-2 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">OT (ชม.)</label>
                    <input type="number" step="0.1" value={editData.supervisorOT} onChange={(e)=>handleEditChange('supervisorOT', e.target.value)} className="border p-2 w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุหัวหน้า</label>
                    <input type="text" value={editData.supervisorRemarks} onChange={(e)=>handleEditChange('supervisorRemarks', e.target.value)} className="border p-2 w-full" />
                  </div>
                </div>
                {editData.currentImage && (
                  <div className="mb-2">
                    <img
                      src={`/uploads/${editData.currentImage}`}
                      alt="แนบรูปไซต์"
                      className="max-h-40 rounded"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">แนบรูปใหม่ (ถ้ามี)</label>
                  <input type="file" onChange={(e)=>handleImageChange(e.target.files[0])} className="border p-2 w-full" />
                </div>
                {editData.employees.map((emp, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    <div className='flex items-center'>
                      <h3 className="่text-md font-medium text-gray-700">พนักงานคนที่ {idx + 1}</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">รายชื่อพนักงาน/ช่าง</label>
                      <select value={emp.employeeId} onChange={(e)=>handleEmpChange(idx,'employeeId',e.target.value)} className="border p-2 w-full">
                        <option value="">เลือกพนักงาน</option>
                        {availableEmployees.map(e => (
                          <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">เข้า</label>
                      <input type="time" value={emp.checkIn} onChange={(e)=>handleEmpChange(idx,'checkIn',e.target.value)} className="border p-2 w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ออก</label>
                      <input type="time" value={emp.checkOut} onChange={(e)=>handleEmpChange(idx,'checkOut',e.target.value)} className="border p-2 w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">OT</label>
                      <input type="number" step="0.1" value={emp.otHours} onChange={(e)=>handleEmpChange(idx,'otHours',e.target.value)} className="border p-2 w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ</label>
                      <input type="text" value={emp.remarks} onChange={(e)=>handleEmpChange(idx,'remarks',e.target.value)} className="border p-2 w-full" />
                    </div>
                    <button type="button" onClick={()=>removeEmpRow(idx)} className="text-red-600">ลบ</button>
                  </div>
                ))}
                <button type="button" onClick={addEmpRow} className="text-sm text-green-500">+ เพิ่มพนักงาน</button>
                <div className="space-x-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">บันทึก</button>
                  <button type="button" onClick={()=>{setEditingForm(null);setEditData(null);}} className="bg-gray-300 px-4 py-2 text-white rounded">ยกเลิก</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceReviewPage;
