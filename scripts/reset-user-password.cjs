const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

async function resetUserPassword() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    const email = 'rdelafuente@kpaz.la';
    const newPassword = 'password123';
    
    console.log(`🔄 Reseteando contraseña para: ${email}`);
    console.log(`🔑 Nueva contraseña: ${newPassword}`);
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('🔐 Contraseña hasheada correctamente');
    
    // Update the user's password
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      
      // Verify the user exists and is active
      const [users] = await connection.execute(
        'SELECT id, email, full_name, role, is_active FROM users WHERE email = ?',
        [email]
      );
      
      if (users.length > 0) {
        const user = users[0];
        console.log('📋 Información del usuario:');
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Nombre:', user.full_name);
        console.log('Rol:', user.role);
        console.log('Activo:', user.is_active ? 'Sí' : 'No');
      }
    } else {
      console.log('❌ No se pudo actualizar la contraseña - usuario no encontrado');
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
resetUserPassword().then(() => {
  console.log('\n🎉 Reset de contraseña completado');
  console.log('🔑 Ahora puedes usar:');
  console.log('   Email: rdelafuente@kpaz.la');
  console.log('   Contraseña: password123');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
