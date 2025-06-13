const pool = require('../config/db');
const fs = require('fs');
const path = require('path');


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
        const { rows } = await pool.query(`
            SELECT w.address_name,
                   b.water_charge,
                   b.bill_image,
                   TO_CHAR(b.bill_month, 'YYYY-MM') AS bill_month
            FROM WaterAddresses w
            LEFT JOIN LATERAL (
                SELECT water_charge, bill_image, bill_month
                FROM WaterBills
                WHERE address_name = w.address_name
                ORDER BY bill_month DESC
                LIMIT 1
            ) b ON true
            ORDER BY w.address_name
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error in getWaterCharges:', err.message);
        res.status(500).send('Server error while fetching water charges');
    }
};

exports.updateWaterCharge = async (req, res) => {
    const { address } = req.params;
    const { water_charge, bill_month } = req.body;
    const billFile = req.files && req.files.bill ? req.files.bill[0].filename : null;

    const water = parseFloat(water_charge) || 0;
    const month = (bill_month ? `${bill_month}-01` : new Date().toISOString().slice(0,7) + '-01');

    try {
        await pool.query('BEGIN');

        await pool.query('INSERT INTO WaterAddresses(address_name) VALUES ($1) ON CONFLICT DO NOTHING', [address]);

        let oldBill = null;
        if (billFile) {
            const { rows: existing } = await pool.query(
                'SELECT bill_image FROM WaterBills WHERE address_name=$1 AND bill_month=$2',
                [address, month]
            );
            if (existing.length) {
                oldBill = existing[0].bill_image;
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO WaterBills (
                address_name, bill_month, water_charge, bill_image, created_at
            ) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)
            ON CONFLICT (address_name, bill_month)
            DO UPDATE SET
                water_charge=EXCLUDED.water_charge,
                bill_image=COALESCE(EXCLUDED.bill_image, WaterBills.bill_image),
                created_at=CURRENT_TIMESTAMP
            RETURNING *`,
            [address, month, water, billFile]
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
        const { rows } = await pool.query(`
            SELECT e.address_name,
                   b.last_unit,
                   b.current_unit,
                   b.bill_last_image,
                   b.bill_current_image,
                   TO_CHAR(b.bill_month, 'YYYY-MM') AS bill_month,
                   (b.current_unit - b.last_unit) * 5 AS total_charge
            FROM ElectricAddresses e
            LEFT JOIN LATERAL (
                SELECT last_unit, current_unit, bill_last_image, bill_current_image, bill_month
                FROM ElectricBills
                WHERE address_name = e.address_name
                ORDER BY bill_month DESC
                LIMIT 1
            ) b ON true
            ORDER BY e.address_name
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error in getElectricCharges:', err.message);
        res.status(500).send('Server error while fetching electric charges');
    }
};

exports.updateElectricCharge = async (req, res) => {
    const { address } = req.params;
    const { current_unit, bill_month } = req.body;
    const lastFile = req.files && req.files.lastBill ? req.files.lastBill[0].filename : null;
    const currentFile = req.files && req.files.currentBill ? req.files.currentBill[0].filename : null;

    const current = parseFloat(current_unit) || 0;
    const month = (bill_month ? `${bill_month}-01` : new Date().toISOString().slice(0,7) + '-01');

    try {
        await pool.query('BEGIN');

        await pool.query('INSERT INTO ElectricAddresses(address_name) VALUES ($1) ON CONFLICT DO NOTHING', [address]);

        let lastUnit = 0;
        const { rows: prev } = await pool.query(
            'SELECT current_unit FROM ElectricBills WHERE address_name=$1 ORDER BY bill_month DESC LIMIT 1',
            [address]
        );
        if (prev.length) {
            lastUnit = prev[0].current_unit || 0;
        }

        let oldLast = null;
        let oldCurrent = null;
        if (lastFile || currentFile) {
            const { rows: existing } = await pool.query(
                'SELECT bill_last_image, bill_current_image FROM ElectricBills WHERE address_name=$1 AND bill_month=$2',
                [address, month]
            );
            if (existing.length) {
                oldLast = existing[0].bill_last_image;
                oldCurrent = existing[0].bill_current_image;
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO ElectricBills (
                address_name, bill_month, last_unit, current_unit, bill_last_image, bill_current_image, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)
            ON CONFLICT (address_name, bill_month)
            DO UPDATE SET
                last_unit=$3,
                current_unit=$4,
                bill_last_image=COALESCE($5, ElectricBills.bill_last_image),
                bill_current_image=COALESCE($6, ElectricBills.bill_current_image),
                created_at=CURRENT_TIMESTAMP
            RETURNING *`,
            [address, month, lastUnit, current, lastFile, currentFile]
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

exports.deleteWaterAddress = async (req, res) => {
    const { address } = req.params;
    try {
        const { rows: bills } = await pool.query('SELECT bill_image FROM WaterBills WHERE address_name=$1', [address]);
        const { rowCount } = await pool.query('DELETE FROM WaterAddresses WHERE address_name=$1', [address]);
        if (rowCount === 0) return res.status(404).json({ msg: 'Water address not found' });

        for (const b of bills) {
            if (b.bill_image) {
                const filePath = path.join(__dirname, '../../uploads', b.bill_image);
                try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting water bill file:', err.message); }
            }
        }
        res.json({ msg: 'Water address deleted' });
    } catch (err) {
        console.error('Error in deleteWaterAddress:', err.message);
        res.status(500).send('Server error while deleting water address');
    }
};

exports.deleteElectricAddress = async (req, res) => {
    const { address } = req.params;
    try {
        const { rows: bills } = await pool.query('SELECT bill_last_image, bill_current_image FROM ElectricBills WHERE address_name=$1', [address]);
        const { rowCount } = await pool.query('DELETE FROM ElectricAddresses WHERE address_name=$1', [address]);
        if (rowCount === 0) return res.status(404).json({ msg: 'Electric address not found' });

        for (const b of bills) {
            if (b.bill_last_image) {
                const filePath = path.join(__dirname, '../../uploads', b.bill_last_image);
                try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting electric bill file:', err.message); }
            }
            if (b.bill_current_image) {
                const filePath = path.join(__dirname, '../../uploads', b.bill_current_image);
                try { await fs.promises.unlink(filePath); } catch (err) { if (err.code !== 'ENOENT') console.error('Error deleting electric bill file:', err.message); }
            }
        }
        res.json({ msg: 'Electric address deleted' });
    } catch (err) {
        console.error('Error in deleteElectricAddress:', err.message);
        res.status(500).send('Server error while deleting electric address');
    }
};

exports.getWaterHistory = async (req, res) => {
    const { address } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT bill_month, water_charge, bill_image
             FROM WaterBills
             WHERE address_name=$1
             ORDER BY bill_month DESC`,
            [address]
        );
        res.json(rows.map(r => ({
            bill_month: r.bill_month.toISOString().slice(0,7),
            water_charge: r.water_charge,
            bill_image: r.bill_image
        })));
    } catch (err) {
        console.error('Error in getWaterHistory:', err.message);
        res.status(500).send('Server error while fetching water history');
    }
};

exports.getElectricHistory = async (req, res) => {
    const { address } = req.params;
    try {
        const { rows } = await pool.query(
            `SELECT bill_month, last_unit, current_unit, bill_last_image, bill_current_image
             FROM ElectricBills
             WHERE address_name=$1
             ORDER BY bill_month DESC`,
            [address]
        );
        res.json(rows.map(r => ({
            bill_month: r.bill_month.toISOString().slice(0,7),
            last_unit: r.last_unit,
            current_unit: r.current_unit,
            bill_last_image: r.bill_last_image,
            bill_current_image: r.bill_current_image
        })));
    } catch (err) {
        console.error('Error in getElectricHistory:', err.message);
        res.status(500).send('Server error while fetching electric history');
    }
};
