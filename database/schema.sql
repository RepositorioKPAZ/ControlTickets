-- MySQL Schema for Ticket Management System
-- Based on Supabase migrations

-- Create database
CREATE DATABASE IF NOT EXISTS ticket_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ticket_system;

-- Create users table (replaces Supabase auth.users)
CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('admin', 'agent', 'user') DEFAULT 'agent',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create countries table
CREATE TABLE countries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create request_types table
CREATE TABLE request_types (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE clients (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create holidays table
CREATE TABLE holidays (
  id CHAR(36) NOT NULL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  country_id CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT
);

-- Create tickets table
CREATE TABLE tickets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('open', 'assigned', 'in_progress', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  request_type VARCHAR(50) NOT NULL DEFAULT 'support',
  client_id CHAR(36) NOT NULL,
  usu_solicitante VARCHAR(255),
  assigned_to CHAR(36),
  created_by CHAR(36) NOT NULL,
  assigned_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  resolution_time_hours DECIMAL(10,2),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create ticket_history table
CREATE TABLE ticket_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  changed_by CHAR(36) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_holidays_country_id ON holidays(country_id);

-- Insert default countries
INSERT INTO countries (id, name, code, is_active) VALUES 
(UUID(), 'España', 'ES', true),
(UUID(), 'México', 'MX', true),
(UUID(), 'Argentina', 'AR', true),
(UUID(), 'Colombia', 'CO', true),
(UUID(), 'Chile', 'CL', true),
(UUID(), 'Perú', 'PE', true),
(UUID(), 'Venezuela', 'VE', true),
(UUID(), 'Ecuador', 'EC', true),
(UUID(), 'Bolivia', 'BO', true),
(UUID(), 'Uruguay', 'UY', true);

-- Insert default request types
INSERT INTO request_types (id, name, description, is_active) VALUES 
(UUID(), 'support', 'Soporte técnico general', true),
(UUID(), 'bug', 'Reporte de errores o fallos', true),
(UUID(), 'feature', 'Solicitud de nueva funcionalidad', true),
(UUID(), 'maintenance', 'Tareas de mantenimiento', true),
(UUID(), 'other', 'Otros tipos de solicitudes', true);

-- Insert sample holidays for 2025
INSERT INTO holidays (id, date, name, year, country_id) VALUES
(UUID(), '2025-01-01', 'Año Nuevo', 2025, (SELECT id FROM countries WHERE name = 'México' LIMIT 1)),
(UUID(), '2025-05-01', 'Día del Trabajador', 2025, (SELECT id FROM countries WHERE name = 'México' LIMIT 1)),
(UUID(), '2025-09-15', 'Día de la Independencia', 2025, (SELECT id FROM countries WHERE name = 'México' LIMIT 1)),
(UUID(), '2025-09-16', 'Día de la Independencia', 2025, (SELECT id FROM countries WHERE name = 'México' LIMIT 1)),
(UUID(), '2025-12-25', 'Navidad', 2025, (SELECT id FROM countries WHERE name = 'México' LIMIT 1));

-- Create stored procedure to generate ticket numbers
DELIMITER //
CREATE PROCEDURE GenerateTicketNumber(OUT ticket_number VARCHAR(50))
BEGIN
  DECLARE year_suffix VARCHAR(4);
  DECLARE ticket_count INT;
  
  SET year_suffix = YEAR(NOW());
  
  SELECT COUNT(*) + 1 INTO ticket_count
  FROM tickets
  WHERE YEAR(created_at) = year_suffix;
  
  SET ticket_number = CONCAT('TCK-', year_suffix, '-', LPAD(ticket_count, 4, '0'));
END //
DELIMITER ;

-- Create trigger to auto-generate ticket numbers
DELIMITER //
CREATE TRIGGER set_ticket_number_trigger
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    CALL GenerateTicketNumber(NEW.ticket_number);
  END IF;
END //
DELIMITER ;
