import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ adminUser, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-green-200 text-gray-800 p-4 shadow-lg rounded-b-lg">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/admin/employees" className="text-2xl font-bold hover:text-green-500 mb-2 sm:mb-0">
          ระบบจัดการพนักงาน
        </Link>

        <div className="flex items-center space-x-4">
          {adminUser && <span className="text-sm font-medium">ผู้ใช้: {adminUser.name}</span>}
          <button
            className="focus:outline-none hover:bg-green-300 p-2 rounded-full transition duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div
          className={`${
            menuOpen
              ? 'flex flex-col space-y-2'
              : 'hidden sm:flex sm:flex-row sm:space-x-4 sm:space-y-0'
          } flex-wrap items-center w-full sm:w-auto mt-2 sm:mt-0`}
        >
          <Link to="/" className="hover:text-green-500 transition duration-200">หน้าลงเวลา</Link>
          <Link to="/admin/employees" className="hover:text-green-500 transition duration-200">รายชื่อพนักงาน</Link>
          <Link to="/admin/attendance-review" className="hover:text-green-500 transition duration-200">ตรวจสอบการลงชื่อ</Link>
          <Link to="/admin/history" className="hover:text-green-500 transition duration-200">ประวัติการทำงาน</Link>
          <Link to="/admin/deductions" className="hover:text-green-500 transition duration-200">จัดการหักเงิน</Link>
          <Link to="/admin/advance-history" className="hover:text-green-500 transition duration-200">ประวัติเงินเบิก</Link>
          <Link to="/admin/savings-history" className="hover:text-green-500 transition duration-200">ประวัติเงินเก็บ</Link>
          <Link to="/admin/bill-history" className="hover:text-green-500 transition duration-200">ประวัติค่าน้ำไฟ</Link>
          <Link to="/admin/payroll" className="hover:text-green-500 transition duration-200">จ่ายเงินเดือน</Link>
          <Link to="/admin/payroll-history" className="hover:text-green-500 transition duration-200">ประวัติเงินเดือน</Link>
          {adminUser && adminUser.is_superuser && (
            <>
              <Link to="/admin/create-admin" className="hover:text-green-500 transition duration-200">สร้างบัญชี Admin</Link>
              <Link to="/admin/admins" className="hover:text-green-500 transition duration-200">จัดการ Admin</Link>
            </>
          )}
          
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
