import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../utils/auth'; // Import helper

function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', nickname: '', daily_wage: '',
    nationality: 'ไทย', payment_cycle: 'รายเดือน',
    employee_role: 'employee', status: 'active', accommodation_details: ''
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Token is now automatically added by axios interceptor in App.js
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      setError(`ไม่สามารถโหลดข้อมูลพนักงานได้: ${err.response?.data?.msg || err.message}`);
      console.error('Fetch employees error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenModal = (employee = null) => {
    setCurrentEmployee(employee);
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        nickname: employee.nickname || '',
        daily_wage: employee.daily_wage || '',
        nationality: employee.nationality || 'ไทย',
        payment_cycle: employee.payment_cycle || 'รายเดือน',
        employee_role: employee.employee_role || 'พนักงาน',
        status: employee.status || 'active',
        accommodation_details: employee.accommodation_details || '',
      });
    } else {
      setFormData({
        first_name: '', last_name: '', nickname: '', daily_wage: '',
        nationality: 'ไทย', payment_cycle: 'รายเดือน',
        employee_role: 'พนักงาน', status: 'active', accommodation_details: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const method = currentEmployee ? 'put' : 'post';
    const url = currentEmployee ? `/api/employees/${currentEmployee.id}` : '/api/employees';

    if (isNaN(parseFloat(formData.daily_wage)) || parseFloat(formData.daily_wage) < 0) {
        alert("กรุณากรอกค่าแรงต่อวันที่ถูกต้อง (ตัวเลขเท่านั้น และไม่ติดลบ)");
        return;
    }

    try {
      // Token is now automatically added by axios interceptor
      await axios({ method, url, data: formData });
      fetchEmployees();
      handleCloseModal();
    } catch (err) {
      console.error('Submit employee error:', err);
      alert(`เกิดข้อผิดพลาด: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        // Token is now automatically added by axios interceptor
        await axios.delete(`/api/employees/${employeeId}`);
        fetchEmployees();
      } catch (err) {
        console.error('Delete employee error:', err);
        alert(`เกิดข้อผิดพลาดในการลบ: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  if (isLoading) return <div className="p-6 text-center text-gray-600">กำลังโหลดข้อมูลพนักงาน...</div>;
  if (error && !isModalOpen) return <div className="p-6 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full"> {/* Changed background for contrast */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">รายชื่อพนักงาน / ช่าง</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          เพิ่มพนักงาน
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['ID', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ค่าแรง/วัน (฿)', 'เชื้อชาติ', 'ที่พัก', 'รอบจ่าย', 'ตำแหน่ง', 'สถานะ', 'Actions'].map(header => (
                <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลพนักงาน</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{emp.employee_code || emp.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.nickname || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{parseFloat(emp.daily_wage).toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.nationality}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-[150px] truncate" title={emp.accommodation_details}>{emp.accommodation_details || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.payment_cycle}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      emp.employee_role === 'หัวหน้างาน'
                        ? 'bg-teal-100 text-teal-800'
                        : emp.employee_role === 'ช่าง'
                        ? 'bg-indigo-100 text-indigo-800' // New style for 'ช่าง'
                        : emp.employee_role === 'พนักงาน'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-gray-100 text-gray-800' // Fallback for any unexpected value
                    }`}
                    >
                       {emp.employee_role} {/* Directly display the Thai role name */}
                    </span>
                   </td>
                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        emp.status === 'active' ? 'bg-green-100 text-green-800' : 
                        emp.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {emp.status === 'active' ? 'ทำงาน' : emp.status === 'inactive' ? 'พักงาน' : 'สิ้นสุดสัญญา'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenModal(emp)} className="text-sky-600 hover:text-sky-800 transition-colors">แก้ไข</button>
                    <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-600 hover:text-red-800 transition-colors">ลบ</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10 flex justify-between items-center">
                <h3 className="text-xl font-semibold leading-6 text-gray-900">
                {currentEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">ชื่อจริง <span className="text-red-500">*</span></label>
                  <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                  <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                </div>
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">ชื่อเล่น</label>
                  <input type="text" name="nickname" id="nickname" value={formData.nickname} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                </div>
                <div>
                  <label htmlFor="daily_wage" className="block text-sm font-medium text-gray-700">ค่าแรง/วัน (บาท) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" name="daily_wage" id="daily_wage" value={formData.daily_wage} onChange={handleFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">เชื้อชาติ</label>
                  <select name="nationality" id="nationality" value={formData.nationality} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                    <option value="ไทย">ไทย</option>
                    <option value="ต่างชาติ">ต่างชาติ</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payment_cycle" className="block text-sm font-medium text-gray-700">รอบจ่าย</label>
                  <select name="payment_cycle" id="payment_cycle" value={formData.payment_cycle} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                    <option value="รายเดือน">รายเดือน</option>
                    <option value="ครึ่งเดือน">ครึ่งเดือน</option>
                  </select>
                </div>
                <div>
                <label htmlFor="employee_role" className="block text-sm font-medium text-gray-700">ตำแหน่ง <span className="text-red-500">*</span></label>
                <select
                    name="employee_role"
                    id="employee_role"
                    value={formData.employee_role}
                    onChange={handleFormChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white"
                >
                    {/* <option value="employee">พนักงาน</option> // อาจจะต้องเปลี่ยน default หรือ logic การแสดงผล */}
                    {/* <option value="supervisor">หัวหน้างาน</option> // */}
                    <option value="พนักงาน">พนักงาน</option>
                    <option value="หัวหน้างาน">หัวหน้างาน</option>
                    <option value="ช่าง">ช่าง</option>
                </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">สถานะ</label>
                  <select name="status" id="status" value={formData.status} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                    <option value="active">ทำงาน (Active)</option>
                    <option value="inactive">พักงาน (Inactive)</option>
                    <option value="terminated">สิ้นสุดสัญญา (Terminated)</option>
                  </select>
                </div>
              </div>
                <div>
                <label htmlFor="accommodation_details" className="block text-sm font-medium text-gray-700">ที่พัก</label>
                <select
                    name="accommodation_details"
                    id="accommodation_details"
                    value={formData.accommodation_details || ''} // Handle null by defaulting to empty string for select
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white"
                >
                    <option value="">-- เลือกที่พัก --</option>
                    <option value="โกดัง">โกดัง</option>
                    <option value="แคมป์ก่อสร้าง">แคมป์ก่อสร้าง</option>
                    <option value="โรงงาน">โรงงาน</option>
                </select>
                </div>
              <div className="pt-5 sticky bottom-0 bg-white py-3 px-6 border-t border-gray-200 z-10">
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm">ยกเลิก</button>
                  <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                    {currentEmployee ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มพนักงาน'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default EmployeeListPage;