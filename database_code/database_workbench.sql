-- Create database
CREATE DATABASE my_app_db;
USE my_app_db;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@example.com', 'password123'),
('user1', 'user1@example.com', 'password123');

INSERT INTO products (name, description, price, stock) VALUES 
('Laptop Gaming', 'High-end gaming laptop', 15000000, 5),
('Mouse Wireless', 'Gaming mouse with RGB', 500000, 20),
('Keyboard Mechanical', 'RGB mechanical keyboard', 800000, 15);