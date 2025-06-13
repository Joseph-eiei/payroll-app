import React from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ adminUser, onLogout }) => {
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/admin/employees" className="text-xl font-semibold hover:text-gray-300 mb-2 sm:mb-0">
          ระบบจัดการพนักงาน
        </Link>
        <div className="flex flex-wrap items-center space-x-4">
          {adminUser && <span className="text-sm">ผู้ใช้: {adminUser.name}</span>}
          <Link to="/" className="hover:text-gray-300">หน้าลงเวลา</Link>
          <Link to="/admin/employees" className="hover:text-gray-300">รายชื่อพนักงาน</Link>
          <Link to="/admin/attendance-review" className="hover:text-gray-300">ตรวจสอบการลงชื่อ</Link>
          <Link to="/admin/history" className="hover:text-gray-300">ประวัติการทำงาน</Link>
          <Link to="/admin/deductions" className="hover:text-gray-300">จัดการหักเงิน</Link>
          <Link to="/admin/advance-history" className="hover:text-gray-300">ประวัติเงินเบิก</Link>
          <Link to="/admin/bill-history" className="hover:text-gray-300">ประวัติค่าน้ำไฟ</Link>
          {adminUser && adminUser.is_superuser && (
            <>
              <Link to="/admin/create-admin" className="hover:text-gray-300">สร้างบัญชี Admin</Link>
              <Link to="/admin/admins" className="hover:text-gray-300">จัดการ Admin</Link>
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
