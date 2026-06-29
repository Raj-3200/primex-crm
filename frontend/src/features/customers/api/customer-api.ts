import type {
  Customer,
  CustomerCreate,
  CustomerListResponse,
  CustomerUpdate,
  TimelineEvent,
} from "../types";

const BASE = "/api";

function getToken(): string {
  return localStorage.getItem("access_token") || "";
}

function headers(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchCustomers(params: {
  page?: number;
  per_page?: number;
  search?: string;
  property_type?: string;
  lead_source?: string;
}): Promise<CustomerListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search) qs.set("search", params.search);
  if (params.property_type) qs.set("property_type", params.property_type);
  if (params.lead_source) qs.set("lead_source", params.lead_source);
  const res = await fetch(`${BASE}/customers?${qs}`, { headers: headers() });
  return handleResponse<CustomerListResponse>(res);
}

export async function fetchCustomer(id: string): Promise<Customer & { stats?: any; orders?: any[] }> {
  const res = await fetch(`${BASE}/customers/${id}`, { headers: headers() });
  const data = await handleResponse<{ customer: Customer; stats: any; orders: any[] }>(res);
  return { ...data.customer, ...data };
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const res = await fetch(`${BASE}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Customer>(res);
}

export async function updateCustomer(id: string, payload: CustomerUpdate): Promise<Customer> {
  const res = await fetch(`${BASE}/customers/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Customer>(res);
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${BASE}/customers/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Failed to delete customer");
}

export async function fetchCustomerTimeline(id: string): Promise<TimelineEvent[]> {
  // Derive timeline from orders for now
  const data = await fetchCustomer(id) as any;
  const orders: any[] = data.orders || [];
  return orders.map((o: any) => ({
    id: o.id,
    type: "order",
    title: `Order ${o.order_number}`,
    description: `${o.service_type} — ${o.status}`,
    date: o.created_at,
    metadata: { status: o.status, amount: o.total_amount },
  }));
}
