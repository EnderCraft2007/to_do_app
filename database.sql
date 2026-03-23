CREATE DATABASE IF NOT EXISTS todo_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    city VARCHAR(50),
    birthdate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by INT,
    attendees_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS event_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teszt adatok
INSERT INTO users (username, password, name, email, phone, city, birthdate) VALUES
('admin', 'admin123', 'Rendszergazda', 'admin@example.com', '06301234567', 'Budapest', '1990-01-01'),
('teszt_elek', 'teszt123', 'Teszt Elek', 'teszt@example.com', '06209876543', 'Debrecen', '1995-05-15');

INSERT INTO events (title, event_date, is_public, created_by, attendees_count) VALUES
('Koncert', '2026-05-20', TRUE, 1, 12),
('Webfejlesztő Workshop', '2026-06-15', TRUE, 1, 8),
('Sportnap', '2026-07-02', TRUE, 1, 25),
('Privát megbeszélés', '2026-04-10', FALSE, 2, 0);

INSERT INTO event_participants (event_id, user_id) VALUES
(1, 2),
(2, 2);
