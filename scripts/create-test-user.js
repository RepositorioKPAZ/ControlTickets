const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
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

async function createTestUser() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Creating test user...');
    
    // Check if test user already exists
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE email = 'test@example.com'"
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ Test user already exists:');
      console.log(`  ID: ${existingUsers[0].id}`);
      console.log(`  Name: ${existingUsers[0].full_name}`);
      console.log(`  Email: ${existingUsers[0].email}`);
      console.log(`  Role: ${existingUsers[0].role}`);
      return existingUsers[0];
    }
    
    // Create test user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('test123', 10);
    
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'test@example.com', passwordHash, 'Usuario de Prueba', 'admin', true]
    );
    
    console.log('✅ Test user created successfully!');
    console.log(`  ID: ${userId}`);
    console.log(`  Name: Usuario de Prueba`);
    console.log(`  Email: test@example.com`);
    console.log(`  Password: test123`);
    console.log(`  Role: admin`);
    
    return { id: userId, full_name: 'Usuario de Prueba', email: 'test@example.com', role: 'admin' };
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createTestUser();
