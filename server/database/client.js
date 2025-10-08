const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'kpazserv0001.mysql.database.azure.com',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'controldev',
  password: process.env.MYSQL_PASSWORD || '.Chinito2025',
  database: process.env.MYSQL_DATABASE || 'controltkt',
  charset: 'utf8mb4',
  timezone: '-04:00',
  acquireTimeout: 60000,
  timeout: 60000,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.MYSQL_SSL_CA
  }
};

// Debug: Log database configuration (without password)
console.log('🔧 Database Configuration:');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Password:', dbConfig.password ? '[HIDDEN]' : '[NOT SET]');

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database client class
class MySQLClient {
  constructor() {
    this.pool = pool;
  }

  // Get connection from pool
  async getConnection() {
    return await this.pool.getConnection();
  }

  // Execute query with parameters
  async query(sql, params = []) {
    const connection = await this.getConnection();
    try {
      console.log('Executing SQL query:', sql);
      console.log('With params:', params);
      const [rows] = await connection.execute(sql, params);
      console.log('Query result rows:', rows.length);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Execute transaction
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Close pool
  async close() {
    await this.pool.end();
  }
}

// Export singleton instance
const mysqlClient = new MySQLClient();

// Helper functions for common operations
const db = {
  // Users
  async getUserByEmail(email) {
    console.log('🔍 Buscando usuario con email:', email);
    const rows = await mysqlClient.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    console.log('📋 Usuarios encontrados:', rows.length);
    if (rows.length > 0) {
      console.log('✅ Usuario encontrado:', {
        id: rows[0].id,
        email: rows[0].email,
        full_name: rows[0].full_name,
        role: rows[0].role,
        is_active: rows[0].is_active
      });
    } else {
      console.log('❌ Usuario no encontrado o inactivo');
    }
    return rows.length > 0 ? rows[0] : null;
  },

  async getUserById(id) {
    const rows = await mysqlClient.query(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async createUser(userData) {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    
    const userId = userData.id || uuidv4();
    const passwordHash = await bcrypt.hash(userData.password || 'password123', 10);
    
    return await mysqlClient.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        userData.email,
        passwordHash,
        userData.full_name,
        userData.role || 'agent',
        userData.is_active !== undefined ? userData.is_active : true
      ]
    );
  },

  // Tickets
  async getTickets() {
    return await mysqlClient.query(`
      SELECT 
        t.*,
        c.name as client_name,
        c.email as client_email,
        u.full_name as assigned_resolver_name,
        creator.full_name as created_user_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ORDER BY t.created_at DESC
    `);
  },

  async getTicketById(id) {
    const rows = await mysqlClient.query(`
      SELECT 
        t.*,
        c.name as client_name,
        c.email as client_email,
        u.full_name as assigned_resolver_name,
        creator.full_name as created_user_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async createTicket(ticketData) {
    try {
      console.log('Creating ticket with data:', ticketData);
      
      const { v4: uuidv4 } = require('uuid');
      const ticketId = ticketData.id || uuidv4();
      
      // Generate ticket number (format: TKT-YYYYMMDD-XXXX)
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const ticketNumber = `TKT-${dateStr}-${randomNum}`;
      
      console.log('Generated ticket ID:', ticketId);
      console.log('Generated ticket number:', ticketNumber);
      
      // Set assigned_at automatically if ticket is being assigned
      let assignedAt = null;
      if (ticketData.assigned_to) {
        // Use MySQL's NOW() function to get current timestamp in the configured timezone
        assignedAt = 'NOW()';
      }
      
      console.log('Assigned_at will be set to:', assignedAt);
      
      // Build the query dynamically based on whether assigned_at should be set
      let query, params;
      if (assignedAt === 'NOW()') {
        query = 'INSERT INTO tickets (id, ticket_number, title, description, client_id, usu_solicitante, priority, request_type, assigned_to, created_by, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        params = [
          ticketId,
          ticketNumber,
          ticketData.title,
          ticketData.description,
          ticketData.client_id,
          ticketData.usu_solicitante || null,
          ticketData.priority,
          ticketData.request_type,
          ticketData.assigned_to,
          ticketData.created_by
        ];
      } else {
        query = 'INSERT INTO tickets (id, ticket_number, title, description, client_id, usu_solicitante, priority, request_type, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        params = [
          ticketId,
          ticketNumber,
          ticketData.title,
          ticketData.description,
          ticketData.client_id,
          ticketData.usu_solicitante || null,
          ticketData.priority,
          ticketData.request_type,
          ticketData.assigned_to,
          ticketData.created_by
        ];
      }
      
      const result = await mysqlClient.query(query, params);
      
      console.log('Ticket created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  async updateTicket(id, updateData) {
    try {
      console.log('Updating ticket with data:', updateData);
      
      // Format dates for MySQL
      const formattedData = { ...updateData };
      
      // Handle assigned_at specially - if it's being set for the first time, use NOW()
      if (formattedData.assigned_at === 'NOW()' || formattedData.assigned_at === true) {
        // This will be handled in the query building
      } else if (formattedData.assigned_at) {
        const assignedDate = new Date(formattedData.assigned_at);
        formattedData.assigned_at = assignedDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (formattedData.closed_at) {
        const closedDate = new Date(formattedData.closed_at);
        formattedData.closed_at = closedDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      if (formattedData.updated_at) {
        const updatedDate = new Date(formattedData.updated_at);
        formattedData.updated_at = updatedDate.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      console.log('Formatted update data:', formattedData);
      
      // Handle assigned_at specially
      let queryFields = [];
      let queryValues = [];
      
      for (const [key, value] of Object.entries(formattedData)) {
        if (key === 'assigned_at' && (value === 'NOW()' || value === true)) {
          queryFields.push(`${key} = NOW()`);
        } else {
          queryFields.push(`${key} = ?`);
          queryValues.push(value);
        }
      }
      
      queryValues.push(id);
      
      const result = await mysqlClient.query(
        `UPDATE tickets SET ${queryFields.join(', ')} WHERE id = ?`,
        queryValues
      );
      
      console.log('Ticket updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  // Clients
  async getClients() {
    return await mysqlClient.query('SELECT * FROM clients ORDER BY name');
  },

  async createClient(clientData) {
    const { v4: uuidv4 } = require('uuid');
    const clientId = clientData.id || uuidv4();
    
    return await mysqlClient.query(
      'INSERT INTO clients (id, name, contact_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        clientId,
        clientData.name,
        clientData.contact_name,
        clientData.contact_email || clientData.email,
        clientData.contact_phone || clientData.phone,
        clientData.address
      ]
    );
  },

  async updateClient(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE clients SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Request Types
  async getRequestTypes() {
    return await mysqlClient.query('SELECT * FROM request_types WHERE is_active = TRUE ORDER BY name');
  },

  async updateRequestType(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE request_types SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Countries
  async getCountries() {
    return await mysqlClient.query('SELECT * FROM countries ORDER BY name');
  },

  async updateCountry(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE countries SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Users (for assignment)
  async getUsers() {
    return await mysqlClient.query('SELECT id, full_name, email, role, is_active, created_at, updated_at FROM users ORDER BY full_name');
  },

  async createUser(userData) {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    
    const userId = userData.id || uuidv4();
    const passwordHash = await bcrypt.hash(userData.password || 'password123', 10);
    
    return await mysqlClient.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        userData.email,
        passwordHash,
        userData.full_name,
        userData.role || 'agent',
        userData.is_active !== undefined ? userData.is_active : true
      ]
    );
  },

  async updateUser(id, updateData) {
    // Si hay password, lo hasheamos y cambiamos el nombre del campo
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.password) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(dataToUpdate.password, 10);
      dataToUpdate.password_hash = passwordHash;
      delete dataToUpdate.password;
    }
    
    const fields = Object.keys(dataToUpdate).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dataToUpdate);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE users SET ${fields} WHERE id = ?`,
      values
    );
  },

  async updateUserPassword(userId, password) {
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    return await mysqlClient.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  },

  // Resolvers
  async getResolvers() {
    try {
      console.log('Fetching resolvers from database...');
      const resolvers = await mysqlClient.query('SELECT * FROM users WHERE role = "agent" AND is_active = TRUE ORDER BY full_name');
      console.log('Resolvers found:', resolvers.length);
      console.log('Sample resolvers:', resolvers.slice(0, 3).map(r => ({ id: r.id, full_name: r.full_name, role: r.role })));
      return resolvers;
    } catch (error) {
      console.error('Error fetching resolvers:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  async createResolver(resolverData) {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    
    const resolverId = resolverData.id || uuidv4();
    const passwordHash = await bcrypt.hash(resolverData.password || 'password123', 10);
    
    return await mysqlClient.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        resolverId,
        resolverData.email,
        passwordHash,
        resolverData.name,
        resolverData.role || 'agent',
        resolverData.is_active !== undefined ? resolverData.is_active : true
      ]
    );
  },

  async updateResolver(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE users SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Holidays
  async getHolidays() {
    try {
      return await mysqlClient.query(`
        SELECT 
          h.*,
          c.name as country_name
        FROM holidays h
        LEFT JOIN countries c ON h.country_id = c.id
        ORDER BY h.date DESC
      `);
    } catch (error) {
      // If is_active column doesn't exist, add a default value
      if (error.message.includes('is_active')) {
        console.log('Adding default is_active value (column doesn\'t exist)');
        return await mysqlClient.query(`
          SELECT 
            h.*,
            TRUE as is_active,
            c.name as country_name
          FROM holidays h
          LEFT JOIN countries c ON h.country_id = c.id
          ORDER BY h.date DESC
        `);
      }
      throw error;
    }
  },

  async createHoliday(holidayData) {
    const { v4: uuidv4 } = require('uuid');
    const holidayId = holidayData.id || uuidv4();
    
    // Check if is_active column exists, if not, use a simpler query
    try {
      return await mysqlClient.query(
        'INSERT INTO holidays (id, date, name, year, country_id, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [
          holidayId,
          holidayData.date,
          holidayData.name,
          holidayData.year,
          holidayData.country_id,
          holidayData.is_active !== undefined ? holidayData.is_active : true
        ]
      );
    } catch (error) {
      // If is_active column doesn't exist, use the original schema
      console.log('Falling back to original schema (no is_active column)');
      return await mysqlClient.query(
        'INSERT INTO holidays (id, date, name, year, country_id) VALUES (?, ?, ?, ?, ?)',
        [
          holidayId,
          holidayData.date,
          holidayData.name,
          holidayData.year,
          holidayData.country_id
        ]
      );
    }
  },

  async updateHoliday(id, updateData) {
    // Filter out is_active if it doesn't exist in the table
    const filteredData = { ...updateData };
    
    try {
      const fields = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(filteredData);
      values.push(id);
      
      return await mysqlClient.query(
        `UPDATE holidays SET ${fields} WHERE id = ?`,
        values
      );
    } catch (error) {
      // If is_active column doesn't exist, remove it and try again
      if (error.message.includes('is_active')) {
        console.log('Removing is_active field from update (column doesn\'t exist)');
        delete filteredData.is_active;
        
        const fields = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(filteredData);
        values.push(id);
        
        return await mysqlClient.query(
          `UPDATE holidays SET ${fields} WHERE id = ?`,
          values
        );
      }
      throw error;
    }
  },

  // Dashboard stats
  async getDashboardStats(userId = null) {
    let whereClause = '';
    let params = [];
    
    if (userId) {
      whereClause = 'WHERE assigned_to = ?';
      params = [userId];
    }
    
    const [totalTickets] = await mysqlClient.query(`SELECT COUNT(*) as count FROM tickets ${whereClause}`, params);
    const [openTickets] = await mysqlClient.query(`SELECT COUNT(*) as count FROM tickets WHERE status != 'closed' ${userId ? 'AND assigned_to = ?' : ''}`, userId ? [userId] : []);
    const [closedTickets] = await mysqlClient.query(`SELECT COUNT(*) as count FROM tickets WHERE status = 'closed' ${userId ? 'AND assigned_to = ?' : ''}`, userId ? [userId] : []);
    
    const [avgResolutionTime] = await mysqlClient.query(`
      SELECT AVG(resolution_time_hours) as avg_time 
      FROM tickets 
      WHERE status = 'closed' AND resolution_time_hours IS NOT NULL ${userId ? 'AND assigned_to = ?' : ''}
    `, userId ? [userId] : []);

    const priorityStats = await mysqlClient.query(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      ${whereClause}
      GROUP BY priority
    `, params);

    const statusStats = await mysqlClient.query(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      ${whereClause}
      GROUP BY status
    `, params);

    const recentTickets = await mysqlClient.query(`
      SELECT 
        t.*,
        c.name as client_name,
        u.full_name as assigned_resolver_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 5
    `, params);

    return {
      totalTickets: totalTickets.count,
      openTickets: openTickets.count,
      closedTickets: closedTickets.count,
      avgResolutionTime: avgResolutionTime.avg_time ? parseFloat(avgResolutionTime.avg_time) : 0,
      priorityStats,
      statusStats,
      recentTickets
    };
  },

  // Reports
  async getClientTicketsReport(clientId, year) {
    try {
      console.log('Getting client tickets report for client:', clientId, 'year:', year);
      
      const startDate = `${year}-01-01 00:00:00`;
      const endDate = `${year}-12-31 23:59:59`;
      
      const tickets = await mysqlClient.query(`
        SELECT 
          created_at,
          closed_at,
          status
        FROM tickets 
        WHERE client_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
        ORDER BY created_at
      `, [clientId, startDate, endDate]);
      
      console.log('Found tickets:', tickets.length);
      
      // Process data to group by month
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: new Date(year, index, 1).toLocaleString('es-ES', { month: 'short' }),
        monthNumber: index + 1,
        created: 0,
        closed: 0,
      }));
      
      tickets.forEach((ticket) => {
        const createdMonth = new Date(ticket.created_at).getMonth();
        monthlyData[createdMonth].created += 1;
        
        if (ticket.closed_at) {
          const closedDate = new Date(ticket.closed_at);
          if (closedDate.getFullYear() === year) {
            const closedMonth = closedDate.getMonth();
            monthlyData[closedMonth].closed += 1;
          }
        }
      });
      
      console.log('Processed monthly data:', monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error getting client tickets report:', error);
      throw error;
    }
  },

  async getResolverTicketsReport(resolverId, year) {
    try {
      console.log('Getting resolver tickets report for resolver:', resolverId, 'year:', year);
      
      const startDate = `${year}-01-01 00:00:00`;
      const endDate = `${year}-12-31 23:59:59`;
      
      console.log('Date range:', { startDate, endDate });
      
      const tickets = await mysqlClient.query(`
        SELECT 
          assigned_at,
          status,
          resolution_time_hours
        FROM tickets 
        WHERE assigned_to = ? 
        AND assigned_at IS NOT NULL
        AND assigned_at >= ? 
        AND assigned_at <= ?
        ORDER BY assigned_at
      `, [resolverId, startDate, endDate]);
      
      console.log('Found tickets for resolver:', tickets.length);
      console.log('Sample tickets:', tickets.slice(0, 3));
      
      // Process data to group by month and status
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: new Date(year, index, 1).toLocaleString('es-ES', { month: 'short' }),
        monthNumber: index + 1,
        open: 0,
        assigned: 0,
        in_progress: 0,
        closed: 0,
        totalResolutionTime: 0,
        closedTickets: 0
      }));
      
      tickets.forEach((ticket) => {
        const assignedMonth = new Date(ticket.assigned_at).getMonth();
        const status = ticket.status;
        
        console.log(`Processing ticket: assigned_at=${ticket.assigned_at}, month=${assignedMonth}, status=${status}`);
        
        if (monthlyData[assignedMonth] && status in monthlyData[assignedMonth]) {
          monthlyData[assignedMonth][status] += 1;
          
          // Sum resolution time for closed tickets
          if (status === 'closed' && ticket.resolution_time_hours) {
            monthlyData[assignedMonth].totalResolutionTime += parseFloat(ticket.resolution_time_hours);
            monthlyData[assignedMonth].closedTickets += 1;
            console.log(`Added resolution time: ${ticket.resolution_time_hours} for month ${assignedMonth}`);
          }
        }
      });
      
      console.log('Processed monthly data for resolver:', monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error getting resolver tickets report:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  async getTicketDetailReport(filters) {
    try {
      console.log('Getting ticket detail report with filters:', filters);
      
      let whereConditions = [];
      let params = [];
      
      // Date filters
      if (filters.startDate) {
        whereConditions.push('t.created_at >= ?');
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        // Ajustar la fecha hasta para incluir todo el día
        // Convertir la fecha ISO a la fecha del día siguiente a las 00:00:00
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(0, 0, 0, 0);
        
        whereConditions.push('t.created_at < ?');
        params.push(endDate.toISOString());
      }
      
      // Status filter
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        whereConditions.push('t.status = ?');
        params.push(filters.statusFilter);
      }
      
      // Resolver filter
      if (filters.selectedResolver && filters.selectedResolver !== 'all') {
        whereConditions.push('t.assigned_to = ?');
        params.push(filters.selectedResolver);
      }
      
      // Client filter
      if (filters.selectedClient && filters.selectedClient !== 'all') {
        whereConditions.push('t.client_id = ?');
        params.push(filters.selectedClient);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
             const query = `
         SELECT 
           t.id,
           t.ticket_number,
           t.title,
           t.description,
           t.status,
           t.priority,
           t.request_type,
           t.usu_solicitante,
           t.created_at,
           t.closed_at,
           t.resolution_time_hours,
           t.resolution_notes,
           c.name as client_name,
           u.full_name as assigned_resolver_name,
           creator.full_name as created_user_name
         FROM tickets t
         LEFT JOIN clients c ON t.client_id = c.id
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN users creator ON t.created_by = creator.id
         ${whereClause}
         ORDER BY t.created_at DESC
       `;
      
      console.log('Executing query:', query);
      console.log('With params:', params);
      
      const tickets = await mysqlClient.query(query, params);
      
      console.log('Found tickets:', tickets.length);
      return tickets;
    } catch (error) {
      console.error('Error getting ticket detail report:', error);
      throw error;
    }
  },

  async getClientResolutionTimeReport(clientId, year) {
    try {
      console.log('Getting client resolution time report for client:', clientId, 'year:', year);
      
      const startDate = `${year}-01-01 00:00:00`;
      const endDate = `${year}-12-31 23:59:59`;
      
      console.log('Date range:', { startDate, endDate });
      
      const tickets = await mysqlClient.query(`
        SELECT 
          created_at,
          closed_at,
          status,
          resolution_time_hours
        FROM tickets 
        WHERE client_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
        ORDER BY created_at
      `, [clientId, startDate, endDate]);
      
      console.log('Found tickets for client:', tickets.length);
      console.log('Sample tickets:', tickets.slice(0, 3));
      
      // Process data to group by month and status
      const monthlyData = Array.from({ length: 12 }, (_, index) => ({
        month: new Date(year, index, 1).toLocaleString('es-ES', { month: 'short' }),
        monthNumber: index + 1,
        created: 0,
        closed: 0,
        totalResolutionTime: 0,
        closedTickets: 0
      }));
      
      tickets.forEach((ticket) => {
        const createdMonth = new Date(ticket.created_at).getMonth();
        const status = ticket.status;
        
        console.log(`Processing ticket: created_at=${ticket.created_at}, month=${createdMonth}, status=${status}`);
        
        if (monthlyData[createdMonth]) {
          monthlyData[createdMonth].created += 1;
          
          // Sum resolution time for closed tickets
          if (status === 'closed' && ticket.resolution_time_hours) {
            monthlyData[createdMonth].totalResolutionTime += parseFloat(ticket.resolution_time_hours);
            monthlyData[createdMonth].closedTickets += 1;
            console.log(`Added resolution time: ${ticket.resolution_time_hours} for month ${createdMonth}`);
          }
        }
      });
      
      console.log('Processed monthly data for client:', monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error getting client resolution time report:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
};

module.exports = { db, mysqlClient, pool };
