import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminListPage() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const initialForm = { name: '', email: '', username: '', password: '', is_superuser: false };
  const [form, setForm] = useState(initialForm);

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/admins');
      setAdmins(data);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลผู้ดูแลได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const togglePassword = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openModal = (admin) => {
    if (admin) {
      setCurrentAdmin(admin);
      setForm({ ...initialForm, ...admin, password: '' });
    } else {
      setCurrentAdmin(null);
      setForm(initialForm);
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAdmin(null);
    setForm(initialForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        username: form.username,
        is_superuser: form.is_superuser,
      };
      if (form.password) payload.password = form.password;
      await axios.put(`/api/admins/${currentAdmin.id}`, payload);
      closeModal();
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setError('บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบผู้ดูแลคนนี้หรือไม่?')) return;
    try {
      await axios.delete(`/api/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถลบผู้ดูแลได้');
    }
  };

  if (isLoading && !isModalOpen) return <div className="p-6 text-center">กำลังโหลด...</div>;
  if (error && !isModalOpen) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen p-6 font-sans text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">จัดการ Admin</h2>
        <Link to="/admin/create-admin" className="bg-green-500 text-white! px-4 py-2 rounded">สร้าง Admin</Link>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['ID', 'Username', 'ชื่อ', 'อีเมล', 'Password Hash', 'Superuser', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{admin.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{admin.username}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{admin.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{admin.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {showPasswords[admin.id] ? admin.password_hash : '********'}
                  <button onClick={() => togglePassword(admin.id)} className="text-white text-sm" style={{ marginLeft: '8px' }}>
                    {showPasswords[admin.id] ? 'ซ่อน' : 'แสดง'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {admin.is_superuser ? 'ใช่' : 'ไม่'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openModal(admin)} className="text-white">แก้ไข</button>
                  <button onClick={() => handleDelete(admin.id)} className="text-red-400">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">แก้ไขข้อมูลผู้ดูแล</h3>
              <button onClick={closeModal} className="text-gray-500">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="text-red-600 text-center">{error}</div>}
              <div>
                <label className="block mb-1">ชื่อ</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="border p-2 w-full" required />
              </div>
              <div>
                <label className="block mb-1">อีเมล</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="border p-2 w-full" required />
              </div>
              <div>
                <label className="block mb-1">Username</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} className="border p-2 w-full" required />
              </div>
              <div>
                <label className="block mb-1">New Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="border p-2 w-full" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_superuser" name="is_superuser" checked={form.is_superuser} onChange={handleChange} className="mr-2" />
                <label htmlFor="is_superuser">Superuser</label>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={closeModal} className="bg-gray-200 px-4 py-2 rounded">ยกเลิก</button>
                <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminListPage;
