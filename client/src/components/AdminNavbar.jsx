import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ adminUser, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#007a00] text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/admin/employees" className="text-xl font-semibold hover:text-green-100 mb-2 sm:mb-0">
          ระบบจัดการพนักงาน
        </Link>

        <div className="flex items-center space-x-4">
          {adminUser && <span className="text-sm">ผู้ใช้: {adminUser.name}</span>}
          <button
            className="focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div className={`${menuOpen ? 'flex' : 'hidden'} flex-col sm:flex-row flex-wrap items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto mt-2 sm:mt-0`}>
          <Link to="/" className="hover:text-green-100">หน้าลงเวลา</Link>
          <Link to="/admin/employees" className="hover:text-green-100">รายชื่อพนักงาน</Link>
          <Link to="/admin/attendance-review" className="hover:text-green-100">ตรวจสอบการลงชื่อ</Link>
          <Link to="/admin/history" className="hover:text-green-100">ประวัติการทำงาน</Link>
          <Link to="/admin/deductions" className="hover:text-green-100">จัดการหักเงิน</Link>
          <Link to="/admin/advance-history" className="hover:text-green-100">ประวัติเงินเบิก</Link>
          <Link to="/admin/savings-history" className="hover:text-green-100">ประวัติเงินเก็บ</Link>
          <Link to="/admin/bill-history" className="hover:text-green-100">ประวัติค่าน้ำไฟ</Link>
          <Link to="/admin/payroll" className="hover:text-green-100">จ่ายเงินเดือน</Link>
          <Link to="/admin/payroll-history" className="hover:text-green-100">ประวัติเงินเดือน</Link>
          {adminUser && adminUser.is_superuser && (
            <>
              <Link to="/admin/create-admin" className="hover:text-green-100">สร้างบัญชี Admin</Link>
              <Link to="/admin/admins" className="hover:text-green-100">จัดการ Admin</Link>
            </>
          )}
          
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
