-- ============================================================
-- House Construction Expense Tracker — Database Setup
-- Run this once before starting the Flask app:
--   mysql -u root -p < setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS house_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE house_tracker;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT '🏗️',
    color VARCHAR(20) DEFAULT '#4f7ef8',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    supplier VARCHAR(150),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Default categories
INSERT IGNORE INTO categories (name, icon, color) VALUES
('Cement & Concrete', '🧱', '#e67e22'),
('Paint & Finishes', '🎨', '#9b59b6'),
('Tiles & Flooring', '🪟', '#1abc9c'),
('Roofing', '🏠', '#e74c3c'),
('Plumbing', '🚿', '#3498db'),
('Electrical', '⚡', '#f39c12'),
('Steel & Iron', '🔩', '#7f8c8d'),
('Windows & Doors', '🚪', '#2ecc71'),
('Sand & Ballast', '⛏️', '#d35400'),
('Labour & Wages', '👷', '#2980b9'),
('Timber & Wood', '🌲', '#27ae60'),
('Other', '📦', '#95a5a6');
