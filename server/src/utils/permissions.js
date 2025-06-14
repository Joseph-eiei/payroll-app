const pool = require('../config/db');

async function isSuperuser(adminId) {
    const { rows } = await pool.query('SELECT is_superuser FROM Admins WHERE id=$1', [adminId]);
    return rows.length > 0 && rows[0].is_superuser === true;
}

async function canAccessEmployee(adminId, employeeId) {
    if (await isSuperuser(adminId)) return true;
    const { rows } = await pool.query(
        'SELECT 1 FROM Employees WHERE id=$1 AND supervisor_admin_id=$2',
        [employeeId, adminId]
    );
    return rows.length > 0;
}

module.exports = { isSuperuser, canAccessEmployee };
