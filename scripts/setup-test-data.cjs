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

async function setupTestData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Setting up test data...\n');
    
    // 1. Check/Create test user
    console.log('1️⃣ Checking test user...');
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE email = 'test@example.com'"
    );
    
    let testUserId;
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
      console.log('✅ Test user already exists:');
      console.log(`   ID: ${testUserId}`);
      console.log(`   Name: ${existingUsers[0].full_name}`);
      console.log(`   Email: ${existingUsers[0].email}`);
      console.log(`   Role: ${existingUsers[0].role}\n`);
    } else {
      console.log('📝 Creating test user...');
      testUserId = uuidv4();
      const passwordHash = await bcrypt.hash('test123', 10);
      
      await connection.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [testUserId, 'test@example.com', passwordHash, 'Usuario de Prueba', 'admin', true]
      );
      
      console.log('✅ Test user created:');
      console.log(`   ID: ${testUserId}`);
      console.log(`   Name: Usuario de Prueba`);
      console.log(`   Email: test@example.com`);
      console.log(`   Password: test123`);
      console.log(`   Role: admin\n`);
    }
    
    // 2. Check/Create test client
    console.log('2️⃣ Checking test client...');
    const [existingClients] = await connection.execute(
      "SELECT * FROM clients WHERE email = 'cliente@test.com'"
    );
    
    let testClientId;
    if (existingClients.length > 0) {
      testClientId = existingClients[0].id;
      console.log('✅ Test client already exists:');
      console.log(`   ID: ${testClientId}`);
      console.log(`   Name: ${existingClients[0].name}`);
      console.log(`   Email: ${existingClients[0].email}\n`);
    } else {
      console.log('📝 Creating test client...');
      testClientId = uuidv4();
      
      await connection.execute(
        'INSERT INTO clients (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [testClientId, 'Cliente de Prueba', 'cliente@test.com', '+1234567890', 'Dirección de Prueba']
      );
      
      console.log('✅ Test client created:');
      console.log(`   ID: ${testClientId}`);
      console.log(`   Name: Cliente de Prueba`);
      console.log(`   Email: cliente@test.com\n`);
    }
    
    // 3. Check/Create test resolver
    console.log('3️⃣ Checking test resolver...');
    const [existingResolvers] = await connection.execute(
      "SELECT * FROM users WHERE email = 'resolver@test.com'"
    );
    
    let testResolverId;
    if (existingResolvers.length > 0) {
      testResolverId = existingResolvers[0].id;
      console.log('✅ Test resolver already exists:');
      console.log(`   ID: ${testResolverId}`);
      console.log(`   Name: ${existingResolvers[0].full_name}`);
      console.log(`   Email: ${existingResolvers[0].email}`);
      console.log(`   Role: ${existingResolvers[0].role}\n`);
    } else {
      console.log('📝 Creating test resolver...');
      testResolverId = uuidv4();
      const passwordHash = await bcrypt.hash('resolver123', 10);
      
      await connection.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [testResolverId, 'resolver@test.com', passwordHash, 'Resolutor de Prueba', 'agent', true]
      );
      
      console.log('✅ Test resolver created:');
      console.log(`   ID: ${testResolverId}`);
      console.log(`   Name: Resolutor de Prueba`);
      console.log(`   Email: resolver@test.com`);
      console.log(`   Password: resolver123`);
      console.log(`   Role: agent\n`);
    }
    
    // 4. Summary
    console.log('📊 Summary:');
    console.log(`   Test User ID: ${testUserId}`);
    console.log(`   Test Client ID: ${testClientId}`);
    console.log(`   Test Resolver ID: ${testResolverId}`);
    console.log('\n🎯 You can now use these IDs in the ticket form!');
    console.log('\n📝 To update the ticket form, replace the user ID in:');
    console.log('   src/components/tickets/ticket-form.tsx');
    console.log(`   with: ${testUserId}`);
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await connection.end();
  }
}

setupTestData();
