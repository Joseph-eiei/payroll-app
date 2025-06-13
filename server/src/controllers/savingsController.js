const pool = require('../config/db');

exports.getSavingsHistory = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, amount, transaction_date, is_deposit, remark
       FROM SavingsTransactions
       WHERE employee_id = $1
       ORDER BY transaction_date DESC, id DESC`,
      [employeeId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in getSavingsHistory:', err.message);
    res.status(500).send('Server error while fetching savings history');
  }
};
