import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EmployeeListPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  const initialFormData = {
    employee_code: '', first_name: '', last_name: '', nickname: '',
    thai_id_number: '', daily_wage: '', nationality: 'ไทย',
    water_address: '', electric_address: '', payment_cycle: 'รายเดือน',
    employee_role: 'พนักงาน', bank_name: '', bank_account_number: '',
    bank_account_name: '', start_date: '', status: 'active',
    phone_number: '', email: '', address: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const handleOpenModal = (employee = null) => {
    setCurrentEmployee(employee);
    if (employee) {
      const employeeDataForForm = {
        ...initialFormData, 
        ...employee,        
        daily_wage: employee.daily_wage != null ? String(employee.daily_wage) : '',
        start_date: employee.start_date ? new Date(employee.start_date).toISOString().slice(0,10) : '',
        water_address: employee.water_address || '',
        electric_address: employee.electric_address || '',
      };
      setFormData(employeeDataForForm);
    } else {
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
    setError(''); 
  };

  const fetchEmployees = async () => { 
    setIsLoading(true);
    setError('');
    try {
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

  const handleCloseModal = () => { 
    setIsModalOpen(false);
    setCurrentEmployee(null);
    setError(''); 
  };

  const handleFormChange = (e) => { 
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFormSubmit = async (e) => { 
    e.preventDefault();
    setError(''); 
    const method = currentEmployee ? 'put' : 'post';
    const url = currentEmployee ? `/api/employees/${currentEmployee.id}` : '/api/employees';

    if (!formData.first_name || !formData.last_name || !formData.daily_wage || !formData.employee_role || !formData.payment_cycle || !formData.nationality || !formData.status) {
        alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, ค่าแรง, ตำแหน่ง, รอบจ่าย, สัญชาติ, สถานะ)");
        return;
    }
    const wage = parseFloat(formData.daily_wage);
    if (isNaN(wage) || wage < 0) {
        alert("กรุณากรอกค่าแรงต่อวันที่ถูกต้อง (ตัวเลขเท่านั้น และไม่ติดลบ)");
        return;
    }
     if (formData.thai_id_number && !/^\d{13}$/.test(formData.thai_id_number) && formData.thai_id_number.length > 0) {
        alert("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก (หากมี)");
        return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.email.length > 0) {
        alert("รูปแบบอีเมลไม่ถูกต้อง (หากมี)");
        return;
    }
    
    const dataToSubmit = {
        ...formData,
        daily_wage: wage,
        start_date: formData.start_date === '' ? null : formData.start_date,
        water_address: formData.water_address === '' ? null : formData.water_address,
        electric_address: formData.electric_address === '' ? null : formData.electric_address,
    };

    try {
      await axios({ method, url, data: dataToSubmit });
      fetchEmployees(); 
      handleCloseModal();
    } catch (err) {
      console.error('Submit employee error:', err.response || err);
      setError(`เกิดข้อผิดพลาดในการบันทึก: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeleteEmployee = async (employeeId) => { 
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        await axios.delete(`/api/employees/${employeeId}`);
        fetchEmployees(); 
      } catch (err) {
        console.error('Delete employee error:', err);
        alert(`เกิดข้อผิดพลาดในการลบ: ${err.response?.data?.msg || err.message}`);
      }
    }
  };


  if (isLoading && !isModalOpen) return <div className="p-6 text-center text-gray-600">กำลังโหลดข้อมูลพนักงาน...</div>;
  if (error && !isModalOpen && employees.length === 0) return <div className="p-6 text-center text-red-500 bg-red-100 rounded-md">{error}</div>;


  return (
    // Ensure the main page div takes full width and centers its content
    <div className="min-h-screen w-full bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-7xl"> {/* Container for content with max-width and centering */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 text-center sm:text-left">รายชื่อพนักงาน / ช่าง</h2>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            เพิ่มพนักงาน
          </button>
        </div>
        
        {error && !isModalOpen && employees.length === 0 && (
         <div className="mb-4 p-4 text-center text-red-700 bg-red-100 rounded-md">{error}</div>
        )}

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-100">
                <tr>
                {['ID', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ค่าแรง/วัน (฿)', 'เชื้อชาติ', 'ที่อยู่น้ำ', 'ที่อยู่ไฟ', 'รอบจ่าย', 'ตำแหน่ง', 'สถานะ', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {header}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {employees.length === 0 && !isLoading ? (
                <tr>
                    <td colSpan="10" className="px-6 py-10 text-center text-gray-500">ไม่พบข้อมูลพนักงาน</td>
                </tr>
                ) : (
                employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{emp.employee_code || emp.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.nickname || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{emp.daily_wage != null ? parseFloat(emp.daily_wage).toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.nationality}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600" title={emp.water_address}>{emp.water_address || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600" title={emp.electric_address}>{emp.electric_address || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emp.payment_cycle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        emp.employee_role === 'หัวหน้างาน'
                            ? 'bg-teal-100 text-teal-800'
                            : emp.employee_role === 'ช่าง'
                            ? 'bg-indigo-100 text-indigo-800'
                            : emp.employee_role === 'พนักงาน'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        >
                        {emp.employee_role}
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
                  {error && isModalOpen && <p className="col-span-full text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">ชื่อจริง <span className="text-red-500">*</span></label>
                    <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                    <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">ชื่อเล่น</label>
                    <input type="text" name="nickname" id="nickname" value={formData.nickname} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                   <div>
                    <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700">รหัสพนักงาน</label>
                    <input type="text" name="employee_code" id="employee_code" value={formData.employee_code} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="daily_wage" className="block text-sm font-medium text-gray-700">ค่าแรง/วัน (บาท) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0" name="daily_wage" id="daily_wage" value={formData.daily_wage} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">เชื้อชาติ <span className="text-red-500">*</span></label>
                    <select name="nationality" id="nationality" value={formData.nationality} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                      <option value="ไทย">ไทย</option>
                      <option value="ต่างชาติ">ต่างชาติ</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="payment_cycle" className="block text-sm font-medium text-gray-700">รอบจ่าย <span className="text-red-500">*</span></label>
                    <select name="payment_cycle" id="payment_cycle" value={formData.payment_cycle} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                      <option value="รายเดือน">รายเดือน</option>
                      <option value="ครึ่งเดือน">ครึ่งเดือน</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="employee_role" className="block text-sm font-medium text-gray-700">ตำแหน่ง <span className="text-red-500">*</span></label>
                    <select name="employee_role" id="employee_role" value={formData.employee_role} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                      <option value="พนักงาน">พนักงาน</option>
                      <option value="หัวหน้างาน">หัวหน้างาน</option>
                      <option value="ช่าง">ช่าง</option>
                    </select>
                  </div>
                   <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">สถานะ <span className="text-red-500">*</span></label>
                    <select name="status" id="status" value={formData.status} onChange={handleFormChange} required className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white">
                      <option value="active">ทำงาน (Active)</option>
                      <option value="inactive">พักงาน (Inactive)</option>
                      <option value="terminated">สิ้นสุดสัญญา (Terminated)</option>
                    </select>
                  </div>
                   <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">วันที่เริ่มงาน</label>
                    <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="water_address" className="block text-sm font-medium text-gray-700">ที่อยู่น้ำ</label>
                    <select
                        name="water_address"
                        id="water_address"
                        value={formData.water_address || ''}
                        onChange={handleFormChange}
                        className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white"
                    >
                        <option value="">-- เลือกที่อยู่ค่าน้ำ --</option>
                        <option value="โกดัง">โกดัง</option>
                        <option value="แคมป์ก่อสร้าง">แคมป์ก่อสร้าง</option>
                        <option value="โรงงาน">โรงงาน</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="electric_address" className="block text-sm font-medium text-gray-700">ที่อยู่ไฟ</label>
                    <select
                        name="electric_address"
                        id="electric_address"
                        value={formData.electric_address || ''}
                        onChange={handleFormChange}
                        className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white"
                    >
                        <option value="">-- เลือกที่อยู่ค่าไฟ --</option>
                        <option value="โกดัง">โกดัง</option>
                        <option value="แคมป์ก่อสร้าง">แคมป์ก่อสร้าง</option>
                        <option value="โรงงาน">โรงงาน</option>
                    </select>
                  </div>
                  <div className="md:col-span-2"><hr className="my-2"/> <p className="text-sm text-gray-600">ข้อมูลติดต่อ (ไม่บังคับ)</p></div>
                   <div>
                    <label htmlFor="thai_id_number" className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน (13 หลัก)</label>
                    <input type="text" name="thai_id_number" id="thai_id_number" value={formData.thai_id_number} onChange={handleFormChange} maxLength="13" className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                      <textarea name="address" id="address" value={formData.address} onChange={handleFormChange} rows="2" className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"></textarea>
                  </div>
                   <div className="md:col-span-2"><hr className="my-2"/> <p className="text-sm text-gray-600">ข้อมูลธนาคาร (สำหรับจ่ายเงินเดือน)</p></div>
                   <div>
                    <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">ชื่อธนาคาร</label>
                    <input type="text" name="bank_name" id="bank_name" value={formData.bank_name} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                   <div>
                    <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">เลขบัญชี</label>
                    <input type="text" name="bank_account_number" id="bank_account_number" value={formData.bank_account_number} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
                   <div>
                    <label htmlFor="bank_account_name" className="block text-sm font-medium text-gray-700">ชื่อบัญชี</label>
                    <input type="text" name="bank_account_name" id="bank_account_name" value={formData.bank_account_name} onChange={handleFormChange} className="text-gray-900 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2" />
                  </div>
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
    </div> {/* This is the closing div for max-w-7xl mx-auto */}
  </div> // This is the closing div for p-4 sm:p-6 lg:p-8 ...
);
}
export default EmployeeListPage;