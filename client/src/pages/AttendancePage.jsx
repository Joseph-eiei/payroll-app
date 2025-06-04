import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function AttendancePage() {
  const [siteName, setSiteName] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [siteSupervisor, setSiteSupervisor] = useState('');
  const [supervisorCheckIn, setSupervisorCheckIn] = useState('');
  const [supervisorCheckOut, setSupervisorCheckOut] = useState('');
  const [supervisorOT, setSupervisorOT] = useState('');
  const [supervisorRemarks, setSupervisorRemarks] = useState('');
  const [imageAttachment, setImageAttachment] = useState(null);

  const [employeeAttendances, setEmployeeAttendances] = useState([
    { employeeId: '', employeeName: '', checkIn: '', checkOut: '', otHours: '', remarks: '' },
  ]);

  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
                const supervisorsRes = await axios.get(`/api/employees/role/หัวหน้างาน`, { headers });
        const employeesRes = await axios.get(`/api/employees/role/พนักงาน`, { headers });
        const techniciansRes = await axios.get(`/api/employees/role/ช่าง`, { headers });
        
        setAvailableEmployees([...employeesRes.data, ...techniciansRes.data]);
        setAvailableSupervisors(supervisorsRes.data);

        // Using placeholder data for now
        // setAvailableSupervisors([{id: 'S1', first_name: 'สมชาย', last_name: 'ซุปเปอร์ไวเซอร์'}, {id: 'S2', first_name: 'สมหญิง', last_name: 'หัวหน้างาน'}]);
        // setAvailableEmployees([{id: 'E101', first_name: 'ลูกน้อง', last_name: 'หนึ่ง'}, {id: 'E102', first_name: 'ลูกน้อง', last_name: 'สอง'}]);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        // Consider setting an error state to inform the user
      }
    };
    fetchDropdownData();
  }, []);

  const handleAddEmployeeRow = () => {
    setEmployeeAttendances([
      ...employeeAttendances,
      { employeeId: '', employeeName: '', checkIn: '', checkOut: '', otHours: '', remarks: '' },
    ]);
  };

  const handleEmployeeChange = (index, field, value) => {
    const updatedAttendances = [...employeeAttendances];
    if (field === "employeeId") {
        const selectedEmp = availableEmployees.find(emp => emp.id.toString() === value.toString()); // Ensure ID comparison is robust
        updatedAttendances[index][field] = value;
        updatedAttendances[index]["employeeName"] = selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : '';
    } else {
        updatedAttendances[index][field] = value;
    }
    setEmployeeAttendances(updatedAttendances);
  };

  const handleRemoveEmployeeRow = (index) => {
    const updatedAttendances = employeeAttendances.filter((_, i) => i !== index);
    setEmployeeAttendances(updatedAttendances);
  };

  const handleFileChange = (event) => {
    setImageAttachment(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('siteName', siteName);
    formDataToSubmit.append('attendanceDate', attendanceDate);
    formDataToSubmit.append('siteSupervisorId', siteSupervisor);
    formDataToSubmit.append('supervisorCheckIn', supervisorCheckIn);
    formDataToSubmit.append('supervisorCheckOut', supervisorCheckOut);
    formDataToSubmit.append('supervisorOT', supervisorOT);
    formDataToSubmit.append('supervisorRemarks', supervisorRemarks);
    
    // Filter out empty rows before submitting
    const validEmployeeAttendances = employeeAttendances.filter(
      att => att.employeeId || att.checkIn || att.checkOut || att.otHours || att.remarks
    );
    formDataToSubmit.append('employeeAttendances', JSON.stringify(validEmployeeAttendances));

    if (imageAttachment) {
      formDataToSubmit.append('imageAttachment', imageAttachment);
    }

    console.log('Submitting Attendance Data (FormData):');
    for (let [key, value] of formDataToSubmit.entries()) {
        console.log(key, value);
    }
    
    try {
      // TODO: Implement actual API call
      // const response = await axios.post('/api/attendance', formDataToSubmit, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //     // Authorization header might be needed if this is a protected route
      //   },
      // });
      // console.log('Attendance submitted successfully:', response.data);
      alert('ข้อมูลการลงเวลาถูกส่ง (จำลอง)');
      // handleClearForm(); // Optionally clear form on success
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${error.response?.data?.msg || error.message}`);
    }
  };

  const handleClearForm = () => {
    setSiteName('');
    setAttendanceDate(new Date().toISOString().slice(0,10));
    setSiteSupervisor('');
    setSupervisorCheckIn('');
    setSupervisorCheckOut('');
    setSupervisorOT('');
    setSupervisorRemarks('');
    setEmployeeAttendances([{ employeeId: '', employeeName: '', checkIn: '', checkOut: '', otHours: '', remarks: '' }]);
    setImageAttachment(null);
    const fileInput = document.getElementById('imageAttachment');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-100 to-blue-200 py-8 px-4 sm:px-6 lg:px-8 font-sans  flex justify-center">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-sky-700 text-center sm:text-left">ลงชื่อเข้า-ออกงาน</h1>
          <Link
            to="/admin/login"
            className="bg-green-600 hover:bg-green-700 text-white! font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out w-full sm:w-auto text-center"
          >
            สำหรับผู้ดูแลระบบ
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site and Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">ชื่อไซต์งาน</label>
              <input
                type="text"
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="text-gray-900 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <input
                type="date"
                id="attendanceDate"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="text-gray-900 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              />
            </div>
          </div>

          {/* Supervisor Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลหัวหน้าไซต์งาน</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-3 items-end">
              <div className="lg:col-span-3">
                <label htmlFor="siteSupervisor" className="block text-xs font-medium text-gray-700 mb-1">หัวหน้าไซต์งาน</label>
                <select id="siteSupervisor" name="siteSupervisor" value={siteSupervisor} onChange={(e) => setSiteSupervisor(e.target.value)}
                  className="text-gray-900 mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  <option value="">เลือกหัวหน้าไซต์</option>
                  {availableSupervisors.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="supervisorCheckIn" className="block text-xs font-medium text-gray-700 mb-1">เวลาเข้า (หัวหน้า)</label>
                <input type="time" id="supervisorCheckIn" value={supervisorCheckIn} onChange={(e) => setSupervisorCheckIn(e.target.value)} className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" />
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="supervisorCheckOut" className="block text-xs font-medium text-gray-700 mb-1">เวลาออก (หัวหน้า)</label>
                <input type="time" id="supervisorCheckOut" value={supervisorCheckOut} onChange={(e) => setSupervisorCheckOut(e.target.value)} className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" />
              </div>
              <div className="lg:col-span-1">
                <label htmlFor="supervisorOT" className="block text-xs font-medium text-gray-700 mb-1">ชม. OT (หัวหน้า)</label>
                <input type="number" step="0.1" id="supervisorOT" value={supervisorOT} onChange={(e) => setSupervisorOT(e.target.value)} className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" placeholder="เช่น 1.5"/>
              </div>
              <div className="lg:col-span-4">
                <label htmlFor="supervisorRemarks" className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ (หัวหน้า)</label>
                <input type="text" id="supervisorRemarks" value={supervisorRemarks} onChange={(e) => setSupervisorRemarks(e.target.value)} className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm" placeholder="รายละเอียดเพิ่มเติม"/>
              </div>
            </div>
          </div>

          {/* Employee Attendance Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">รายชื่อพนักงาน / ช่าง</h2>
            {employeeAttendances.map((att, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 relative">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-md font-medium text-gray-700">พนักงานคนที่ {index + 1}</h3>
                    {employeeAttendances.length > 0 && ( 
                    <button
                        type="button"
                        onClick={() => handleRemoveEmployeeRow(index)}
                        className="text-red-500 hover:text-red-700 font-semibold p-1 rounded-full hover:bg-red-100 transition-colors -mt-1 -mr-1"
                        title="ลบรายการนี้"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-3 items-end">
                  <div className="lg:col-span-3">
                    <label htmlFor={`empId-${index}`} className="block text-xs font-medium text-gray-700 mb-1">รายชื่อพนักงาน/ช่าง</label>
                    <select
                      id={`empId-${index}`} name={`employeeAttendances[${index}].employeeId`} value={att.employeeId}
                      onChange={(e) => handleEmployeeChange(index, 'employeeId', e.target.value)}
                      className="text-gray-900 mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    >
                      <option value="">เลือกพนักงาน</option>
                      {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label htmlFor={`empCheckIn-${index}`} className="block text-xs font-medium text-gray-700 mb-1">เวลาเข้า</label>
                    <input type="time" id={`empCheckIn-${index}`} value={att.checkIn} onChange={(e) => handleEmployeeChange(index, 'checkIn', e.target.value)}
                      className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label htmlFor={`empCheckOut-${index}`} className="block text-xs font-medium text-gray-700 mb-1">เวลาออก</label>
                    <input type="time" id={`empCheckOut-${index}`} value={att.checkOut} onChange={(e) => handleEmployeeChange(index, 'checkOut', e.target.value)}
                      className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label htmlFor={`empOT-${index}`} className="block text-xs font-medium text-gray-700 mb-1">ชม. OT</label>
                    <input type="number" step="0.1" id={`empOT-${index}`} placeholder="เช่น 2" value={att.otHours}
                      onChange={(e) => handleEmployeeChange(index, 'otHours', e.target.value)}
                      className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <label htmlFor={`empRemarks-${index}`} className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ</label>
                    <input 
                        type="text"
                        id={`empRemarks-${index}`}
                        value={att.remarks}
                        onChange={(e) => handleEmployeeChange(index, 'remarks', e.target.value)}
                        className="text-gray-900 mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmployeeRow}
              className="mt-2 text-sm bg-green-600! hover:bg-green-700! text-white! font-semibold flex items-center py-2 px-3 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่ม
            </button>
          </div>

          {/* Image Attachment */}
          <div className="border-t border-gray-200 pt-6">
            <label htmlFor="imageAttachment" className="block text-sm font-medium text-gray-700 mb-1">แนบรูป (ถ้ามี)</label>
            <input
              type="file"
              id="imageAttachment"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClearForm}
              className="w-full sm:w-auto bg-gray-200! text-red-400! font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
            >
              ล้างข้อมูล
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-sky-600! hover:bg-sky-700! text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
            >
              ยืนยันและส่งข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AttendancePage;