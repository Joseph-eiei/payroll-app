const pool = require('../config/db');

async function getAccommodationTypes() {
  const { rows } = await pool.query('SELECT accommodation_type FROM AccommodationCharges');
  return rows.map(r => r.accommodation_type);
}

module.exports = { getAccommodationTypes };
