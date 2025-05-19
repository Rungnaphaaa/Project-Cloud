CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url VARCHAR(255),
  recipe_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  role_id INTEGER REFERENCES roles(role_id) ON DELETE SET NULL
);

-- เพิ่มข้อมูลบทบาท
INSERT INTO roles (role_name) VALUES
('admin'),
('user');

-- เพิ่มผู้ใช้
INSERT INTO users (
  name, email, password, bio, profile_image_url, recipe_count, favorite_count, join_date, role_id
) VALUES
  (
    'Martin Panchiangsri',
    'B6525279@g.sut.ac.th',
    '1234',
    'Computer engineering student',
    '/profile_image/profile1.jpg',
    5,
    10,
    '2023-08-15',
    2
  ),
  (
    'Poonchub Nanawan',
    'B6525163@g.sut.ac.th',
    '1234',
    'Software developer',
    '/profile_image/profile2.jpg',
    3,
    7,
    '2023-07-01',
    2
  ),
  (
    'Rungnapha Khuanphon',
    'B6514136@g.sut.ac.th',
    '1234',
    'System Admin',
    '/profile_image/profile3.jpg',
    0,
    0,
    '2023-06-10',
    1
  ),
  (
    'Thiradet Homhwan',
    'B6512057@g.sut.ac.th',
    '1234',
    'Data Engineering',
    '/profile_image/profile4.jpg',
    2,
    5,
    '2023-05-20',
    2
  );
