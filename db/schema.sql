-- ============================================================
-- CampusStay v2.0 — PostgreSQL schema (converted from MySQL)
-- Run this once in your Neon / Postgres database SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS universities (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    location   VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS managers (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    phone        VARCHAR(20),
    whatsapp     VARCHAR(20),
    hostel_name  VARCHAR(150),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id              SERIAL PRIMARY KEY,
    manager_id      INT NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
    university_id   INT REFERENCES universities(id) ON DELETE SET NULL,
    hostel_name     VARCHAR(150) NOT NULL,
    room_identifier VARCHAR(50) NOT NULL,
    room_type       VARCHAR(20) NOT NULL CHECK (room_type IN ('Single','Two-in-one','Three-in-one','Four-in-one')),
    gender_spec     VARCHAR(20) NOT NULL CHECK (gender_spec IN ('Male Only','Female Only','Mixed/Universal')),
    annual_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
    semester_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    distance_km     DECIMAL(5,2) NOT NULL DEFAULT 0,
    walk_minutes    INT NOT NULL DEFAULT 0,
    availability    VARCHAR(20) DEFAULT 'Available' CHECK (availability IN ('Available','Fully Booked')),
    amenities       TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
    id          SERIAL PRIMARY KEY,
    room_id     INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,   -- now stores the full Vercel Blob URL
    media_type  VARCHAR(10) DEFAULT 'photo' CHECK (media_type IN ('photo','video')),
    sort_order  INT DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
    id               SERIAL PRIMARY KEY,
    room_id          INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    student_name     VARCHAR(100) NOT NULL,
    student_email    VARCHAR(150) NOT NULL,
    student_phone    VARCHAR(20),
    student_whatsapp VARCHAR(20),
    student_course   VARCHAR(100),
    student_level    VARCHAR(50),
    message          TEXT NOT NULL,
    status           VARCHAR(10) DEFAULT 'unread' CHECK (status IN ('unread','read','replied')),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id             SERIAL PRIMARY KEY,
    room_id        INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    reviewer_name  VARCHAR(100) NOT NULL,
    reviewer_email VARCHAR(150) NOT NULL,
    rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    status         VARCHAR(10) DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (room_id, reviewer_email)
);

CREATE TABLE IF NOT EXISTS watchlist (
    id            SERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL,
    room_id       INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    notified      BOOLEAN DEFAULT FALSE,
    added_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_token, room_id)
);

CREATE TABLE IF NOT EXISTS watchlist_notifications (
    id            SERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL,
    room_id       INT NOT NULL,
    message       VARCHAR(300),
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAMPLE DATA (same as the original — delete before real launch)
-- ============================================================
INSERT INTO universities (name, short_name, location) VALUES
('University of Ghana',               'UG',    'Legon, Accra'),
('Kwame Nkrumah University of Science & Technology', 'KNUST', 'Kumasi'),
('University of Cape Coast',          'UCC',   'Cape Coast'),
('Ghana Institute of Management and Public Administration', 'GIMPA', 'Accra'),
('University of Professional Studies', 'UPSA', 'Accra'),
('Ashesi University',                 'Ashesi','Berekuso');

-- Default password for both demo managers: "password"
INSERT INTO managers (full_name, email, password, phone, whatsapp, hostel_name) VALUES
('Kwame Asante', 'kwame@example.com', '$2a$10$r3HE.Tq9D1bFsOzDZ/Fcr.wE02d5W8iiZLLvoD6jWxFO4cu40IqOa', '0241234567', '233241234567', 'Sunrise Hostel'),
('Ama Boateng',  'ama@example.com',   '$2a$10$r3HE.Tq9D1bFsOzDZ/Fcr.wE02d5W8iiZLLvoD6jWxFO4cu40IqOa', '0551234567', '233551234567', 'Palm Court Hostel');

INSERT INTO rooms (manager_id, university_id, hostel_name, room_identifier, room_type, gender_spec, annual_price, semester_price, distance_km, walk_minutes, availability, amenities, description) VALUES
(1, 1, 'Sunrise Hostel', 'Block A-1',   'Single',      'Male Only',      3800, 2100, 0.4, 5,  'Available',    'WiFi,Water,Electricity,Fan',            'Clean single room with personal bathroom, 24hr security, and reliable electricity.'),
(1, 1, 'Sunrise Hostel', 'Block B-3',   'Two-in-one',  'Male Only',      4200, 2350, 0.4, 5,  'Available',    'WiFi,Water,Electricity,Fan,Wardrobe',   'Spacious twin room with wardrobes for each occupant.'),
(2, 1, 'Palm Court',     'Room 4C',     'Two-in-one',  'Female Only',    4500, 2500, 0.8, 10, 'Available',    'WiFi,Laundry,Kitchen,Security',         'Shared twin room with access to communal kitchen and laundry.'),
(2, 1, 'Palm Court',     'Room 9',      'Four-in-one', 'Female Only',    2200, 1300, 0.8, 10, 'Available',    'WiFi,Water,Electricity',                'Budget-friendly quad room, great for groups of friends.'),
(1, 1, 'Sunrise Hostel', 'Suite 7B',    'Single',      'Mixed/Universal',5500, 3000, 1.2, 15, 'Available',    'WiFi,Gym,Study Room,Security,Kitchen',  'Premium self-contained suite with all amenities.'),
(2, 1, 'Palm Court',     'B-12',        'Three-in-one','Female Only',    3100, 1700, 0.6, 8,  'Fully Booked', 'WiFi,Balcony,Fridge,Fan',               'Comfortable triple room with private balcony and fridge.');

INSERT INTO reviews (room_id, reviewer_name, reviewer_email, rating, comment) VALUES
(1, 'Kofi Mensah',    'kofi@student.ug.edu.gh',   5, 'Excellent place, very clean and management is responsive!'),
(1, 'Abena Sarpong',  'abena@student.ug.edu.gh',  4, 'Great location, close to campus. WiFi could be faster.'),
(2, 'Kweku Asare',    'kweku@student.ug.edu.gh',  5, 'Love it here. Affordable and peaceful environment.'),
(3, 'Akosua Frimpong','akosua@student.ug.edu.gh', 4, 'Nice hostel, very secure. The kitchen is a big plus.');
