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

async function checkResolvers() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Checking resolvers in database...');
    
    // Check all users
    const [allUsers] = await connection.execute('SELECT id, full_name, email, role, is_active FROM users');
    console.log(`📊 Total users found: ${allUsers.length}`);
    
    // Check resolvers (admin and agent roles)
    const [resolvers] = await connection.execute('SELECT id, full_name, email, role, is_active FROM users WHERE role IN ("admin", "agent")');
    console.log(`👥 Resolvers found: ${resolvers.length}`);
    
    if (resolvers.length === 0) {
      console.log('❌ No resolvers found! Creating a default admin user...');
      
      const { v4: uuidv4 } = require('uuid');
      const bcrypt = require('bcryptjs');
      
      const adminId = uuidv4();
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await connection.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [adminId, 'admin@example.com', passwordHash, 'Administrador', 'admin', true]
      );
      
      console.log('✅ Default admin user created!');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Resolvers found:');
      resolvers.forEach((resolver, index) => {
        console.log(`  ${index + 1}. ${resolver.full_name} (${resolver.email}) - ${resolver.role} - ${resolver.is_active ? 'Active' : 'Inactive'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking resolvers:', error);
  } finally {
    await connection.end();
  }
}

checkResolvers();
