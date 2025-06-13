const pool = require('../config/db');

exports.getAdvances = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, e.first_name, e.last_name
      FROM AdvanceLoans a
      JOIN Employees e ON a.employee_id = e.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error in getAdvances:', err.message);
    res.status(500).send('Server error while fetching advances');
  }
};

exports.createAdvance = async (req, res) => {
  const { name, employee_id, amount, date, remark } = req.body;
  const amt = parseFloat(amount) || 0;
  try {
    await pool.query('BEGIN');
    const { rows: loanRows } = await pool.query(
      `INSERT INTO AdvanceLoans (name, employee_id, total_amount, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING *`,
      [name, employee_id, amt, date]
    );
    const loan = loanRows[0];
    await pool.query(
      `INSERT INTO AdvanceTransactions (advance_id, amount, transaction_date, remark)
       VALUES ($1, $2, $3, $4)`,
      [loan.id, amt, date, remark]
    );
    await pool.query('COMMIT');
    res.status(201).json(loan);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in createAdvance:', err.message);
    res.status(500).send('Server error while creating advance');
  }
};

exports.addAdvanceAmount = async (req, res) => {
  const { id } = req.params;
  const { amount, date, remark } = req.body;
  const amt = parseFloat(amount) || 0;
  try {
    await pool.query('BEGIN');
    const { rows } = await pool.query(
      'UPDATE AdvanceLoans SET total_amount = total_amount + $1, updated_at = $3 WHERE id = $2 RETURNING *',
      [amt, id, date]
    );
    if (!rows.length) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ msg: 'Advance not found' });
    }
    await pool.query(
      `INSERT INTO AdvanceTransactions (advance_id, amount, transaction_date, remark)
       VALUES ($1, $2, $3, $4)`,
      [id, amt, date, remark]
    );
    await pool.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in addAdvanceAmount:', err.message);
    res.status(500).send('Server error while updating advance');
  }
};

exports.getAdvanceHistory = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT a.*, t.id AS tx_id, t.amount, t.transaction_date, t.remark
       FROM AdvanceLoans a
       LEFT JOIN AdvanceTransactions t ON a.id = t.advance_id
       WHERE a.employee_id = $1
       ORDER BY a.created_at DESC, t.transaction_date DESC`
    , [employeeId]);
    res.json(rows);
  } catch (err) {
    console.error('Error in getAdvanceHistory:', err.message);
    res.status(500).send('Server error while fetching history');
  }
};
