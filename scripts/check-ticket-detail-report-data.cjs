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

async function checkTicketDetailReportData() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔍 Checking data for ticket detail report...\n');
    
    // Check resolvers
    const [resolvers] = await connection.execute('SELECT id, full_name, email, role FROM users WHERE role IN ("admin", "agent") AND is_active = TRUE');
    console.log(`👥 Resolvers found: ${resolvers.length}`);
    if (resolvers.length > 0) {
      console.log('   Available resolvers:');
      resolvers.forEach((resolver, index) => {
        console.log(`   ${index + 1}. ${resolver.full_name} (${resolver.email}) - ${resolver.role} (ID: ${resolver.id})`);
      });
    } else {
      console.log('   ⚠️  No resolvers found!');
    }
    
    // Check clients
    const [clients] = await connection.execute('SELECT id, name FROM clients');
    console.log(`\n📊 Clients found: ${clients.length}`);
    if (clients.length > 0) {
      console.log('   Available clients:');
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
      });
    } else {
      console.log('   ⚠️  No clients found!');
    }
    
    // Check tickets
    const [tickets] = await connection.execute(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.status,
        t.priority,
        t.created_at,
        t.closed_at,
        t.resolution_time_hours,
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
    console.log(`\n🎫 Sample tickets found: ${tickets.length}`);
    if (tickets.length > 0) {
      console.log('   Sample tickets:');
      tickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ${ticket.ticket_number} - "${ticket.title}" - Status: ${ticket.status} - Priority: ${ticket.priority}`);
        console.log(`      Client: ${ticket.client_name || 'No client'} - Resolver: ${ticket.assigned_resolver_name || 'No assigned'} - Created by: ${ticket.created_user_name}`);
        console.log(`      Created: ${ticket.created_at} - Closed: ${ticket.closed_at || 'Not closed'}`);
        console.log(`      Resolution time: ${ticket.resolution_time_hours || 'Not set'} hours`);
        console.log('');
      });
      
      // Check tickets by status
      const [ticketsByStatus] = await connection.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM tickets
        GROUP BY status
        ORDER BY count DESC
      `);
      
      console.log('📊 Tickets by status:');
      ticketsByStatus.forEach((row) => {
        console.log(`   ${row.status}: ${row.count} tickets`);
      });
      
      // Check tickets by priority
      const [ticketsByPriority] = await connection.execute(`
        SELECT 
          priority,
          COUNT(*) as count
        FROM tickets
        GROUP BY priority
        ORDER BY count DESC
      `);
      
      console.log('\n📈 Tickets by priority:');
      ticketsByPriority.forEach((row) => {
        console.log(`   ${row.priority}: ${row.count} tickets`);
      });
      
      // Check tickets by year
      const [ticketsByYear] = await connection.execute(`
        SELECT 
          YEAR(created_at) as year,
          COUNT(*) as count
        FROM tickets
        GROUP BY YEAR(created_at)
        ORDER BY year DESC
      `);
      
      console.log('\n📅 Tickets by year:');
      ticketsByYear.forEach((row) => {
        console.log(`   ${row.year}: ${row.count} tickets`);
      });
      
      // Test the report query with sample filters
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01 00:00:00`;
      const endDate = `${currentYear}-12-31 23:59:59`;
      
      console.log(`\n🧪 Testing report query for year ${currentYear} (${startDate} to ${endDate})`);
      
      const [testReport] = await connection.execute(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.status,
          t.priority,
          t.created_at,
          t.closed_at,
          t.resolution_time_hours,
          c.name as client_name,
          u.full_name as assigned_resolver_name,
          creator.full_name as created_user_name
        FROM tickets t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.created_at >= ? AND t.created_at <= ?
        ORDER BY t.created_at DESC
      `, [startDate, endDate]);
      
      console.log(`   Found ${testReport.length} tickets for the test query`);
      
      if (testReport.length > 0) {
        console.log('   Sample data:');
        testReport.slice(0, 3).forEach((ticket, index) => {
          console.log(`   ${index + 1}. ${ticket.ticket_number} - "${ticket.title}" - ${ticket.status} - ${ticket.priority}`);
          console.log(`      Client: ${ticket.client_name} - Resolver: ${ticket.assigned_resolver_name} - Created by: ${ticket.created_user_name}`);
        });
      }
      
    } else {
      console.log('   ⚠️  No tickets found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking ticket detail report data:', error);
  } finally {
    await connection.end();
  }
}

checkTicketDetailReportData();
