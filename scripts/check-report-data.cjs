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

async function checkReportData() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔍 Checking data for reports...\n');
    
    // Check clients
    const [clients] = await connection.execute('SELECT id, name FROM clients');
    console.log(`📊 Clients found: ${clients.length}`);
    if (clients.length > 0) {
      console.log('   Available clients:');
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
      });
    } else {
      console.log('   ⚠️  No clients found!');
    }
    
    // Check tickets
    const [tickets] = await connection.execute('SELECT id, client_id, created_at, closed_at, status FROM tickets');
    console.log(`\n🎫 Tickets found: ${tickets.length}`);
    if (tickets.length > 0) {
      console.log('   Sample tickets:');
      tickets.slice(0, 5).forEach((ticket, index) => {
        console.log(`   ${index + 1}. Ticket ${ticket.id} - Client: ${ticket.client_id} - Created: ${ticket.created_at} - Status: ${ticket.status}`);
      });
      
      // Check tickets by client
      const [ticketsByClient] = await connection.execute(`
        SELECT 
          c.name as client_name,
          COUNT(t.id) as ticket_count
        FROM clients c
        LEFT JOIN tickets t ON c.id = t.client_id
        GROUP BY c.id, c.name
        ORDER BY ticket_count DESC
      `);
      
      console.log('\n📈 Tickets by client:');
      ticketsByClient.forEach((row) => {
        console.log(`   ${row.client_name}: ${row.ticket_count} tickets`);
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
      
    } else {
      console.log('   ⚠️  No tickets found!');
    }
    
    // Test the report query for a specific client and year
    if (clients.length > 0 && tickets.length > 0) {
      const testClientId = clients[0].id;
      const currentYear = new Date().getFullYear();
      
      console.log(`\n🧪 Testing report query for client: ${clients[0].name} (${testClientId}) in year: ${currentYear}`);
      
      const [testReport] = await connection.execute(`
        SELECT 
          created_at,
          closed_at,
          status
        FROM tickets 
        WHERE client_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
        ORDER BY created_at
      `, [testClientId, `${currentYear}-01-01 00:00:00`, `${currentYear}-12-31 23:59:59`]);
      
      console.log(`   Found ${testReport.length} tickets for the test query`);
      
      if (testReport.length > 0) {
        console.log('   Sample data:');
        testReport.slice(0, 3).forEach((ticket, index) => {
          console.log(`   ${index + 1}. Created: ${ticket.created_at} - Closed: ${ticket.closed_at || 'Not closed'} - Status: ${ticket.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking report data:', error);
  } finally {
    await connection.end();
  }
}

checkReportData();
