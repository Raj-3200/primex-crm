/**
 * Core API response types used across the application
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  total_spent: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  service_type: "solar" | "tank" | "amc";
  total_amount: number;
  scheduled_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status: number;
  timestamp?: string;
}
