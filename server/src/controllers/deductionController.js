const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { getAccommodationTypes } = require('../utils/accommodation');

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

exports.getAccommodationCharges = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM AccommodationCharges ORDER BY accommodation_type');
        res.json(rows);
    } catch (err) {
        console.error('Error in getAccommodationCharges:', err.message);
        res.status(500).send('Server error while fetching accommodation charges');
    }
};

exports.updateAccommodationCharge = async (req, res) => {
    const { type } = req.params;
    const { water_charge, electric_charge } = req.body;
    const waterFile = req.files && req.files.waterBill ? req.files.waterBill[0].filename : null;
    const electricFile = req.files && req.files.electricBill ? req.files.electricBill[0].filename : null;

    const allowedAccom = await getAccommodationTypes();
    if (!allowedAccom.includes(type)) {
        return res.status(400).json({ msg: `Invalid accommodation type. Allowed values are: ${allowedAccom.join(', ')}.` });
    }

    const water = parseFloat(water_charge) || 0;
    const electric = parseFloat(electric_charge) || 0;

    try {
        await pool.query('BEGIN');

        let oldWater = null;
        let oldElectric = null;
        if (waterFile || electricFile) {
            const { rows: existing } = await pool.query(
                'SELECT water_bill_image, electric_bill_image FROM AccommodationCharges WHERE accommodation_type=$1',
                [type]
            );
            if (existing.length) {
                oldWater = existing[0].water_bill_image;
                oldElectric = existing[0].electric_bill_image;
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO AccommodationCharges (
                accommodation_type, water_charge, electric_charge, water_bill_image, electric_bill_image, updated_at
            ) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
            ON CONFLICT (accommodation_type)
            DO UPDATE SET
                water_charge=EXCLUDED.water_charge,
                electric_charge=EXCLUDED.electric_charge,
                water_bill_image=COALESCE(EXCLUDED.water_bill_image, AccommodationCharges.water_bill_image),
                electric_bill_image=COALESCE(EXCLUDED.electric_bill_image, AccommodationCharges.electric_bill_image),
                updated_at=CURRENT_TIMESTAMP
            RETURNING *`,
            [type, water, electric, waterFile, electricFile]
        );

        await pool.query('COMMIT');

        if (waterFile && oldWater && oldWater !== rows[0].water_bill_image) {
            const filePath = path.join(__dirname, '../../uploads', oldWater);
            try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting old bill file:', err.message); }
        }
        if (electricFile && oldElectric && oldElectric !== rows[0].electric_bill_image) {
            const filePath = path.join(__dirname, '../../uploads', oldElectric);
            try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting old bill file:', err.message); }
        }

        res.json(rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error in updateAccommodationCharge:', err.message);
        res.status(500).send('Server error while updating accommodation charge');
    }
};
