export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'closed';
export type RequestType = 'support' | 'bug' | 'feature' | 'maintenance' | 'other';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Client {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  year: number;
  country_id: string;
  is_active?: boolean; // Made optional to handle cases where column doesn't exist
  created_at: string;
  // Relations
  country?: Country;
  country_name?: string; // From JOIN query
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: PriorityLevel;
  request_type: RequestType;
  client_id: string;
  usu_solicitante?: string;
  assigned_to?: string;
  created_by: string;
  assigned_at?: string;
  closed_at?: string;
  resolution_time_hours?: number;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  assigned_user?: Profile;
  created_user?: Profile;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  changed_by_user?: Profile;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'agent' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resolver {
  id: string;
  full_name: string; // Changed from 'name' to 'full_name' to match users table
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  name: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequestTypeConfig {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}