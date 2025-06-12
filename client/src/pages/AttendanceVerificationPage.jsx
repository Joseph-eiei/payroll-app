import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- Helper Components ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const ConfirmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto"></div>;

// --- Main Verification Page Component ---
function AttendanceVerificationPage() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingSubmission, setEditingSubmission] = useState(null); // State to hold submission being edited

  useEffect(() => {
    fetchSubmissions(filterDate);
  }, [filterDate]);

  const fetchSubmissions = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      // API call to fetch pending submissions for a specific date
      // const response = await axios.get(`/api/attendance-submissions?status=pending&date=${date}`);
      // setSubmissions(response.data);

      // MOCK DATA for demonstration
      const mockData = [
        {
          submission_id: 1,
          site_name: 'โครงการ A (สีลม)',
          attendance_date: '2024-06-12',
          supervisor_name: 'สมชาย ซุปเปอร์ไวเซอร์',
          image_attachment_url: 'https://placehold.co/150x100/e2e8f0/334155?text=รูปหน้างาน',
          employees: [
            { emp_submission_id: 101, employee_name: 'ลูกน้อง หนึ่ง', check_in: '08:05', check_out: '17:02', ot_hours: 1.0, remarks: 'ทำงานปกติ' },
            { emp_submission_id: 102, employee_name: 'ลูกน้อง สอง', check_in: '08:00', check_out: '18:30', ot_hours: 1.5, remarks: 'เก็บงานส่วนที่เหลือ' },
          ]
        },
        {
          submission_id: 2,
          site_name: 'โครงการ B (สุขุมวิท)',
          attendance_date: '2024-06-12',
          supervisor_name: 'สมหญิง หัวหน้างาน',
          image_attachment_url: null,
          employees: [
            { emp_submission_id: 201, employee_name: 'ช่างไฟ คนที่หนึ่ง', check_in: '09:15', check_out: '17:00', ot_hours: 0, remarks: 'เข้าสาย' },
          ]
        },
      ];
      setSubmissions(mockData.filter(s => s.attendance_date === date)); // Filter mock data by date
      setIsLoading(false);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      console.error(err);
      setIsLoading(false);
    }
  };
  
  const handleConfirm = async (submissionId) => {
    if (window.confirm('คุณต้องการยืนยันรายการนี้ใช่หรือไม่? ข้อมูลจะถูกบันทึกลงประวัติการทำงาน')) {
      try {
        // API call to confirm the submission
        // await axios.post(`/api/attendance-submissions/${submissionId}/confirm`);
        alert(`ยืนยันรายการ #${submissionId} สำเร็จ`);
        // Refetch data for the current date
        fetchSubmissions(filterDate);
      } catch (err) {
        alert(`เกิดข้อผิดพลาดในการยืนยัน: ${err.message}`);
        console.error(err);
      }
    }
  };

  const handleDelete = async (submissionId) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
       try {
        // API call to delete the submission
        // await axios.delete(`/api/attendance-submissions/${submissionId}`);
        alert(`ลบรายการ #${submissionId} สำเร็จ`);
        // Refetch data for the current date
        fetchSubmissions(filterDate);
      } catch (err) {
        alert(`เกิดข้อผิดพลาดในการลบ: ${err.message}`);
        console.error(err);
      }
    }
  };

  // When admin clicks "Edit", we would set the state to show a modal or an editable form.
  // This is a placeholder for that logic.
  const handleEdit = (submission) => {
    // For a real app, you would probably open a modal with a form similar to AttendancePage
    // and populate it with the 'submission' data.
    alert(`ฟังก์ชั่นแก้ไขสำหรับรายการ #${submission.submission_id} (ยังไม่ได้ทำ)\nในแอปจริง ส่วนนี้จะเปิด Modal หรือฟอร์มให้แก้ไขข้อมูล`);
    setEditingSubmission(submission); // Example of setting state for an editing modal
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-slate-800">ตรวจสอบการลงชื่อทำงาน (Admin)</h1>
           <Link to="/attendance" className="text-sky-600 hover:text-sky-800 font-semibold py-2 px-4">
            กลับไปหน้าลงเวลา
          </Link>
        </div>

        <div className="mb-6 p-4 bg-slate-100 rounded-lg flex items-center gap-4">
          <label htmlFor="filterDate" className="font-semibold text-slate-700">เลือกวันที่:</label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-slate-900 block px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-center text-red-500">{error}</p>}
        
        {!isLoading && !error && submissions.length === 0 && (
          <p className="text-center text-slate-500 py-10">ไม่พบข้อมูลที่รอการตรวจสอบสำหรับวันที่เลือก</p>
        )}

        <div className="space-y-6">
          {submissions.map((sub) => (
            <div key={sub.submission_id} className="bg-white border border-slate-200 rounded-lg shadow-md p-5 transition-shadow hover:shadow-lg">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold text-sky-700">{sub.site_name}</h2>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">วันที่:</span> {new Date(sub.attendance_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">หัวหน้างาน:</span> {sub.supervisor_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button onClick={() => handleConfirm(sub.submission_id)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow">
                    <ConfirmIcon /> ยืนยัน
                  </button>
                  <button onClick={() => handleEdit(sub)} className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow">
                    <EditIcon /> แก้ไข
                  </button>
                  <button onClick={() => handleDelete(sub.submission_id)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow">
                    <DeleteIcon /> ลบ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-md font-semibold text-slate-700 mb-2">รายชื่อพนักงาน:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">เวลาเข้า</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">เวลาออก</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">OT (ชม.)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {sub.employees.map(emp => (
                          <tr key={emp.emp_submission_id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-800">{emp.employee_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{emp.check_in}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{emp.check_out}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{emp.ot_hours}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{emp.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-slate-700 mb-2">รูปภาพแนบ:</h3>
                  {sub.image_attachment_url ? (
                    <a href={sub.image_attachment_url} target="_blank" rel="noopener noreferrer">
                       <img src={sub.image_attachment_url} alt={`รูปภาพจากไซต์ ${sub.site_name}`} className="rounded-lg shadow-md w-full h-auto object-cover" />
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">ไม่มีรูปภาพแนบ</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttendanceVerificationPage;