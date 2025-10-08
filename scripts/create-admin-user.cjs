#!/usr/bin/env node

/**
 * Script para crear un usuario administrador inicial
 * 
 * Uso:
 * node scripts/create-admin-user.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

async function createAdminUser() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    const adminEmail = 'admin@kpaz.la';
    const adminPassword = 'admin123';
    const adminName = 'Administrador del Sistema';
    
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [adminEmail]
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️  El usuario administrador ya existe:');
      console.log('Email:', existingUsers[0].email);
      console.log('Rol:', existingUsers[0].role);
      
      // Actualizar el rol a admin si no lo es
      if (existingUsers[0].role !== 'admin') {
        console.log('🔄 Actualizando rol a administrador...');
        await connection.execute(
          'UPDATE users SET role = ? WHERE email = ?',
          ['admin', adminEmail]
        );
        console.log('✅ Rol actualizado a administrador');
      }
      
      // Actualizar la contraseña
      console.log('🔄 Actualizando contraseña...');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, adminEmail]
      );
      console.log('✅ Contraseña actualizada');
      
    } else {
      console.log('🆕 Creando nuevo usuario administrador...');
      
      // Crear nuevo usuario administrador
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await connection.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, adminEmail, passwordHash, adminName, 'admin', true]
      );
      
      console.log('✅ Usuario administrador creado exitosamente');
    }
    
    // Mostrar información del usuario administrador
    const [adminUser] = await connection.execute(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE email = ?',
      [adminEmail]
    );
    
    if (adminUser.length > 0) {
      const user = adminUser[0];
      console.log('\n📋 Información del Administrador:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Nombre:', user.full_name);
      console.log('Rol:', user.role);
      console.log('Activo:', user.is_active ? 'Sí' : 'No');
      console.log('Creado:', user.created_at);
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
createAdminUser().then(() => {
  console.log('\n🎉 Usuario administrador configurado');
  console.log('🔑 Credenciales de acceso:');
  console.log('   Email: admin@kpaz.la');
  console.log('   Contraseña: admin123');
  console.log('   Rol: admin (acceso completo a configuración)');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
