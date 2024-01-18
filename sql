CREATE TABLE adminlog (
  username VARCHAR(100) NOT NULL PRIMARY KEY,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE students (
  enrollment VARCHAR(10) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  parentphone VARCHAR(15) NOT NULL,
  room VARCHAR(10) NOT NULL,
  zipcode VARCHAR(10) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  password VARCHAR(255) NOT NULL
);


CREATE TABLE attendance (
  enrollment VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  attendance_date DATE NOT NULL,
  PRIMARY KEY (enrollment, attendance_date),
  FOREIGN KEY (enrollment) REFERENCES students (enrollment)
);

CREATE TABLE staff (
  username VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE warden (
  username VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  heading VARCHAR(255) NOT NULL,
  nbody TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance (
    id INT PRIMARY KEY,
    enrollment VARCHAR(255),
    room VARCHAR(255),
    request_for VARCHAR(255),
    requested_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    complete BOOLEAN
);
CREATE TABLE leave_applications (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  room_no VARCHAR(50) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  zipcode VARCHAR(6) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  reason TEXT NOT NULL,
  image VARCHAR(255),
  no_of_days INT(11) NOT NULL,
  PRIMARY KEY (id)
);
