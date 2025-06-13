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
    is_superuser: false,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/admins', form);
      alert('สร้างผู้ดูแลสำเร็จ');
      setForm({ name: '', email: '', username: '', password: '', is_superuser: false });
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
    <div className="min-h-screen p-6 font-sans">
      <h2 className="text-2xl font-semibold mb-4">สร้างผู้ดูแลระบบ</h2>
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
          <label className="block mb-1">ชื่อผู้ใช้</label>
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
          <label className="block mb-1">รหัสผ่าน</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
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
