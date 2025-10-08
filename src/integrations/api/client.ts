//const API_BASE_URL = 'https://kpazserv0019-aeajahd3bhc4dkh2.eastus-01.azurewebsites.net/api';
const API_BASE_URL = 'http://localhost:3001/api';

// Generic API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// API functions
export const api = {
  // Health check
  health: () => apiClient.get('/health'),

  // Auth
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),

  // Countries
  getCountries: () => apiClient.get('/countries'),
  updateCountry: (id: string, data: any) => apiClient.put(`/countries/${id}`, data),

  // Clients
  getClients: () => apiClient.get('/clients'),
  createClient: (data: any) => apiClient.post('/clients', data),
  updateClient: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),

  // Request Types
  getRequestTypes: () => apiClient.get('/request-types'),
  updateRequestType: (id: string, data: any) => apiClient.put(`/request-types/${id}`, data),

  // Users
  getUsers: () => apiClient.get('/users'),
  createUser: (data: any) => apiClient.post('/users', data),
  updateUser: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  updateUserPassword: (id: string, password: string) => apiClient.put(`/users/${id}/password`, { password }),

  // Resolvers
  getResolvers: () => apiClient.get('/resolvers'),
  createResolver: (data: any) => apiClient.post('/resolvers', data),
  updateResolver: (id: string, data: any) => apiClient.put(`/resolvers/${id}`, data),

  // Holidays
  getHolidays: () => apiClient.get('/holidays'),
  createHoliday: (data: any) => apiClient.post('/holidays', data),
  updateHoliday: (id: string, data: any) => apiClient.put(`/holidays/${id}`, data),

  // Tickets
  getTickets: () => apiClient.get('/tickets'),
  getTicketById: (id: string) => apiClient.get(`/tickets/${id}`),
  createTicket: (data: any) => apiClient.post('/tickets', data),
  updateTicket: (id: string, data: any) => apiClient.put(`/tickets/${id}`, data),

  // Dashboard
  getDashboardStats: (userId?: string) => {
    const url = userId ? `/dashboard/stats?userId=${userId}` : '/dashboard/stats';
    return apiClient.get(url);
  },
  
  // Reports
  getClientTicketsReport: (clientId: string, year: number) => apiClient.get(`/reports/client-tickets/${clientId}/${year}`),
  getResolverTicketsReport: (resolverId: string, year: number) => apiClient.get(`/reports/resolver-tickets/${resolverId}/${year}`),
  getClientResolutionTimeReport: (clientId: string, year: number) => apiClient.get(`/reports/client-resolution-time/${clientId}/${year}`),
  getTicketDetailReport: (filters: any) => apiClient.post('/reports/ticket-detail', filters),
};
