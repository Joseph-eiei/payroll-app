import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = ({ adminUser, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/admin/employees" 
            className="flex items-center space-x-2 text-xl font-semibold text-gray-900 hover:text-emerald-600 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5C14.8 3.4 14.4 3.4 14.2 3.5L12 4.5L9.8 3.5C9.6 3.4 9.2 3.4 9 3.5L3 7V9H21ZM10 10H4V18H10V10ZM20 10H14V18H20V10Z"/>
              </svg>
            </div>
            <span>ระบบจัดการพนักงาน</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 font-medium">
                หน้าลงเวลา
              </Link>
              <Link to="/admin/employees" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 font-medium">
                รายชื่อพนักงาน
              </Link>
              <Link to="/admin/attendance-review" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 font-medium">
                ตรวจสอบการลงชื่อ
              </Link>
              
              {/* Dropdown for History items */}
              <div className="relative group">
                <button className="text-white hover:text-emerald-600 transition-colors duration-200 font-medium flex items-center">
                  ประวัติ
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/admin/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      ประวัติการทำงาน
                    </Link>
                    <Link to="/admin/advance-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      ประวัติเงินเบิก
                    </Link>
                    <Link to="/admin/savings-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      ประวัติเงินเก็บ
                    </Link>
                    <Link to="/admin/bill-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      ประวัติค่าน้ำไฟ
                    </Link>
                    <Link to="/admin/payroll-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      ประวัติเงินเดือน
                    </Link>
                  </div>
                </div>
              </div>

              {/* Management dropdown */}
              <div className="relative group">
                <button className="text-white hover:text-emerald-600 transition-colors duration-200 font-medium flex items-center">
                  จัดการ
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/admin/deductions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      จัดการหักเงิน
                    </Link>
                    <Link to="/admin/payroll" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                      จ่ายเงินเดือน
                    </Link>
                    {adminUser && adminUser.is_superuser && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link to="/admin/create-admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                          สร้างบัญชี Admin
                        </Link>
                        <Link to="/admin/admins" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                          จัดการ Admin
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User info and logout */}
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
              {adminUser && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {adminUser.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{adminUser.name}</span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-4">
            {adminUser && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {adminUser.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{adminUser.name}</span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-emerald-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${menuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200 mt-2 rounded-lg">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              หน้าลงเวลา
            </Link>
            
            <Link 
              to="/admin/employees" 
              className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              รายชื่อพนักงาน
            </Link>
            
            <Link 
              to="/admin/attendance-review" 
              className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              ตรวจสอบการลงชื่อ
            </Link>

            {/* Mobile History Section */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประวัติ</div>
              <Link 
                to="/admin/history" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                ประวัติการทำงาน
              </Link>
              <Link 
                to="/admin/advance-history" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                ประวัติเงินเบิก
              </Link>
              <Link 
                to="/admin/savings-history" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                ประวัติเงินเก็บ
              </Link>
              <Link 
                to="/admin/bill-history" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                ประวัติค่าน้ำไฟ
              </Link>
              <Link 
                to="/admin/payroll-history" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                ประวัติเงินเดือน
              </Link>
            </div>

            {/* Mobile Management Section */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</div>
              <Link 
                to="/admin/deductions" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                จัดการหักเงิน
              </Link>
              <Link 
                to="/admin/payroll" 
                className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                จ่ายเงินเดือน
              </Link>
              
              {adminUser && adminUser.is_superuser && (
                <>
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Super Admin</div>
                    <Link 
                      to="/admin/create-admin" 
                      className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      สร้างบัญชี Admin
                    </Link>
                    <Link 
                      to="/admin/admins" 
                      className="text-gray-600 hover:text-emerald-600 hover:bg-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      จัดการ Admin
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Logout */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-base font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;