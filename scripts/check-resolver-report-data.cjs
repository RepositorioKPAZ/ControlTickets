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

async function checkResolverReportData() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('🔍 Checking data for resolver reports...\n');
    
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
    
    // Check tickets with assigned resolvers
    const [assignedTickets] = await connection.execute(`
      SELECT 
        t.id, 
        t.assigned_to, 
        t.assigned_at, 
        t.status,
        u.full_name as resolver_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to IS NOT NULL
      ORDER BY t.assigned_at DESC
    `);
    console.log(`\n🎫 Tickets with assigned resolvers: ${assignedTickets.length}`);
    if (assignedTickets.length > 0) {
      console.log('   Sample assigned tickets:');
      assignedTickets.slice(0, 5).forEach((ticket, index) => {
        console.log(`   ${index + 1}. Ticket ${ticket.id} - Assigned to: ${ticket.resolver_name || 'Unknown'} - Status: ${ticket.status} - Assigned: ${ticket.assigned_at}`);
      });
      
      // Check tickets by resolver
      const [ticketsByResolver] = await connection.execute(`
        SELECT 
          u.full_name as resolver_name,
          COUNT(t.id) as ticket_count
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_to
        WHERE u.role IN ("admin", "agent") AND u.is_active = TRUE
        GROUP BY u.id, u.full_name
        ORDER BY ticket_count DESC
      `);
      
      console.log('\n📈 Tickets by resolver:');
      ticketsByResolver.forEach((row) => {
        console.log(`   ${row.resolver_name}: ${row.ticket_count} tickets`);
      });
      
      // Check tickets by status
      const [ticketsByStatus] = await connection.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM tickets
        WHERE assigned_to IS NOT NULL
        GROUP BY status
        ORDER BY count DESC
      `);
      
      console.log('\n📊 Tickets by status:');
      ticketsByStatus.forEach((row) => {
        console.log(`   ${row.status}: ${row.count} tickets`);
      });
      
      // Check tickets by year
      const [ticketsByYear] = await connection.execute(`
        SELECT 
          YEAR(assigned_at) as year,
          COUNT(*) as count
        FROM tickets
        WHERE assigned_to IS NOT NULL AND assigned_at IS NOT NULL
        GROUP BY YEAR(assigned_at)
        ORDER BY year DESC
      `);
      
      console.log('\n📅 Tickets by year (assigned):');
      ticketsByYear.forEach((row) => {
        console.log(`   ${row.year}: ${row.count} tickets`);
      });
      
    } else {
      console.log('   ⚠️  No tickets with assigned resolvers found!');
    }
    
    // Test the report query for a specific resolver and year
    if (resolvers.length > 0 && assignedTickets.length > 0) {
      const testResolverId = resolvers[0].id;
      const currentYear = new Date().getFullYear();
      
      console.log(`\n🧪 Testing report query for resolver: ${resolvers[0].full_name} (${testResolverId}) in year: ${currentYear}`);
      
      const [testReport] = await connection.execute(`
        SELECT 
          assigned_at,
          status
        FROM tickets 
        WHERE assigned_to = ? 
        AND assigned_at IS NOT NULL
        AND assigned_at >= ? 
        AND assigned_at <= ?
        ORDER BY assigned_at
      `, [testResolverId, `${currentYear}-01-01 00:00:00`, `${currentYear}-12-31 23:59:59`]);
      
      console.log(`   Found ${testReport.length} tickets for the test query`);
      
      if (testReport.length > 0) {
        console.log('   Sample data:');
        testReport.slice(0, 3).forEach((ticket, index) => {
          console.log(`   ${index + 1}. Assigned: ${ticket.assigned_at} - Status: ${ticket.status}`);
        });
        
        // Test the monthly grouping
        const monthlyData = Array.from({ length: 12 }, (_, index) => ({
          month: new Date(currentYear, index, 1).toLocaleString('es-ES', { month: 'short' }),
          monthNumber: index + 1,
          open: 0,
          assigned: 0,
          in_progress: 0,
          closed: 0,
        }));
        
        testReport.forEach((ticket) => {
          const assignedMonth = new Date(ticket.assigned_at).getMonth();
          const status = ticket.status;
          
          if (monthlyData[assignedMonth] && status in monthlyData[assignedMonth]) {
            monthlyData[assignedMonth][status] += 1;
          }
        });
        
        console.log('   Processed monthly data:');
        monthlyData.forEach((month) => {
          if (month.open > 0 || month.assigned > 0 || month.in_progress > 0 || month.closed > 0) {
            console.log(`     ${month.month}: Open=${month.open}, Assigned=${month.assigned}, In Progress=${month.in_progress}, Closed=${month.closed}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking resolver report data:', error);
  } finally {
    await connection.end();
  }
}

checkResolverReportData();
