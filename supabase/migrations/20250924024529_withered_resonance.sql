-- Update database structure for department-specific coordinators and HoDs

-- Add department and year columns to coordinators table
ALTER TABLE coordinators ADD COLUMN department VARCHAR(100) AFTER name;
ALTER TABLE coordinators ADD COLUMN year VARCHAR(10) AFTER department;

-- Add department column to hods table  
ALTER TABLE hods ADD COLUMN department VARCHAR(100) AFTER name;

-- Update existing coordinators with sample data
UPDATE coordinators SET department = 'Computer Science & Engineering', year = 'FY' WHERE id = 1;
UPDATE coordinators SET department = 'Computer Science & Engineering', year = 'SY' WHERE id = 2;

-- Update existing HoDs with sample data
UPDATE hods SET department = 'Computer Science & Engineering' WHERE id = 1;
UPDATE hods SET department = 'Information Technology' WHERE id = 2;

-- Insert more sample coordinators for different departments and years
INSERT INTO coordinators (name, department, year, password) VALUES
('Prof. FY-IT Coordinator', 'Information Technology', 'FY', 'coord123'),
('Prof. SY-IT Coordinator', 'Information Technology', 'SY', 'coord123'),
('Prof. TY-CSE Coordinator', 'Computer Science & Engineering', 'TY', 'coord123'),
('Prof. Final-CSE Coordinator', 'Computer Science & Engineering', 'Final', 'coord123'),
('Prof. FY-ECE Coordinator', 'Electronics & Telecommunication', 'FY', 'coord123'),
('Prof. SY-ECE Coordinator', 'Electronics & Telecommunication', 'SY', 'coord123'),
('Prof. FY-MECH Coordinator', 'Mechanical Engineering', 'FY', 'coord123'),
('Prof. SY-MECH Coordinator', 'Mechanical Engineering', 'SY', 'coord123');

-- Insert more HoDs for different departments
INSERT INTO hods (name, department, password) VALUES
('Dr. HoD ECE', 'Electronics & Telecommunication', 'hod123'),
('Prof. HoD MECH', 'Mechanical Engineering', 'hod123'),
('Dr. HoD CIVIL', 'Civil Engineering', 'hod123'),
('Prof. HoD PHARMACY', 'Pharmacy', 'hod123'),
('Dr. HoD MANAGEMENT', 'Management Studies', 'hod123'),
('Prof. HoD COMMERCE', 'Commerce', 'hod123'),
('Dr. HoD SCIENCE', 'Science', 'hod123');

-- Update activities table to include more fields for better tracking
ALTER TABLE activities ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER remarks;
ALTER TABLE activities ADD COLUMN verified_at TIMESTAMP NULL AFTER submitted_at;
ALTER TABLE activities ADD COLUMN verified_by INT NULL AFTER verified_at;
ALTER TABLE activities ADD COLUMN coordinator_remarks TEXT AFTER points;
ALTER TABLE activities ADD COLUMN proof VARCHAR(255) AFTER certificate;
ALTER TABLE activities ADD COLUMN proof_type VARCHAR(50) AFTER proof;

-- Update activities table to reference activities_master
ALTER TABLE activities MODIFY COLUMN activity_type INT NOT NULL;
ALTER TABLE activities ADD FOREIGN KEY (activity_type) REFERENCES activities_master(id);