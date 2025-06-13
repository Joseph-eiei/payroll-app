const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const isSunday = (dateStr) => {
  const d = new Date(dateStr);
  return !isNaN(d) && d.getDay() === 0;
};

// User submits attendance form
exports.submitAttendanceForm = async (req, res) => {
  const {
    siteName,
    attendanceDate,
    siteSupervisorId,
    supervisorCheckIn,
    supervisorCheckOut,
    supervisorOT,
    supervisorRemarks,
    employeeAttendances
  } = req.body;

  const imageFile = req.file ? req.file.filename : null;

  const employees = []; 
  if (employeeAttendances) {
    try { employees.push(...JSON.parse(employeeAttendances)); } catch (e) {}
  }

  try {
    await pool.query('BEGIN');
    const formRes = await pool.query(
      `INSERT INTO AttendanceForms (
        site_name, attendance_date, site_supervisor_id,
        supervisor_check_in, supervisor_check_out,
        supervisor_ot, supervisor_remarks, image_attachment,
        is_sunday, is_bonus, is_verified, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        siteName,
        attendanceDate,
        siteSupervisorId || null,
        supervisorCheckIn || null,
        supervisorCheckOut || null,
        supervisorOT || null,
        supervisorRemarks || null,
        imageFile,
        isSunday(attendanceDate)
      ]
    );
    const attendanceId = formRes.rows[0].id;

    for (const emp of employees) {
      await pool.query(
        `INSERT INTO AttendanceEmployees (
          attendance_id, employee_id, check_in, check_out, ot_hours, remarks
        ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          attendanceId,
          emp.employeeId || null,
          emp.checkIn || null,
          emp.checkOut || null,
          emp.otHours || null,
          emp.remarks || null
        ]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ id: attendanceId });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in submitAttendanceForm:', err.message);
    res.status(500).json({ msg: 'Server error while saving attendance' });
  }
};

// Get pending attendance forms for admin review
exports.getPendingForms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        COALESCE(json_agg(json_build_object(
          'id', ae.id,
          'employeeId', ae.employee_id,
          'checkIn', ae.check_in,
          'checkOut', ae.check_out,
          'otHours', ae.ot_hours,
          'remarks', ae.remarks
        ) ORDER BY ae.id) FILTER (WHERE ae.id IS NOT NULL), '[]') AS employees
      FROM AttendanceForms a
      LEFT JOIN AttendanceEmployees ae ON a.id = ae.attendance_id
      WHERE a.is_verified = false
      GROUP BY a.id
      ORDER BY a.attendance_date DESC, a.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getPendingForms:', err.message);
    res.status(500).send('Server error while fetching forms');
  }
};

// Update a form (admin)
exports.updateForm = async (req, res) => {
  const { id } = req.params;
  const {
    siteName,
    attendanceDate,
    siteSupervisorId,
    supervisorCheckIn,
    supervisorCheckOut,
    supervisorOT,
    supervisorRemarks,
    employeeAttendances
  } = req.body;

  const imageFile = req.file ? req.file.filename : null;

  const employees = [];
  if (employeeAttendances) {
    try { employees.push(...JSON.parse(employeeAttendances)); } catch (e) {}
  }

  try {
    await pool.query('BEGIN');

    let oldImg = null;
    if (imageFile) {
      const { rows } = await pool.query('SELECT image_attachment FROM AttendanceForms WHERE id=$1', [id]);
      if (rows.length) oldImg = rows[0].image_attachment;
    }

    await pool.query(
      `UPDATE AttendanceForms SET
         site_name=$1,
         attendance_date=$2,
         site_supervisor_id=$3,
         supervisor_check_in=$4,
         supervisor_check_out=$5,
         supervisor_ot=$6,
         supervisor_remarks=$7,
         image_attachment=COALESCE($8, image_attachment),
         is_sunday=$9,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$10`,
      [
        siteName,
        attendanceDate,
        siteSupervisorId || null,
        supervisorCheckIn || null,
        supervisorCheckOut || null,
        supervisorOT || null,
        supervisorRemarks || null,
        imageFile,
        isSunday(attendanceDate),
        id
      ]
    );

    await pool.query('DELETE FROM AttendanceEmployees WHERE attendance_id=$1', [id]);

    for (const emp of employees) {
      await pool.query(
        `INSERT INTO AttendanceEmployees (
          attendance_id, employee_id, check_in, check_out, ot_hours, remarks
        ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          id,
          emp.employeeId || null,
          emp.checkIn || null,
          emp.checkOut || null,
          emp.otHours || null,
          emp.remarks || null
        ]
      );
    }

    await pool.query('COMMIT');

    if (imageFile && oldImg) {
      const filePath = path.join(__dirname, '../../uploads', oldImg);
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting image file:', err.message);
        }
      }
    }

    res.json({ msg: 'updated' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in updateForm:', err.message);
    res.status(500).send('Server error while updating form');
  }
};

// Delete a form
exports.deleteForm = async (req, res) => {
  const { id } = req.params;
  try {
    // Retrieve attachment name before deleting
    const { rows } = await pool.query('SELECT image_attachment FROM AttendanceForms WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: 'Form not found' });

    await pool.query('DELETE FROM AttendanceForms WHERE id=$1', [id]);

    // Remove uploaded image if present
    const img = rows[0].image_attachment;
    if (img) {
      const filePath = path.join(__dirname, '../../uploads', img);
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting image file:', err.message);
        }
      }
    }

    res.json({ msg: 'deleted' });
  } catch (err) {
    console.error('Error in deleteForm:', err.message);
    res.status(500).send('Server error while deleting form');
  }
};

// Verify a form
exports.verifyForm = async (req, res) => {
  const { id } = req.params;
  const { isBonus } = req.body;
  try {
    const upd = await pool.query(
      'UPDATE AttendanceForms SET is_verified=true, is_bonus=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING id',
      [id, isBonus === true || isBonus === "true"]
    );
    if (upd.rowCount === 0) return res.status(404).json({ msg: 'Form not found' });
    res.json({ msg: 'verified' });
  } catch (err) {
    console.error('Error in verifyForm:', err.message);
    res.status(500).send('Server error while verifying form');
  }
};

// Get verified forms (history)
exports.getVerifiedForms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        COALESCE(json_agg(json_build_object(
          'id', ae.id,
          'employeeId', ae.employee_id,
          'checkIn', ae.check_in,
          'checkOut', ae.check_out,
          'otHours', ae.ot_hours,
          'remarks', ae.remarks
        ) ORDER BY ae.id) FILTER (WHERE ae.id IS NOT NULL), '[]') AS employees
      FROM AttendanceForms a
      LEFT JOIN AttendanceEmployees ae ON a.id = ae.attendance_id
      WHERE a.is_verified = true
      GROUP BY a.id
      ORDER BY a.attendance_date DESC, a.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getVerifiedForms:', err.message);
    res.status(500).send('Server error while fetching history');
  }
};
