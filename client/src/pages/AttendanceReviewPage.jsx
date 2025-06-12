import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AttendanceReviewPage() {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState('');
  const [editingForm, setEditingForm] = useState(null);
  const [editData, setEditData] = useState(null);

  const fetchForms = async () => {
    try {
      const res = await axios.get('/api/attendance/pending');
      setForms(res.data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleVerify = async (id) => {
    if (!window.confirm('ยืนยันข้อมูลนี้?')) return;
    try {
      await axios.put(`/api/attendance/${id}/verify`);
      fetchForms();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยืนยัน');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ลบฟอร์มนี้?')) return;
    try {
      await axios.delete(`/api/attendance/${id}`);
      fetchForms();
    } catch (err) {
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
      await axios.put(`/api/attendance/${editingForm}`, {
        siteName: editData.siteName,
        attendanceDate: editData.attendanceDate,
        siteSupervisorId: editData.siteSupervisorId,
        supervisorCheckIn: editData.supervisorCheckIn,
        supervisorCheckOut: editData.supervisorCheckOut,
        supervisorOT: editData.supervisorOT,
        supervisorRemarks: editData.supervisorRemarks,
        employeeAttendances: JSON.stringify(editData.employees)
      });
      setEditingForm(null);
      setEditData(null);
      fetchForms();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-4">ตรวจสอบการลงชื่อทำงาน</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        {forms.map(form => (
          <div key={form.id} className="border p-4 rounded bg-white shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-medium">{form.site_name} - {form.attendance_date.slice(0,10)}</p>
                <p className="text-sm text-gray-600">หัวหน้าไซต์: {form.site_supervisor_id || '-'}</p>
                <p className="text-sm text-gray-600">เข้า: {form.supervisor_check_in || '-'} ออก: {form.supervisor_check_out || '-'}</p>
                <p className="text-sm text-gray-600">OT: {form.supervisor_ot || '-'} หมายเหตุ: {form.supervisor_remarks || '-'}</p>
                {form.employees.length > 0 && (
                  <table className="mt-2 w-full text-sm text-left">
                    <thead>
                      <tr>
                        <th className="border px-2">รหัสพนักงาน</th>
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
                <button className="text-green-700" onClick={() => handleVerify(form.id)}>ยืนยัน</button>
                <button className="text-blue-700" onClick={() => openEdit(form)}>แก้ไข</button>
                <button className="text-red-700" onClick={() => handleDelete(form.id)}>ลบ</button>
              </div>
            </div>
            {editingForm === form.id && editData && (
              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={editData.siteName} onChange={(e)=>handleEditChange('siteName', e.target.value)} className="border p-2" placeholder="ชื่อไซต์งาน" required />
                  <input type="date" value={editData.attendanceDate} onChange={(e)=>handleEditChange('attendanceDate', e.target.value)} className="border p-2" required />
                  <input type="text" value={editData.siteSupervisorId} onChange={(e)=>handleEditChange('siteSupervisorId', e.target.value)} className="border p-2" placeholder="รหัสหัวหน้าไซต์" />
                  <input type="time" value={editData.supervisorCheckIn} onChange={(e)=>handleEditChange('supervisorCheckIn', e.target.value)} className="border p-2" />
                  <input type="time" value={editData.supervisorCheckOut} onChange={(e)=>handleEditChange('supervisorCheckOut', e.target.value)} className="border p-2" />
                  <input type="number" step="0.1" value={editData.supervisorOT} onChange={(e)=>handleEditChange('supervisorOT', e.target.value)} className="border p-2" placeholder="OT (ชม.)" />
                  <input type="text" value={editData.supervisorRemarks} onChange={(e)=>handleEditChange('supervisorRemarks', e.target.value)} className="border p-2" placeholder="หมายเหตุหัวหน้า" />
                </div>
                {editData.employees.map((emp, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <input type="text" value={emp.employeeId} onChange={(e)=>handleEmpChange(idx,'employeeId',e.target.value)} className="border p-2" placeholder="ID พนักงาน" />
                    <input type="time" value={emp.checkIn} onChange={(e)=>handleEmpChange(idx,'checkIn',e.target.value)} className="border p-2" />
                    <input type="time" value={emp.checkOut} onChange={(e)=>handleEmpChange(idx,'checkOut',e.target.value)} className="border p-2" />
                    <input type="number" step="0.1" value={emp.otHours} onChange={(e)=>handleEmpChange(idx,'otHours',e.target.value)} className="border p-2" />
                    <input type="text" value={emp.remarks} onChange={(e)=>handleEmpChange(idx,'remarks',e.target.value)} className="border p-2" placeholder="หมายเหตุ" />
                    <button type="button" onClick={()=>removeEmpRow(idx)} className="text-red-600">ลบ</button>
                  </div>
                ))}
                <button type="button" onClick={addEmpRow} className="text-sm text-blue-700">+ เพิ่มพนักงาน</button>
                <div className="space-x-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">บันทึก</button>
                  <button type="button" onClick={()=>{setEditingForm(null);setEditData(null);}} className="bg-gray-300 px-4 py-2 rounded">ยกเลิก</button>
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
