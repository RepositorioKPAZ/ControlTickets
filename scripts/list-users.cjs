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

async function listUsers() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener todos los usuarios
    const [users] = await connection.execute(
      'SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at'
    );
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }
    
    console.log(`📋 Lista de usuarios (${users.length} total):`);
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      const status = user.is_active ? '✅ Activo' : '❌ Inactivo';
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      
      console.log(`${index + 1}. ${roleIcon} ${user.email}`);
      console.log(`   Nombre: ${user.full_name || 'N/A'}`);
      console.log(`   Rol: ${user.role.toUpperCase()}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log('');
    });
    
    // Mostrar resumen por roles
    const adminUsers = users.filter(u => u.role === 'admin' && u.is_active);
    const agentUsers = users.filter(u => u.role === 'agent' && u.is_active);
    const userUsers = users.filter(u => u.role === 'user' && u.is_active);
    
    console.log('📊 Resumen por roles:');
    console.log(`👑 Administradores: ${adminUsers.length}`);
    console.log(`👤 Agentes: ${agentUsers.length}`);
    console.log(`👥 Usuarios: ${userUsers.length}`);
    console.log(`❌ Inactivos: ${users.filter(u => !u.is_active).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar el script
listUsers().then(() => {
  console.log('\n🎉 Listado completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
