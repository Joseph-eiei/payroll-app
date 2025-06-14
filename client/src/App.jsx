import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import { getAuthToken, getAdminUser } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import SuperuserRoute from './components/SuperuserRoute';
import AdminNavbar from './components/AdminNavbar';
import AttendancePage from './pages/AttendancePage';
import AdminLoginPage from './pages/AdminLoginPage';
import EmployeeListPage from './pages/EmployeeListPage';
import AttendanceReviewPage from './pages/AttendanceReviewPage';
import WorkHistoryPage from './pages/WorkHistoryPage';
import DeductionManagementPage from './pages/DeductionManagementPage';
import AdminCreatePage from './pages/AdminCreatePage';
import AdminListPage from './pages/AdminListPage';
import BillHistoryPage from './pages/BillHistoryPage';
import AdvanceHistoryPage from './pages/AdvanceHistoryPage';
import SavingsHistoryPage from './pages/SavingsHistoryPage';
import PayrollPage from './pages/PayrollPage';
import PayrollHistoryPage from './pages/PayrollHistoryPage';


// --- Main App Component ---
function AppContent() {
  // Using a component that can use useLocation hook
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!getAuthToken());
  const [adminUser, setAdminUser] = useState(getAdminUser());

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    // Navigate to login or home page if desired, but ProtectedRoute handles access
  };

  // Update localStorage when adminUser changes
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('adminUser');
    }
  }, [adminUser]);

  useEffect(() => {
    setIsAdminLoggedIn(!!getAuthToken());
    setAdminUser(getAdminUser());
  }, [location]); // Re-check auth state on route change

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(config => {
      const token = getAuthToken();
      // Ensure config.url exists and is a string before calling .includes()
      if (token && config.url && typeof config.url === 'string' && !config.url.includes('/api/auth/login')) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    }, error => {
      return Promise.reject(error);
    });

    const responseInterceptor = axios.interceptors.response.use(response => {
      return response;
    }, error => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
         // Ensure error.config.url exists and is a string
        if (error.config && error.config.url && typeof error.config.url === 'string' && !error.config.url.includes('/api/auth/login')) {
            console.log('Unauthorized or Forbidden, logging out.');
            handleLogout();
        }
      }
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Empty dependency array, so it runs once on mount and cleans up on unmount


  return (
    <div className="app-container bg-gray-100 min-h-screen">
      {isAdminLoggedIn && location.pathname.startsWith('/admin') && (
        <AdminNavbar adminUser={adminUser} onLogout={handleLogout} />
      )}
      <Routes>
        <Route path="/" element={<AttendancePage />} />
        <Route 
          path="/admin/login" 
          element={isAdminLoggedIn ? <Navigate to="/admin/employees" /> : <AdminLoginPage setIsAdminLoggedIn={setIsAdminLoggedIn} setAdminUser={setAdminUser} />} 
        />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/employees" element={<EmployeeListPage />} />
          <Route path="/admin/attendance-review" element={<AttendanceReviewPage />} />
          <Route path="/admin/deductions" element={<DeductionManagementPage />} />
          <Route path="/admin/bill-history" element={<BillHistoryPage />} />
          <Route path="/admin/advance-history" element={<AdvanceHistoryPage />} />
          <Route path="/admin/savings-history" element={<SavingsHistoryPage />} />
          <Route path="/admin/payroll" element={<PayrollPage />} />
          <Route path="/admin/payroll-history" element={<PayrollHistoryPage />} />
          <Route path="/admin/history" element={<WorkHistoryPage />} />
          <Route element={<SuperuserRoute />}>
            <Route path="/admin/create-admin" element={<AdminCreatePage />} />
            <Route path="/admin/admins" element={<AdminListPage />} />
          </Route>
          <Route path="/admin" element={<Navigate to="/admin/employees" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

// Wrap AppContent with Router so useLocation can be used
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;