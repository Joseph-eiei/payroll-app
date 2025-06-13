const pool = require('../config/db');

async function getWaterAddresses() {
  const { rows } = await pool.query('SELECT address_name FROM WaterAddresses');
  return rows.map(r => r.address_name);
}

async function getElectricAddresses() {
  const { rows } = await pool.query('SELECT address_name FROM ElectricAddresses');
  return rows.map(r => r.address_name);
}

module.exports = { getWaterAddresses, getElectricAddresses };
