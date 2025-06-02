import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function AdminLoginPage({ setIsAdminLoggedIn, setAdminUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            localStorage.setItem('adminToken', response.data.token);
            const adminData = response.data.admin;
            localStorage.setItem('adminUser', JSON.stringify(adminData));
            setIsAdminLoggedIn(true); // Update App.js state
            setAdminUser(adminData);    // Update App.js state
            navigate('/admin/employees');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
            }
            console.error('Login error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
            <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">ผู้ดูแลระบบ</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อผู้ใช้
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-150 ease-in-out"
                        >
                            เข้าสู่ระบบ
                        </button>
                    </div>
                </form>
                 <p className="mt-6 text-center text-sm">
                    <Link to="/" className="font-medium text-sky-600 hover:text-sky-500">
                        &larr; กลับไปหน้าลงเวลา
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default AdminLoginPage;