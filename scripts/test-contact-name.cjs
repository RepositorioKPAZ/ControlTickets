// Script para verificar el campo contact_name
const mysql = require('mysql2/promise');

// Database configuration
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

async function testContactName() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verificando campo contact_name...\n');
    
    // Verificar estructura de la tabla clients
    console.log('📋 Estructura de la tabla clients:');
    const [columns] = await connection.execute(`
      DESCRIBE clients
    `);
    
    columns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
    // Verificar clientes existentes
    console.log('\n👥 Clientes existentes:');
    const [clients] = await connection.execute(`
      SELECT id, name, contact_name, email, phone, address 
      FROM clients 
      ORDER BY name
    `);
    
    clients.forEach(client => {
      console.log(`\n--- Cliente ---`);
      console.log(`ID: ${client.id}`);
      console.log(`Nombre: ${client.name}`);
      console.log(`Nombre de contacto: ${client.contact_name || 'N/A'}`);
      console.log(`Email: ${client.email || 'N/A'}`);
      console.log(`Teléfono: ${client.phone || 'N/A'}`);
      console.log(`Dirección: ${client.address || 'N/A'}`);
    });
    
    // Simular inserción de un cliente con contact_name
    console.log('\n🧪 Simulando inserción de cliente con contact_name:');
    const testClient = {
      name: 'Cliente de Prueba',
      contact_name: 'Juan Pérez',
      email: 'juan@test.com',
      phone: '123456789',
      address: 'Calle Test 123'
    };
    
    console.log('Datos de prueba:', testClient);
    
    // Verificar que la consulta INSERT funciona
    const insertQuery = `
      INSERT INTO clients (id, name, contact_name, email, phone, address) 
      VALUES (UUID(), ?, ?, ?, ?, ?)
    `;
    
    console.log('\n✅ Query de inserción preparada:', insertQuery);
    console.log('Parámetros:', [testClient.name, testClient.contact_name, testClient.email, testClient.phone, testClient.address]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testContactName();
