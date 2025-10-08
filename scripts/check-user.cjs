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

async function checkUser() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el usuario existe
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['rdelafuente@kpaz.la']
    );
    
    if (users.length > 0) {
      console.log('✅ Usuario encontrado:');
      console.log('ID:', users[0].id);
      console.log('Email:', users[0].email);
      console.log('Nombre:', users[0].full_name);
      console.log('Rol:', users[0].role);
      console.log('Activo:', users[0].is_active);
      console.log('Creado:', users[0].created_at);
      console.log('Actualizado:', users[0].updated_at);
    } else {
      console.log('❌ Usuario rdelafuente@kpaz.la no encontrado');
    }
    
    // Mostrar todos los usuarios
    console.log('\n📋 Todos los usuarios en la base de datos:');
    const [allUsers] = await connection.execute(
      'SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at'
    );
    
    if (allUsers.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.full_name}) - ${user.role} - ${user.is_active ? 'Activo' : 'Inactivo'} - ${user.created_at}`);
      });
    }
    
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
checkUser().then(() => {
  console.log('\n🎉 Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
