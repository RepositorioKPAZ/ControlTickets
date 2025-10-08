// Mock client for development - replace with real MySQL client
export const db = {
  // Users
  async getUserByEmail(email: string) {
    return null;
  },

  async getUserById(id: string) {
    return null;
  },

  async createUser(userData: any) {
    return null;
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    return null;
  },

  // Tickets
  async getTickets() {
    return [
      {
        id: '1',
        ticket_number: 'TCK-2025-0001',
        title: 'Problema con el login',
        description: 'No puedo acceder al sistema',
        status: 'open',
        priority: 'high',
        request_type: 'support',
        client_id: '1',
        assigned_to: '1',
        created_by: '3',
        client_name: 'Cliente Ejemplo 1',
        client_email: 'cliente1@ejemplo.com',
        assigned_resolver_name: 'Agente 1',
        created_user_name: 'Administrador',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '2',
        ticket_number: 'TCK-2025-0002',
        title: 'Error en reportes',
        description: 'Los reportes no se generan correctamente',
        status: 'in_progress',
        priority: 'medium',
        request_type: 'bug',
        client_id: '2',
        assigned_to: '2',
        created_by: '3',
        client_name: 'Cliente Ejemplo 2',
        client_email: 'cliente2@ejemplo.com',
        assigned_resolver_name: 'Agente 2',
        created_user_name: 'Administrador',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  },

  async getTicketById(id: string) {
    return null;
  },

  async createTicket(ticketData: any) {
    return null;
  },

  async updateTicket(id: string, updateData: any) {
    return null;
  },

  // Clients
  async getClients() {
    return [
      { id: '1', name: 'Cliente Ejemplo 1', email: 'cliente1@ejemplo.com', phone: '+1234567890', address: 'Dirección 1', created_at: new Date(), updated_at: new Date() },
      { id: '2', name: 'Cliente Ejemplo 2', email: 'cliente2@ejemplo.com', phone: '+0987654321', address: 'Dirección 2', created_at: new Date(), updated_at: new Date() }
    ];
  },

  async createClient(clientData: any) {
    return null;
  },

  // Request Types
  async getRequestTypes() {
    return [
      { id: '1', name: 'support', description: 'Soporte técnico general', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '2', name: 'bug', description: 'Reporte de errores o fallos', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '3', name: 'feature', description: 'Solicitud de nueva funcionalidad', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '4', name: 'maintenance', description: 'Tareas de mantenimiento', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '5', name: 'other', description: 'Otros tipos de solicitudes', is_active: true, created_at: new Date(), updated_at: new Date() }
    ];
  },

  // Countries
  async getCountries() {
    return [
      { id: '1', name: 'España', code: 'ES', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '2', name: 'México', code: 'MX', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '3', name: 'Argentina', code: 'AR', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '4', name: 'Colombia', code: 'CO', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '5', name: 'Chile', code: 'CL', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '6', name: 'Perú', code: 'PE', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '7', name: 'Venezuela', code: 'VE', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '8', name: 'Ecuador', code: 'EC', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '9', name: 'Bolivia', code: 'BO', is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: '10', name: 'Uruguay', code: 'UY', is_active: true, created_at: new Date(), updated_at: new Date() }
    ];
  },

  async updateCountry(id: string, updateData: any) {
    console.log('Updating country:', id, updateData);
    return null;
  },

  // Users (for assignment)
  async getUsers() {
    return [
      { id: '1', full_name: 'Agente 1', email: 'agente1@sistema.com', role: 'agent' },
      { id: '2', full_name: 'Agente 2', email: 'agente2@sistema.com', role: 'agent' },
      { id: '3', full_name: 'Administrador', email: 'admin@sistema.com', role: 'admin' }
    ];
  },

  // Dashboard stats
  async getDashboardStats() {
    const tickets = await this.getTickets();
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status !== 'closed').length;
    const closedTickets = tickets.filter(t => t.status === 'closed').length;
    
    const priorityStats = [
      { priority: 'low', count: tickets.filter(t => t.priority === 'low').length },
      { priority: 'medium', count: tickets.filter(t => t.priority === 'medium').length },
      { priority: 'high', count: tickets.filter(t => t.priority === 'high').length },
      { priority: 'urgent', count: tickets.filter(t => t.priority === 'urgent').length }
    ];
    
    const statusStats = [
      { status: 'open', count: tickets.filter(t => t.status === 'open').length },
      { status: 'assigned', count: tickets.filter(t => t.status === 'assigned').length },
      { status: 'in_progress', count: tickets.filter(t => t.status === 'in_progress').length },
      { status: 'closed', count: tickets.filter(t => t.status === 'closed').length }
    ];
    
    const recentTickets = tickets.slice(0, 5);
    
    return {
      totalTickets,
      openTickets,
      closedTickets,
      avgResolutionTime: 24.5, // Mock average
      priorityStats,
      statusStats,
      recentTickets
    };
  }
};
