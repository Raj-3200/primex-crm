export interface SolarDetail {
  id: string;
  panel_count: number;
  capacity_kw: number;
  roof_type: "FLAT" | "SLOPED" | "GROUND_MOUNTED";
  panel_type: "MONOCRYSTALLINE" | "POLYCRYSTALLINE" | "THIN_FILM";
  before_photos: string[];
  after_photos: string[];
  remarks: string | null;
}

export interface TankDetail {
  id: string;
  tank_type: "OVERHEAD" | "UNDERGROUND" | "SUMP";
  capacity_liters: number;
  number_of_tanks: number;
  before_photos: string[];
  after_photos: string[];
  chemical_used: string | null;
  remarks: string | null;
}

export type OrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ServiceType = "SOLAR" | "TANK" | "COMBINED";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  service_type: ServiceType;
  status: OrderStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  solar_detail: SolarDetail | null;
  tank_detail: TankDetail | null;
}

export interface OrderCreate {
  customer_id: string;
  service_type: ServiceType;
  scheduled_date?: string;
  scheduled_time?: string;
  subtotal: number;
  discount?: number;
  tax_rate?: number;
  notes?: string;
  assigned_to?: string;
  solar_detail?: {
    panel_count: number;
    capacity_kw: number;
    roof_type: string;
    panel_type: string;
    remarks?: string;
  };
  tank_detail?: {
    tank_type: string;
    capacity_liters: number;
    number_of_tanks: number;
    chemical_used?: string;
    remarks?: string;
  };
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
