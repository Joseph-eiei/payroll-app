const pool = require('../config/db'); // Your PostgreSQL connection pool
const { getWaterAddresses, getElectricAddresses } = require('../utils/accommodation');
const { isSuperuser, canAccessEmployee } = require('../utils/permissions');

const ALLOWED_EMPLOYEE_ROLES = ["หัวหน้างาน", "พนักงาน", "ช่าง"];

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin)
exports.getAllEmployees = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const superuser = await isSuperuser(adminId);

        let query = `
            SELECT e.*, a.name AS supervisor_name
            FROM Employees e
            LEFT JOIN Admins a ON e.supervisor_admin_id = a.id`;
        const params = [];
        if (!superuser) {
            query += ' WHERE e.supervisor_admin_id = $1';
            params.push(adminId);
        }
        query += ' ORDER BY e.created_at DESC';

        const allEmployees = await pool.query(query, params);
        res.json(allEmployees.rows);
    } catch (err) {
        console.error('Error in getAllEmployees:', err.message);
        res.status(500).send('Server error while fetching employees');
    }
};

exports.getEmployeesByRole = async (req, res) => {
    const { role } = req.params;

    if (!ALLOWED_EMPLOYEE_ROLES.includes(role)) {
        return res.status(400).json({ msg: `Invalid employee role. Allowed values are: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}.` });
    }

    try {
        const adminId = req.admin.id;
        const superuser = await isSuperuser(adminId);

        let query = `
            SELECT e.*, a.name AS supervisor_name
            FROM Employees e
            LEFT JOIN Admins a ON e.supervisor_admin_id = a.id
            WHERE e.employee_role = $1`;
        const params = [role];
        if (!superuser) {
            query += ' AND e.supervisor_admin_id = $2';
            params.push(adminId);
        }
        query += ' ORDER BY e.created_at DESC';

        const employees = await pool.query(query, params);
        res.json(employees.rows);
    } catch (err) {
        console.error('Error in getEmployeesByRole:', err.message);
        res.status(500).send('Server error while fetching employees by role');
    }
}

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
    const {
        first_name,
        last_name,
        nickname,
        daily_wage,
        savings_monthly_amount,
        nationality,
        payment_cycle,
        employee_role,
        status,
        water_address,
        electric_address,
        supervisor_admin_id,
        bank_name,
        bank_account_number,
        bank_account_name
    } = req.body;

    // Validation for required fields
    if (!first_name || !last_name || !daily_wage || !nationality || !payment_cycle || !employee_role || !status) {
        return res.status(400).json({ msg: 'Please provide all required fields: First Name, Last Name, Daily Wage, Nationality, Payment Cycle, Employee Role, and Status.' });
    }

    const parsedDailyWage = parseFloat(daily_wage);
    if (isNaN(parsedDailyWage) || parsedDailyWage < 0) {
        return res.status(400).json({ msg: 'Daily wage must be a valid non-negative number.' });
    }

    let parsedSavings = 0;
    if (savings_monthly_amount !== undefined) {
        parsedSavings = parseFloat(savings_monthly_amount);
        if (isNaN(parsedSavings) || parsedSavings < 0) {
            return res.status(400).json({ msg: 'Savings amount must be a valid non-negative number.' });
        }
    }

    if (water_address && water_address !== '') {
        const allowedWater = await getWaterAddresses();
        if (!allowedWater.includes(water_address)) {
            return res.status(400).json({ msg: `Invalid water address.` });
        }
    }

    if (electric_address && electric_address !== '') {
        const allowedElectric = await getElectricAddresses();
        if (!allowedElectric.includes(electric_address)) {
            return res.status(400).json({ msg: `Invalid electric address.` });
        }
    }

    const adminId = req.admin.id;
    const superuser = await isSuperuser(adminId);

    let supervisorIdFinal = null;
    if (superuser) {
        if (supervisor_admin_id && supervisor_admin_id !== '') {
            const parsedId = parseInt(supervisor_admin_id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ msg: 'Invalid supervisor admin id.' });
            }
            supervisorIdFinal = parsedId;
        }
    } else {
        supervisorIdFinal = adminId;
    }

    // Validate employee_role
    if (!ALLOWED_EMPLOYEE_ROLES.includes(employee_role)) {
        return res.status(400).json({ msg: `Invalid employee role. Allowed values are: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}.` });
    }

    try {
        const newEmployee = await pool.query(
            `INSERT INTO Employees (
                first_name, last_name, nickname,
                daily_wage, savings_monthly_amount, nationality, payment_cycle,
                employee_role, status, water_address, electric_address,
                supervisor_admin_id, bank_name, bank_account_number, bank_account_name,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, first_name, last_name, nickname, daily_wage, savings_monthly_amount, nationality, payment_cycle, employee_role, status, supervisor_admin_id, created_at, updated_at, water_address, electric_address, bank_name, bank_account_number, bank_account_name`,
            [
                first_name,
                last_name,
                nickname || null,
                parsedDailyWage,
                parsedSavings,
                nationality,
                payment_cycle,
                employee_role,
                status,
                water_address || null,
                electric_address || null,
                supervisorIdFinal,
                bank_name || null,
                bank_account_number || null,
                bank_account_name || null
            ]
        );
        res.status(201).json(newEmployee.rows[0]);
    } catch (err) {
        console.error('Error in createEmployee:', err.message, err.stack);
        if (err.code === '23505') {
             return res.status(400).json({ msg: `Employee creation failed. A unique constraint was violated. Detail: ${err.detail}` });
        }
        res.status(500).send('Server error while creating employee');
    }
};

// @desc    Get employees by payment cycle
// @route   GET /api/employees/cycle/:cycle
// @access  Private (Admin)
exports.getEmployeesByCycle = async (req, res) => {
    const { cycle } = req.params;
    const allowed = ['รายเดือน', 'ครึ่งเดือน'];
    if (!allowed.includes(cycle)) {
        return res.status(400).json({ msg: `Invalid payment cycle. Allowed values are: ${allowed.join(', ')}.` });
    }

    try {
        const adminId = req.admin.id;
        const superuser = await isSuperuser(adminId);

        let query = `
            SELECT e.*, a.name AS supervisor_name
            FROM Employees e
            LEFT JOIN Admins a ON e.supervisor_admin_id = a.id
            WHERE e.payment_cycle = $1`;
        const params = [cycle];
        if (!superuser) {
            query += ' AND e.supervisor_admin_id = $2';
            params.push(adminId);
        }
        query += ' ORDER BY e.created_at DESC';

        const employees = await pool.query(query, params);
        res.json(employees.rows);
    } catch (err) {
        console.error('Error in getEmployeesByCycle:', err.message);
        res.status(500).send('Server error while fetching employees by payment cycle');
    }
};

// @desc    Update an existing employee
// @route   PUT /api/employees/:id
// @access  Private (Admin)
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const receivedFields = req.body;

    const adminId = req.admin.id;
    const superuser = await isSuperuser(adminId);

    if (!(await canAccessEmployee(adminId, id))) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    const allowedUpdates = [
        'first_name', 'last_name', 'nickname',
        'daily_wage', 'savings_monthly_amount', 'nationality', 'payment_cycle',
        'employee_role', 'status', 'water_address', 'electric_address', 'supervisor_admin_id',
        'bank_name', 'bank_account_number', 'bank_account_name'
    ];

    const fieldsToUpdate = {};
    for (const key in receivedFields) {
        if (allowedUpdates.includes(key)) {
            if (key === 'daily_wage') {
                const wage = parseFloat(receivedFields[key]);
                if (isNaN(wage) || wage < 0) {
                    return res.status(400).json({ msg: 'Daily wage must be a valid non-negative number.' });
                }
                fieldsToUpdate[key] = wage;
            } else if (key === 'savings_monthly_amount') {
                const amt = parseFloat(receivedFields[key]);
                if (isNaN(amt) || amt < 0) {
                    return res.status(400).json({ msg: 'Savings amount must be a valid non-negative number.' });
                }
                fieldsToUpdate[key] = amt;
            } else if (key === 'water_address') {
                const w = receivedFields[key];
                if (w && w !== '') {
                    const allowedWater = await getWaterAddresses();
                    if (!allowedWater.includes(w)) {
                        return res.status(400).json({ msg: 'Invalid water address.' });
                    }
                    fieldsToUpdate[key] = w;
                } else {
                    fieldsToUpdate[key] = null;
                }
            } else if (key === 'electric_address') {
                const e = receivedFields[key];
                if (e && e !== '') {
                    const allowedElectric = await getElectricAddresses();
                    if (!allowedElectric.includes(e)) {
                        return res.status(400).json({ msg: 'Invalid electric address.' });
                    }
                    fieldsToUpdate[key] = e;
                } else {
                    fieldsToUpdate[key] = null;
                }
            } else if (key === 'employee_role') {
                const roleValue = receivedFields[key];
                if (!ALLOWED_EMPLOYEE_ROLES.includes(roleValue)) {
                     return res.status(400).json({ msg: `Invalid employee role. Allowed values are: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}.` });
                }
                fieldsToUpdate[key] = roleValue;
            } else if (key === 'supervisor_admin_id') {
                if (superuser) {
                    const supId = receivedFields[key];
                    if (supId === '' || supId === null || typeof supId === 'undefined') {
                        fieldsToUpdate[key] = null;
                    } else if (isNaN(parseInt(supId))) {
                        return res.status(400).json({ msg: 'Invalid supervisor admin id.' });
                    } else {
                        fieldsToUpdate[key] = parseInt(supId);
                    }
                }
            }
            else if (receivedFields[key] === '' && (key === 'nickname')) {
                fieldsToUpdate[key] = null;
            }
            else {
                fieldsToUpdate[key] = receivedFields[key];
            }
        }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ msg: 'No valid fields provided for update, or no changes detected.' });
    }

    fieldsToUpdate.updated_at = 'CURRENT_TIMESTAMP';

    const setClauses = [];
    const values = [];
    let valueCount = 1;

    for (const key in fieldsToUpdate) {
        if (key === 'updated_at') {
            setClauses.push(`${key} = CURRENT_TIMESTAMP`);
        } else {
            setClauses.push(`${key} = $${valueCount++}`);
            values.push(fieldsToUpdate[key]);
        }
    }
    values.push(id);

    const queryText = `UPDATE Employees SET ${setClauses.join(', ')} WHERE id = $${valueCount} RETURNING id, first_name, last_name, nickname, daily_wage, savings_monthly_amount, nationality, payment_cycle, employee_role, status, supervisor_admin_id, created_at, updated_at, water_address, electric_address, bank_name, bank_account_number, bank_account_name`;

    try {
        const updatedEmployee = await pool.query(queryText, values);

        if (updatedEmployee.rows.length === 0) {
            return res.status(404).json({ msg: 'Employee not found or no changes applied' });
        }
        res.json(updatedEmployee.rows[0]);
    } catch (err) {
        console.error('Error in updateEmployee:', err.message, err.stack);
        if (err.code === '23505') {
             return res.status(400).json({ msg: `Employee update failed. A unique constraint was violated. Detail: ${err.detail}` });
        }
        res.status(500).send('Server error while updating employee');
    }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;
    const adminId = req.admin.id;

    if (!(await canAccessEmployee(adminId, id))) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const deleteOp = await pool.query('DELETE FROM Employees WHERE id = $1 RETURNING id, first_name, last_name', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Employee not found, nothing to delete' });
        }
        res.json({ msg: 'Employee deleted successfully', deletedEmployee: deleteOp.rows[0] });
    } catch (err) {
        console.error('Error in deleteEmployee:', err.message);
        res.status(500).send('Server error while deleting employee');
    }
};
