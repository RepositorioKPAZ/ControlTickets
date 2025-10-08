import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ticket_system',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database client class
export class MySQLClient {
  private pool: mysql.Pool;

  constructor() {
    this.pool = pool;
  }

  // Get connection from pool
  async getConnection() {
    return await this.pool.getConnection();
  }

  // Execute query with parameters
  async query(sql: string, params?: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Execute transaction
  async transaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
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
export const mysqlClient = new MySQLClient();

// Export pool for direct access if needed
export { pool };

// Helper functions for common operations
export const db = {
  // Users
  async getUserByEmail(email: string) {
    const [rows] = await mysqlClient.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    return Array.isArray(rows) ? rows[0] : null;
  },

  async getUserById(id: string) {
    const [rows] = await mysqlClient.query(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return Array.isArray(rows) ? rows[0] : null;
  },

  async createUser(userData: {
    id: string;
    email: string;
    password_hash: string;
    full_name?: string;
    role?: string;
  }) {
    return await mysqlClient.query(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [userData.id, userData.email, userData.password_hash, userData.full_name, userData.role || 'agent']
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

  async getTicketById(id: string) {
    const [rows] = await mysqlClient.query(`
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
    return Array.isArray(rows) ? rows[0] : null;
  },

  async createTicket(ticketData: any) {
    return await mysqlClient.query(
      'INSERT INTO tickets (id, title, description, client_id, priority, request_type, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ticketData.id,
        ticketData.title,
        ticketData.description,
        ticketData.client_id,
        ticketData.priority,
        ticketData.request_type,
        ticketData.assigned_to,
        ticketData.created_by
      ]
    );
  },

  async updateTicket(id: string, updateData: any) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    return await mysqlClient.query(
      `UPDATE tickets SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Clients
  async getClients() {
    return await mysqlClient.query('SELECT * FROM clients ORDER BY name');
  },

  async createClient(clientData: any) {
    return await mysqlClient.query(
      'INSERT INTO clients (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [clientData.id, clientData.name, clientData.email, clientData.phone, clientData.address]
    );
  },

  // Request Types
  async getRequestTypes() {
    return await mysqlClient.query('SELECT * FROM request_types WHERE is_active = TRUE ORDER BY name');
  },

  // Countries
  async getCountries() {
    return await mysqlClient.query('SELECT * FROM countries ORDER BY name');
  },

  async updateCountry(id: string, updateData: any) {
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
    return await mysqlClient.query('SELECT id, full_name, email, role FROM users WHERE is_active = TRUE ORDER BY full_name');
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    return await mysqlClient.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  },

  // Dashboard stats
  async getDashboardStats() {
    const [totalTickets] = await mysqlClient.query('SELECT COUNT(*) as count FROM tickets');
    const [openTickets] = await mysqlClient.query("SELECT COUNT(*) as count FROM tickets WHERE status != 'closed'");
    const [closedTickets] = await mysqlClient.query("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'");
    
    const [avgResolutionTime] = await mysqlClient.query(`
      SELECT AVG(resolution_time_hours) as avg_time 
      FROM tickets 
      WHERE status = 'closed' AND resolution_time_hours IS NOT NULL
    `);

    const [priorityStats] = await mysqlClient.query(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      GROUP BY priority
    `);

    const [statusStats] = await mysqlClient.query(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `);

    const [recentTickets] = await mysqlClient.query(`
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

    return {
      totalTickets: totalTickets.count,
      openTickets: openTickets.count,
      closedTickets: closedTickets.count,
      avgResolutionTime: avgResolutionTime.avg_time || 0,
      priorityStats,
      statusStats,
      recentTickets
    };
  }
};
