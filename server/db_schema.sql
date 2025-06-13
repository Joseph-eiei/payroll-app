-- Table storing employee details
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nickname VARCHAR(100),
    daily_wage NUMERIC(10,2),
    nationality VARCHAR(50),
    payment_cycle VARCHAR(50),
    employee_role VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    water_address TEXT,
    electric_address TEXT

);

-- Table storing admin user details
CREATE TABLE public.admins (
    id INTEGER PRIMARY KEY,
    username VARCHAR(100),
    password_hash VARCHAR(255),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE,
);

-- Table storing attendance form header data
CREATE TABLE IF NOT EXISTS AttendanceForms (
    id SERIAL PRIMARY KEY,
    site_name TEXT NOT NULL,
    attendance_date DATE NOT NULL,
    site_supervisor_id INTEGER REFERENCES Employees(id),
    supervisor_check_in TIME,
    supervisor_check_out TIME,
    supervisor_ot NUMERIC(5,2),
    supervisor_remarks TEXT,
    image_attachment TEXT,
    is_sunday BOOLEAN DEFAULT FALSE,
    is_bonus BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table storing individual employee attendance rows for each form
CREATE TABLE IF NOT EXISTS AttendanceEmployees (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER REFERENCES AttendanceForms(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES Employees(id),
    check_in TIME,
    check_out TIME,
    ot_hours NUMERIC(5,2),
    remarks TEXT
);

-- Table for different deduction types used in payroll
CREATE TABLE IF NOT EXISTS DeductionTypes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water charge addresses
CREATE TABLE IF NOT EXISTS WaterAddresses (
    address_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS WaterBills (
    id SERIAL PRIMARY KEY,
    address_name TEXT REFERENCES WaterAddresses(address_name) ON DELETE CASCADE,
    bill_month DATE NOT NULL,
    water_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
    bill_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address_name, bill_month)
);

-- Electric charge addresses
CREATE TABLE IF NOT EXISTS ElectricAddresses (
    address_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS ElectricBills (
    id SERIAL PRIMARY KEY,
    address_name TEXT REFERENCES ElectricAddresses(address_name) ON DELETE CASCADE,
    bill_month DATE NOT NULL,
    last_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
    current_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
    bill_last_image TEXT,
    bill_current_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address_name, bill_month)
);

-- Link employee water/electric addresses to respective tables
ALTER TABLE IF EXISTS Employees
    ADD CONSTRAINT IF NOT EXISTS employees_water_address_fkey
        FOREIGN KEY (water_address)
        REFERENCES WaterAddresses(address_name);
ALTER TABLE IF EXISTS Employees
    ADD CONSTRAINT IF NOT EXISTS employees_electric_address_fkey
        FOREIGN KEY (electric_address)
        REFERENCES ElectricAddresses(address_name);

-- Old verified records are automatically purged on the 10th day of each month by the server.
