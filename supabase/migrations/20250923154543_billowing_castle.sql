-- MAP Management System Database Setup
CREATE DATABASE IF NOT EXISTS map_management;
USE map_management;

-- Students table
CREATE TABLE students (
    prn VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    dept VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    programme VARCHAR(50) NOT NULL,
    course_duration INT NOT NULL,
    admission_year VARCHAR(9) NOT NULL,
    password VARCHAR(255) NOT NULL,
    MAP_point INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coordinators table
CREATE TABLE coordinators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HoDs table
CREATE TABLE hods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programme rules table
CREATE TABLE programme_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_year VARCHAR(9) NOT NULL,
    programme VARCHAR(50) NOT NULL,
    duration INT NOT NULL,
    technical INT NOT NULL,
    sports_cultural INT NOT NULL,
    community_outreach INT NOT NULL,
    innovation INT NOT NULL,
    leadership INT NOT NULL,
    total_points INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_program_year (admission_year, programme)
);

-- Categories table
CREATE TABLE categories (
    id CHAR(1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Activities master table
CREATE TABLE activities_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id CHAR(1) NOT NULL,
    activity_name VARCHAR(150) NOT NULL,
    document_evidence VARCHAR(150) NOT NULL,
    points_type ENUM('Fixed','Level') NOT NULL,
    min_points INT DEFAULT NULL,
    max_points INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Activity levels table
CREATE TABLE activity_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    level VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities_master(id) ON DELETE CASCADE
);

-- Activities submitted by students
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prn VARCHAR(20) NOT NULL,
    category CHAR(1) NOT NULL,
    activity_type INT NOT NULL, -- References activities_master.id
    level VARCHAR(50),
    certificate VARCHAR(255),
    proof VARCHAR(255),
    proof_type VARCHAR(50),
    date DATE NOT NULL,
    remarks TEXT,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    points INT DEFAULT 0,
    coordinator_remarks TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    FOREIGN KEY (prn) REFERENCES students(prn),
    FOREIGN KEY (activity_type) REFERENCES activities_master(id)
);

-- Insert categories
INSERT INTO categories (id, name) VALUES
('A', 'Technical Skills'),
('B', 'Sports & Cultural'),
('C', 'Community Outreach & Social Initiatives'),
('D', 'Innovation / IPR / Entrepreneurship'),
('E', 'Leadership / Management');

-- Insert programme rules for 2025-2026
INSERT INTO programme_rules 
(admission_year, programme, duration, technical, sports_cultural, community_outreach, innovation, leadership, total_points)
VALUES
('2025-2026', 'B.Tech', 4, 45, 10, 10, 25, 10, 100),
('2025-2026', 'B.Tech (DSY)', 3, 30, 10, 10, 15, 10, 75),
('2025-2026', 'Integrated B.Tech', 6, 50, 10, 15, 25, 15, 120),
('2025-2026', 'B.Pharm', 4, 45, 10, 15, 20, 10, 100),
('2025-2026', 'BCA', 3, 20, 10, 10, 10, 10, 60),
('2025-2026', 'MCA', 2, 20, 5, 10, 5, 10, 50),
('2025-2026', 'B.Sc', 3, 20, 10, 10, 10, 10, 60),
('2025-2026', 'M.Sc', 2, 20, 5, 5, 10, 10, 50),
('2025-2026', 'B.Com', 3, 20, 10, 10, 10, 10, 60),
('2025-2026', 'M.Com', 2, 20, 5, 5, 10, 10, 50),
('2025-2026', 'BBA', 3, 20, 10, 10, 10, 10, 60),
('2025-2026', 'MBA', 2, 20, 10, 10, 10, 10, 60);

-- Insert programme rules for 2024-2025
INSERT INTO programme_rules 
(admission_year, programme, duration, technical, sports_cultural, community_outreach, innovation, leadership, total_points)
VALUES
('2024-2025', 'B.Tech', 4, 30, 5, 10, 20, 10, 75),
('2024-2025', 'B.Tech (DSY)', 3, 20, 5, 5, 15, 5, 50),
('2024-2025', 'B.Com', 3, 15, 5, 5, 10, 10, 45),
('2024-2025', 'BBA', 3, 20, 5, 5, 5, 10, 45),
('2024-2025', 'MBA', 2, 10, 5, 5, 5, 5, 30);

-- Insert activities for Category A - Technical Skills
INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type) VALUES
('A', 'Paper Presentation', 'Certificate', 'Level'),
('A', 'Project Competition', 'Certificate', 'Level'),
('A', 'Hackathons / Ideathons', 'Certificate', 'Level'),
('A', 'Poster Competitions', 'Certificate', 'Level'),
('A', 'Competitive Programming', 'Certificate', 'Level'),
('A', 'Workshop Participation', 'Certificate', 'Level'),
('A', 'Industrial Training / Case Studies', 'Certificate', 'Level');

INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type, min_points, max_points) VALUES
('A', 'MOOC with Final Assessment', 'Certificate', 'Fixed', 5, 5),
('A', 'Internship / Professional Certification', 'Certificate', 'Fixed', 5, 5),
('A', 'Industrial / Exhibition Visit', 'Report', 'Fixed', 5, 5),
('A', 'Language Proficiency (EF SET + Foreign Language)', 'Certificate', 'Fixed', 5, 10);

-- Insert levels for Category A level-based activities
INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'Department', 2 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'College', 3 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'University', 4 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'District', 6 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'State', 9 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'National', 12 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'International', 15 FROM activities_master WHERE activity_name IN ('Paper Presentation', 'Project Competition', 'Hackathons / Ideathons', 'Poster Competitions', 'Competitive Programming', 'Workshop Participation', 'Industrial Training / Case Studies') AND category_id = 'A';

-- Insert activities for Category B - Sports & Cultural
INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type) VALUES
('B', 'Sports Participation', 'Certificate', 'Level'),
('B', 'Cultural Participation', 'Certificate', 'Level');

-- Insert levels for Category B
INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'Department', 2 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'College', 2 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'University', 4 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'District', 4 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'State', 6 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'National', 8 FROM activities_master WHERE category_id = 'B';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'International', 10 FROM activities_master WHERE category_id = 'B';

-- Insert activities for Category C - Community Outreach
INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type, min_points, max_points) VALUES
('C', 'Community Service (Two Day)', 'Certificate/Letter', 'Fixed', 3, 3),
('C', 'Community Service (Up to One Week)', 'Certificate/Letter', 'Fixed', 6, 6),
('C', 'Community Service (One Month)', 'Certificate/Letter', 'Fixed', 9, 9),
('C', 'Community Service (One Semester/Year)', 'Certificate/Letter', 'Fixed', 12, 12);

-- Insert activities for Category D - Innovation / IPR / Entrepreneurship
INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type, min_points, max_points) VALUES
('D', 'Entrepreneurship / IPR Workshop', 'Certificate', 'Fixed', 5, 5),
('D', 'MSME Programme', 'Certificate', 'Fixed', 5, 5),
('D', 'Awards/Recognitions for Products', 'Certificate', 'Fixed', 10, 10),
('D', 'Completed Prototype Development', 'Report', 'Fixed', 15, 15),
('D', 'Filed a Patent', 'Certificate', 'Fixed', 5, 5),
('D', 'Published Patent', 'Certificate', 'Fixed', 10, 10),
('D', 'Patent Granted', 'Certificate', 'Fixed', 15, 15),
('D', 'Registered Start-up Company', 'Legal Proof', 'Fixed', 10, 10),
('D', 'Revenue/Profits Generated', 'Proof', 'Fixed', 15, 15),
('D', 'Attracted Investor Funding', 'Proof', 'Fixed', 15, 15),
('D', 'International Conference / Journal (Scopus/UGC)', 'Certificate', 'Fixed', 10, 10),
('D', 'Innovation Implemented by Industry/User', 'Proof', 'Fixed', 15, 15),
('D', 'Social Innovation / Grassroot Value Addition', 'Proof', 'Fixed', 10, 10),
('D', 'Business Hackathon', 'Certificate', 'Fixed', 10, 10),
('D', 'Social Enterprise Pilot', 'Certificate', 'Fixed', 10, 10),
('D', 'High Customer Review for Product', 'Certificate', 'Fixed', 10, 10),
('D', 'Developed Social Innovation with Impact', 'Proof', 'Fixed', 10, 10);

-- Insert activities for Category E - Leadership / Management
INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type) VALUES
('E', 'Club/Association Participation (Member/Volunteer)', 'Certificate', 'Level'),
('E', 'Club/Association Coordinator', 'Certificate', 'Level');

INSERT INTO activities_master (category_id, activity_name, document_evidence, points_type, min_points, max_points) VALUES
('E', 'Professional Society Membership (IEEE, CSI, etc.)', 'Certificate', 'Fixed', 5, 5),
('E', 'Special Initiatives for University', 'Proof', 'Fixed', 5, 5);

-- Insert levels for Category E level-based activities
INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'Department', 2 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'College', 2 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'University', 4 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'District', 4 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'State', 6 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'National', 8 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'International', 10 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

INSERT INTO activity_levels (activity_id, level, points)
SELECT id, 'Professional Society', 5 FROM activities_master WHERE activity_name IN ('Club/Association Participation (Member/Volunteer)', 'Club/Association Coordinator') AND category_id = 'E';

-- Insert sample users for testing
INSERT INTO students (prn, first_name, middle_name, last_name, dept, year, programme, course_duration, admission_year, password) VALUES
('2025001', 'John', 'A', 'Doe', 'Computer Science & Engineering', 1, 'B.Tech', 4, '2025-2026', 'password123'),
('2025002', 'Jane', 'B', 'Smith', 'Information Technology', 1, 'B.Tech', 4, '2025-2026', 'password123'),
('2024001', 'Mike', 'C', 'Johnson', 'Computer Science & Engineering', 2, 'B.Tech', 4, '2024-2025', 'password123');

INSERT INTO coordinators (name, password) VALUES
('Dr. Coordinator One', 'coord123'),
('Prof. Coordinator Two', 'coord123');

INSERT INTO hods (name, password) VALUES
('Dr. HoD CSE', 'hod123'),
('Prof. HoD IT', 'hod123');

INSERT INTO admins (name, password) VALUES
('System Administrator', 'admin123'),
('MAP Admin', 'admin123');

-- Create uploads directory (Note: This needs to be done manually on the server)
-- mkdir backend/uploads
-- chmod 755 backend/uploads