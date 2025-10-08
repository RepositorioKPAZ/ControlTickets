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

async function checkDashboardData() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔍 Checking data for dashboard...\n');
    
    // Check total tickets
    const [totalTickets] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
    console.log(`🎫 Total tickets: ${totalTickets.count}`);
    
    // Check open tickets
    const [openTickets] = await connection.execute("SELECT COUNT(*) as count FROM tickets WHERE status != 'closed'");
    console.log(`📂 Open tickets: ${openTickets.count}`);
    
    // Check closed tickets
    const [closedTickets] = await connection.execute("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'");
    console.log(`✅ Closed tickets: ${closedTickets.count}`);
    
    // Check average resolution time
    const [avgResolutionTime] = await connection.execute(`
      SELECT AVG(resolution_time_hours) as avg_time 
      FROM tickets 
      WHERE status = 'closed' AND resolution_time_hours IS NOT NULL
    `);
    console.log(`⏱️  Average resolution time: ${avgResolutionTime.avg_time || 'No data'}`);
    console.log(`⏱️  Average resolution time (parsed): ${avgResolutionTime.avg_time ? parseFloat(avgResolutionTime.avg_time) : 0}`);
    
    // Check tickets by status
    const statusStats = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `);
    console.log('\n📊 Tickets by status:');
    statusStats.forEach((row) => {
      console.log(`   ${row.status}: ${row.count} tickets`);
    });
    
    // Check tickets by priority
    const priorityStats = await connection.execute(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      GROUP BY priority
    `);
    console.log('\n📈 Tickets by priority:');
    priorityStats.forEach((row) => {
      console.log(`   ${row.priority}: ${row.count} tickets`);
    });
    
    // Check recent tickets
    const recentTickets = await connection.execute(`
      SELECT 
        t.*,
        c.name as client_name,
        u.full_name as assigned_resolver_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    console.log(`\n🕒 Recent tickets: ${recentTickets.length}`);
    if (recentTickets.length > 0) {
      console.log('   Sample recent tickets:');
      recentTickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ${ticket.ticket_number} - "${ticket.title}" - ${ticket.status} - ${ticket.priority}`);
        console.log(`      Client: ${ticket.client_name || 'No client'} - Resolver: ${ticket.assigned_resolver_name || 'No assigned'}`);
      });
    }
    
    // Test the complete dashboard stats query
    console.log('\n🧪 Testing complete dashboard stats query...');
    
    const [totalTicketsTest] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
    const [openTicketsTest] = await connection.execute("SELECT COUNT(*) as count FROM tickets WHERE status != 'closed'");
    const [closedTicketsTest] = await connection.execute("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'");
    const [avgResolutionTimeTest] = await connection.execute(`
      SELECT AVG(resolution_time_hours) as avg_time 
      FROM tickets 
      WHERE status = 'closed' AND resolution_time_hours IS NOT NULL
    `);
    const statusStatsTest = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `);
    const priorityStatsTest = await connection.execute(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      GROUP BY priority
    `);
    const recentTicketsTest = await connection.execute(`
      SELECT 
        t.*,
        c.name as client_name,
        u.full_name as assigned_resolver_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    
    const dashboardStats = {
      totalTickets: totalTicketsTest.count,
      openTickets: openTicketsTest.count,
      closedTickets: closedTicketsTest.count,
      avgResolutionTime: avgResolutionTimeTest.avg_time ? parseFloat(avgResolutionTimeTest.avg_time) : 0,
      statusStats: statusStatsTest,
      priorityStats: priorityStatsTest,
      recentTickets: recentTicketsTest
    };
    
    console.log('📊 Dashboard stats object:');
    console.log(JSON.stringify(dashboardStats, null, 2));
    
    // Test the toFixed method
    console.log('\n🧪 Testing toFixed method:');
    console.log(`avgResolutionTime type: ${typeof dashboardStats.avgResolutionTime}`);
    console.log(`avgResolutionTime value: ${dashboardStats.avgResolutionTime}`);
    console.log(`avgResolutionTime isNaN: ${isNaN(dashboardStats.avgResolutionTime)}`);
    
    if (typeof dashboardStats.avgResolutionTime === 'number' && !isNaN(dashboardStats.avgResolutionTime)) {
      console.log(`avgResolutionTime.toFixed(1): ${dashboardStats.avgResolutionTime.toFixed(1)}`);
    } else {
      console.log('avgResolutionTime is not a valid number, using fallback: 0.0');
    }
    
  } catch (error) {
    console.error('❌ Error checking dashboard data:', error);
  } finally {
    await connection.end();
  }
}

checkDashboardData();
