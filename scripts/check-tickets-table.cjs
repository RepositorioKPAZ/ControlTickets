const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'kpazserv0001.mysql.database.azure.com',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'controldev',
  password: process.env.MYSQL_PASSWORD || '.Chinito2025',
  database: process.env.MYSQL_DATABASE || 'controltkt',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.MYSQL_SSL_CA
  }
};

async function checkTicketsTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking tickets table structure...');
    
    // Check if tickets table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tickets'");
    if (tables.length === 0) {
      console.log('❌ Tickets table does not exist!');
      console.log('📋 Creating tickets table...');
      
      // Create tickets table
      await connection.execute(`
        CREATE TABLE tickets (
          id CHAR(36) NOT NULL PRIMARY KEY,
          ticket_number VARCHAR(50) NOT NULL UNIQUE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status ENUM('open', 'assigned', 'in_progress', 'closed') DEFAULT 'open',
          priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
          request_type VARCHAR(50) NOT NULL DEFAULT 'support',
          client_id CHAR(36) NOT NULL,
          assigned_to CHAR(36),
          created_by CHAR(36) NOT NULL,
          assigned_at TIMESTAMP NULL,
          closed_at TIMESTAMP NULL,
          resolution_time_hours DECIMAL(10,2),
          resolution_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tickets table created successfully!');
    } else {
      console.log('✅ Tickets table exists');
    }
    
    // Check table structure
    const [columns] = await connection.execute("DESCRIBE tickets");
    console.log('📋 Tickets table columns:');
    columns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Check if there are any tickets
    const [tickets] = await connection.execute("SELECT COUNT(*) as count FROM tickets");
    console.log(`📊 Total tickets in database: ${tickets[0].count}`);
    
    // Check if there are any clients (needed for foreign key)
    const [clients] = await connection.execute("SELECT COUNT(*) as count FROM clients");
    console.log(`👥 Total clients in database: ${clients[0].count}`);
    
    if (clients[0].count === 0) {
      console.log('⚠️  No clients found! You need at least one client to create tickets.');
    }
    
    // Check if there are any users (needed for created_by)
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`👤 Total users in database: ${users[0].count}`);
    
    if (users[0].count === 0) {
      console.log('⚠️  No users found! You need at least one user to create tickets.');
    }
    
  } catch (error) {
    console.error('❌ Error checking tickets table:', error);
  } finally {
    await connection.end();
  }
}

checkTicketsTable();
