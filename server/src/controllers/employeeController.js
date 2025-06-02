const pool = require('../config/db'); // Your PostgreSQL connection pool

const ALLOWED_ACCOMMODATION = ["โกดัง", "แคมป์ก่อสร้าง", "โรงงาน"];
const ALLOWED_EMPLOYEE_ROLES = ["หัวหน้างาน", "พนักงาน", "ช่าง"]; // Added "ช่าง"

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin)
exports.getAllEmployees = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM Employees ORDER BY created_at DESC
        `;
        const allEmployees = await pool.query(query);
        res.json(allEmployees.rows);
    } catch (err) {
        console.error('Error in getAllEmployees:', err.message);
        res.status(500).send('Server error while fetching employees');
    }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
    const {
        first_name,
        last_name,
        nickname,
        daily_wage,
        nationality,
        payment_cycle,
        employee_role,
        status,
        accommodation_details // Now one of three choices or null/empty
    } = req.body;

    // Validation for required fields
    if (!first_name || !last_name || !daily_wage || !nationality || !payment_cycle || !employee_role || !status) {
        return res.status(400).json({ msg: 'Please provide all required fields: First Name, Last Name, Daily Wage, Nationality, Payment Cycle, Employee Role, and Status.' });
    }

    const parsedDailyWage = parseFloat(daily_wage);
    if (isNaN(parsedDailyWage) || parsedDailyWage < 0) {
        return res.status(400).json({ msg: 'Daily wage must be a valid non-negative number.' });
    }

    // Validate accommodation_details if provided
    if (accommodation_details && accommodation_details !== '' && !ALLOWED_ACCOMMODATION.includes(accommodation_details)) {
        return res.status(400).json({ msg: `Invalid accommodation type. Allowed values are: ${ALLOWED_ACCOMMODATION.join(', ')}.` });
    }

    // Validate employee_role
    if (!ALLOWED_EMPLOYEE_ROLES.includes(employee_role)) {
        return res.status(400).json({ msg: `Invalid employee role. Allowed values are: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}.` });
    }

    try {
        const newEmployee = await pool.query(
            `INSERT INTO Employees (
                first_name, last_name, nickname,
                daily_wage, nationality, payment_cycle,
                employee_role, status, accommodation_details,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, first_name, last_name, nickname, daily_wage, nationality, payment_cycle, employee_role, status, created_at, updated_at, accommodation_details`,
            [
                first_name,
                last_name,
                nickname || null,
                parsedDailyWage,
                nationality,
                payment_cycle,
                employee_role,
                status,
                (accommodation_details && accommodation_details !== '') ? accommodation_details : null
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

// @desc    Update an existing employee
// @route   PUT /api/employees/:id
// @access  Private (Admin)
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const receivedFields = req.body;

    const allowedUpdates = [
        'first_name', 'last_name', 'nickname',
        'daily_wage', 'nationality', 'payment_cycle',
        'employee_role', 'status', 'accommodation_details'
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
            } else if (key === 'accommodation_details') {
                const accValue = receivedFields[key];
                if (accValue && accValue !== '' && !ALLOWED_ACCOMMODATION.includes(accValue)) {
                    return res.status(400).json({ msg: `Invalid accommodation type. Allowed values are: ${ALLOWED_ACCOMMODATION.join(', ')}.` });
                }
                fieldsToUpdate[key] = (accValue && accValue !== '') ? accValue : null;
            } else if (key === 'employee_role') {
                const roleValue = receivedFields[key];
                if (!ALLOWED_EMPLOYEE_ROLES.includes(roleValue)) {
                     return res.status(400).json({ msg: `Invalid employee role. Allowed values are: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}.` });
                }
                fieldsToUpdate[key] = roleValue;
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

    const queryText = `UPDATE Employees SET ${setClauses.join(', ')} WHERE id = $${valueCount} RETURNING id, first_name, last_name, nickname, daily_wage, nationality, payment_cycle, employee_role, status, created_at, updated_at, accommodation_details`;

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
