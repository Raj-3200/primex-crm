export interface Customer {
  id: string;
  customer_id: string;
  name: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
  gst_number: string | null;
  property_type: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL";
  lead_source: "REFERRAL" | "WEBSITE" | "SOCIAL_MEDIA" | "WALK_IN" | "COLD_CALL" | "OTHER";
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
}

export interface CustomerCreate {
  name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  gst_number?: string;
  property_type: string;
  lead_source?: string;
  notes?: string;
}

export type CustomerUpdate = Partial<CustomerCreate>;

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string;
  metadata: Record<string, unknown>;
}
