#!/usr/bin/env node

/**
 * Script para migrar datos de Supabase a MySQL
 * 
 * Uso:
 * 1. Configura las variables de entorno en .env
 * 2. Ejecuta: node scripts/migrate-to-mysql.js
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
dotenv.config();

// Configuración de Supabase (mantén tus credenciales actuales)
const supabaseUrl = process.env.SUPABASE_URL || 'https://tktfddpofoxhailxugyl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdGZkZHBvZm94aGFpbHh1Z3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDc4NDUsImV4cCI6MjA3MDY4Mzg0NX0.3N83XaZgz_SJvXHThQIi5jfuluY3JQGMBHIBZjR6S40';

// Configuración de MySQL
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ticket_system',
  charset: 'utf8mb4',
};

// Crear clientes
const supabase = createClient(supabaseUrl, supabaseKey);
const mysqlConnection = mysql.createConnection(mysqlConfig);

async function migrateData() {
  console.log('🚀 Iniciando migración de Supabase a MySQL...');
  
  try {
    // Conectar a MySQL
    await mysqlConnection.connect();
    console.log('✅ Conectado a MySQL');

    // Migrar países
    console.log('📦 Migrando países...');
    const { data: countries } = await supabase.from('countries').select('*');
    for (const country of countries || []) {
      await mysqlConnection.execute(
        'INSERT INTO countries (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [country.id, country.name, country.code, country.is_active, country.created_at, country.updated_at]
      );
    }
    console.log(`✅ Migrados ${countries?.length || 0} países`);

    // Migrar tipos de solicitud
    console.log('📦 Migrando tipos de solicitud...');
    const { data: requestTypes } = await supabase.from('request_types').select('*');
    for (const requestType of requestTypes || []) {
      await mysqlConnection.execute(
        'INSERT INTO request_types (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [requestType.id, requestType.name, requestType.description, requestType.is_active, requestType.created_at, requestType.updated_at]
      );
    }
    console.log(`✅ Migrados ${requestTypes?.length || 0} tipos de solicitud`);

    // Migrar clientes
    console.log('📦 Migrando clientes...');
    const { data: clients } = await supabase.from('clients').select('*');
    for (const client of clients || []) {
      await mysqlConnection.execute(
        'INSERT INTO clients (id, name, email, phone, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [client.id, client.name, client.email, client.phone, client.address, client.created_at, client.updated_at]
      );
    }
    console.log(`✅ Migrados ${clients?.length || 0} clientes`);

    // Migrar usuarios (profiles)
    console.log('📦 Migrando usuarios...');
    const { data: profiles } = await supabase.from('profiles').select('*');
    for (const profile of profiles || []) {
      // Crear usuario con contraseña por defecto (deberás cambiarla después)
      const defaultPassword = 'changeme123'; // Cambiar esto en producción
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(defaultPassword, 12);
      
      await mysqlConnection.execute(
        'INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [profile.user_id, profile.email, passwordHash, profile.full_name, profile.role || 'agent', true, profile.created_at, profile.updated_at]
      );
    }
    console.log(`✅ Migrados ${profiles?.length || 0} usuarios`);

    // Migrar tickets
    console.log('📦 Migrando tickets...');
    const { data: tickets } = await supabase.from('tickets').select('*');
    for (const ticket of tickets || []) {
      await mysqlConnection.execute(
        `INSERT INTO tickets (
          id, ticket_number, title, description, status, priority, request_type,
          client_id, assigned_to, created_by, assigned_at, closed_at,
          resolution_time_hours, resolution_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ticket.id, ticket.ticket_number, ticket.title, ticket.description,
          ticket.status, ticket.priority, ticket.request_type, ticket.client_id,
          ticket.assigned_to, ticket.created_by, ticket.assigned_at, ticket.closed_at,
          ticket.resolution_time_hours, ticket.resolution_notes, ticket.created_at, ticket.updated_at
        ]
      );
    }
    console.log(`✅ Migrados ${tickets?.length || 0} tickets`);

    // Migrar historial de tickets
    console.log('📦 Migrando historial de tickets...');
    const { data: ticketHistory } = await supabase.from('ticket_history').select('*');
    for (const history of ticketHistory || []) {
      await mysqlConnection.execute(
        'INSERT INTO ticket_history (id, ticket_id, changed_by, field_name, old_value, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [history.id, history.ticket_id, history.changed_by, history.field_name, history.old_value, history.new_value, history.created_at]
      );
    }
    console.log(`✅ Migrados ${ticketHistory?.length || 0} registros de historial`);

    // Migrar días festivos
    console.log('📦 Migrando días festivos...');
    const { data: holidays } = await supabase.from('holidays').select('*');
    for (const holiday of holidays || []) {
      await mysqlConnection.execute(
        'INSERT INTO holidays (id, date, name, year, country_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [holiday.id, holiday.date, holiday.name, holiday.year, holiday.country_id, holiday.created_at]
      );
    }
    console.log(`✅ Migrados ${holidays?.length || 0} días festivos`);

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('1. Cambia las contraseñas de los usuarios migrados');
    console.log('2. Verifica que todos los datos se hayan migrado correctamente');
    console.log('3. Actualiza las variables de entorno para usar MySQL');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mysqlConnection.end();
  }
}

// Ejecutar migración
migrateData();
