-- Attendance system database schema

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

-- Old verified records are automatically purged on the 10th day of each month by the server.
