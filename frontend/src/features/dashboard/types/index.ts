export interface DashboardStats {
  today_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  total_outstanding: number;
  today_jobs: number;
  upcoming_jobs: number;
  total_customers: number;
  new_customers_this_month: number;
  // legacy fields with safe defaults
  total_orders?: number;
  completed_orders?: number;
  solar_jobs_this_month?: number;
  tank_jobs_this_month?: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  orders?: number;
  // legacy
  expenses?: number;
  profit?: number;
}

export interface ServiceDistribution {
  solar: number;
  tank: number;
  combined: number;
}

export interface UpcomingJob {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  total_amount?: number;
}

export interface RecentActivity {
  id: string;
  order_number?: string;
  customer_name?: string;
  service_type?: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
  // legacy fields
  type?: string;
  title?: string;
  description?: string;
  time?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenue_chart: RevenueDataPoint[];
  service_distribution: ServiceDistribution;
  upcoming_jobs: UpcomingJob[];
  recent_activity: RecentActivity[];
}
