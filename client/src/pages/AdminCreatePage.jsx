import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    is_superuser: false,
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // confirmPassword is only for client-side validation and not sent to the server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    try {
      const payload = {
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        is_superuser: form.is_superuser,
      };
      await axios.post('/api/admins', payload);
      alert('สร้างผู้ดูแลสำเร็จ');
      setForm({ name: '', email: '', username: '', password: '', confirmPassword: '', is_superuser: false });
      navigate('/admin/employees');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError('ไม่สามารถสร้างผู้ดูแลได้');
      }
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans text-black">
      <h2 className="text-2xl font-semibold mb-4">สร้างบัญชี Admin</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block mb-1">ชื่อ</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">อีเมล</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-sky-600"
            >
              {showPassword ? 'ซ่อน' : 'แสดง'}
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-sky-600"
            >
              {showConfirmPassword ? 'ซ่อน' : 'แสดง'}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_superuser"
            name="is_superuser"
            checked={form.is_superuser}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="is_superuser">Superuser</label>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">
          บันทึก
        </button>
      </form>
    </div>
  );
}

export default AdminCreatePage;
