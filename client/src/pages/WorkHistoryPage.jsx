import React, { useEffect, useState } from 'react';
import axios from 'axios';

function WorkHistoryPage() {
  const [forms, setForms] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [error, setError] = useState('');

  const fetchForms = async () => {
    try {
      const res = await axios.get('/api/attendance/history');
      setForms(res.data);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      const map = {};
      res.data.forEach(e => {
        map[e.id] = `${e.first_name} ${e.last_name}`;
      });
      setEmployeesMap(map);
    } catch (err) {
      console.error('failed to fetch employees', err);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchEmployees();
  }, []);

  const groupedForms = forms.reduce((acc, form) => {
    const date = form.attendance_date.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(form);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedForms).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="p-6 max-w-6xl mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-4">ประวัติการทำงาน</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!error && sortedDates.length === 0 && (
        <p className="text-red-500">ไม่พบประวัติการทำงาน</p>
      )}
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date}>
            <h3 className="text-xl font-semibold mb-2">{`วันที่ ${date.slice(8,10)}-${date.slice(5,7)}-${date.slice(0,4)}`}</h3>
            <div className="space-y-4">
              {groupedForms[date].map(form => (
                <div key={form.id} className="border p-4 rounded bg-white shadow">
                  <div className="space-y-1">
                    <p className="font-medium">{form.site_name}</p>
                    <p className="text-sm text-gray-600">
                      หัวหน้าไซต์:{' '}
                      {form.site_supervisor_id ? (employeesMap[form.site_supervisor_id] ? `${employeesMap[form.site_supervisor_id]}` : form.site_supervisor_id) : '-'}
                    </p>
                    <p className="text-sm text-gray-600">เข้า: {form.supervisor_check_in || '-'} น.</p>
                    <p className="text-sm text-gray-600">ออก: {form.supervisor_check_out || '-'} น.</p>
                    <p className="text-sm text-gray-600">OT: {form.supervisor_ot || '-'}</p>
                    <p className="text-sm text-gray-600">หมายเหตุ: {form.supervisor_remarks || '-'}</p>
                    {form.is_sunday && (
                      <p className="text-sm text-red-600 font-bold">วันอาทิตย์</p>
                    )}
                    <p className="text-sm text-black-600 font-bold">เบี้ยขยัน: {form.is_bonus ? 'ใช่' : 'ไม่ใช่'}</p>
                    {form.image_attachment && (
                      <div className="mt-2">
                        <img src={`/uploads/${form.image_attachment}`} alt="แนบรูปไซต์" className="max-h-48 rounded" />
                      </div>
                    )}
                    {form.employees.length > 0 && (
                      <table className="mt-2 w-full text-sm text-left">
                        <thead>
                          <tr>
                            <th className="border px-2">รหัสพนักงาน</th>
                            <th className="border px-2">ชื่อพนักงาน</th>
                            <th className="border px-2">เข้า</th>
                            <th className="border px-2">ออก</th>
                            <th className="border px-2">OT</th>
                            <th className="border px-2">หมายเหตุ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.employees.map((emp, i) => (
                            <tr key={i}>
                              <td className="border px-2">{emp.employeeId}</td>
                              <td className="border px-2">{employeesMap[emp.employeeId] || '-'}</td>
                              <td className="border px-2">{emp.checkIn || '-'}</td>
                              <td className="border px-2">{emp.checkOut || '-'}</td>
                              <td className="border px-2">{emp.otHours || '-'}</td>
                              <td className="border px-2">{emp.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkHistoryPage;
