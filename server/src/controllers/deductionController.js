const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { getWaterAddresses, getElectricAddresses } = require('../utils/accommodation');

exports.getDeductionTypes = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM DeductionTypes ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error('Error in getDeductionTypes:', err.message);
        res.status(500).send('Server error while fetching deduction types');
    }
};

exports.createDeductionType = async (req, res) => {
    const { name, rate, is_active } = req.body;
    if (!name) {
        return res.status(400).json({ msg: 'Name is required' });
    }
    const parsedRate = parseFloat(rate) || 0;
    try {
        const { rows } = await pool.query(
            `INSERT INTO DeductionTypes (name, rate, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [name, parsedRate, is_active !== false]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error in createDeductionType:', err.message);
        res.status(500).send('Server error while creating deduction type');
    }
};

exports.updateDeductionType = async (req, res) => {
    const { id } = req.params;
    const { name, rate, is_active } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(name);
    }
    if (rate !== undefined) {
        fields.push(`rate = $${idx++}`);
        values.push(parseFloat(rate) || 0);
    }
    if (is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(is_active);
    }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    try {
        const { rows } = await pool.query(
            `UPDATE DeductionTypes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        if (rows.length === 0) return res.status(404).json({ msg: 'Deduction type not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Error in updateDeductionType:', err.message);
        res.status(500).send('Server error while updating deduction type');
    }
};

exports.deleteDeductionType = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM DeductionTypes WHERE id = $1', [id]);
        if (rowCount === 0) return res.status(404).json({ msg: 'Deduction type not found' });
        res.json({ msg: 'Deduction type deleted' });
    } catch (err) {
        console.error('Error in deleteDeductionType:', err.message);
        res.status(500).send('Server error while deleting deduction type');
    }
};

exports.getWaterCharges = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM WaterAddresses ORDER BY address_name');
        res.json(rows);
    } catch (err) {
        console.error('Error in getWaterCharges:', err.message);
        res.status(500).send('Server error while fetching water charges');
    }
};

exports.updateWaterCharge = async (req, res) => {
    const { address } = req.params;
    const { water_charge } = req.body;
    const billFile = req.files && req.files.bill ? req.files.bill[0].filename : null;

    const allowed = await getWaterAddresses();
    if (!allowed.includes(address)) {
        return res.status(400).json({ msg: 'Invalid water address.' });
    }

    const water = parseFloat(water_charge) || 0;

    try {
        await pool.query('BEGIN');

        let oldBill = null;
        if (billFile) {
            const { rows: existing } = await pool.query(
                'SELECT bill_image FROM WaterAddresses WHERE address_name=$1',
                [address]
            );
            if (existing.length) {
                oldBill = existing[0].bill_image;
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO WaterAddresses (
                address_name, water_charge, bill_image, updated_at
            ) VALUES ($1,$2,$3,CURRENT_TIMESTAMP)
            ON CONFLICT (address_name)
            DO UPDATE SET
                water_charge=EXCLUDED.water_charge,
                bill_image=COALESCE(EXCLUDED.bill_image, WaterAddresses.bill_image),
                updated_at=CURRENT_TIMESTAMP
            RETURNING *`,
            [address, water, billFile]
        );

        await pool.query('COMMIT');

        if (billFile && oldBill && oldBill !== rows[0].bill_image) {
            const filePath = path.join(__dirname, '../../uploads', oldBill);
            try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting old bill file:', err.message); }
        }

        res.json(rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error in updateWaterCharge:', err.message);
        res.status(500).send('Server error while updating water charge');
    }
};

exports.getElectricCharges = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT *, (current_unit - last_unit)*5 AS total_charge FROM ElectricAddresses ORDER BY address_name');
        res.json(rows);
    } catch (err) {
        console.error('Error in getElectricCharges:', err.message);
        res.status(500).send('Server error while fetching electric charges');
    }
};

exports.updateElectricCharge = async (req, res) => {
    const { address } = req.params;
    const { current_unit } = req.body;
    const lastFile = req.files && req.files.lastBill ? req.files.lastBill[0].filename : null;
    const currentFile = req.files && req.files.currentBill ? req.files.currentBill[0].filename : null;

    const allowed = await getElectricAddresses();
    if (!allowed.includes(address)) {
        return res.status(400).json({ msg: 'Invalid electric address.' });
    }

    const current = parseFloat(current_unit) || 0;

    try {
        await pool.query('BEGIN');

        let lastUnit = 0;
        let oldLast = null;
        let oldCurrent = null;
        const { rows: existing } = await pool.query('SELECT current_unit, bill_current_image, bill_last_image FROM ElectricAddresses WHERE address_name=$1', [address]);
        if (existing.length) {
            lastUnit = existing[0].current_unit || 0;
            oldLast = existing[0].bill_last_image;
            oldCurrent = existing[0].bill_current_image;
        }

        const { rows } = await pool.query(
            `INSERT INTO ElectricAddresses (
                address_name, last_unit, current_unit, bill_last_image, bill_current_image, updated_at
            ) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
            ON CONFLICT (address_name)
            DO UPDATE SET
                last_unit=$2,
                current_unit=$3,
                bill_last_image=COALESCE($4, ElectricAddresses.bill_last_image),
                bill_current_image=COALESCE($5, ElectricAddresses.bill_current_image),
                updated_at=CURRENT_TIMESTAMP
            RETURNING *`,
            [address, lastUnit, current, lastFile, currentFile]
        );

        await pool.query('COMMIT');

        if (lastFile && oldLast && oldLast !== rows[0].bill_last_image) {
            const filePath = path.join(__dirname, '../../uploads', oldLast);
            try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting old bill file:', err.message); }
        }
        if (currentFile && oldCurrent && oldCurrent !== rows[0].bill_current_image) {
            const filePath = path.join(__dirname, '../../uploads', oldCurrent);
            try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting old bill file:', err.message); }
        }

        res.json(rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error in updateElectricCharge:', err.message);
        res.status(500).send('Server error while updating electric charge');
    }
};
