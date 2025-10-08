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

async function checkTicketsData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Verificando datos de tickets...\n');
    
    // Verificar tickets con JOINs
    const [tickets] = await connection.execute(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.assigned_to,
        t.created_by,
        c.name as client_name,
        u.full_name as assigned_resolver_name,
        creator.full_name as created_user_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Tickets encontrados:', tickets.length);
    console.log('\n🔍 Detalles de los tickets:');
    
    tickets.forEach((ticket, index) => {
      console.log(`\n--- Ticket ${index + 1} ---`);
      console.log(`ID: ${ticket.id}`);
      console.log(`Número: ${ticket.ticket_number}`);
      console.log(`Título: ${ticket.title}`);
      console.log(`Cliente: ${ticket.client_name || 'N/A'}`);
      console.log(`assigned_to (ID): ${ticket.assigned_to || 'NULL'}`);
      console.log(`assigned_resolver_name: ${ticket.assigned_resolver_name || 'NULL'}`);
      console.log(`created_by (ID): ${ticket.created_by || 'NULL'}`);
      console.log(`created_user_name: ${ticket.created_user_name || 'NULL'}`);
    });
    
    // Verificar usuarios disponibles
    console.log('\n👥 Usuarios disponibles:');
    const [users] = await connection.execute('SELECT id, full_name, email, role FROM users WHERE is_active = TRUE');
    
    users.forEach(user => {
      console.log(`- ${user.full_name} (${user.email}) - Rol: ${user.role} - ID: ${user.id}`);
    });
    
    // Verificar si hay tickets sin created_by
    const [ticketsWithoutCreator] = await connection.execute(`
      SELECT COUNT(*) as count FROM tickets WHERE created_by IS NULL
    `);
    
    console.log(`\n⚠️  Tickets sin created_by: ${ticketsWithoutCreator[0].count}`);
    
    // Verificar si hay tickets sin assigned_to
    const [ticketsWithoutAssignee] = await connection.execute(`
      SELECT COUNT(*) as count FROM tickets WHERE assigned_to IS NULL
    `);
    
    console.log(`⚠️  Tickets sin assigned_to: ${ticketsWithoutAssignee[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkTicketsData();
