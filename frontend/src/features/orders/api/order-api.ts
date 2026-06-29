import type { Order, OrderCreate, OrderListResponse } from "../types";

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

export async function fetchOrders(params: {
  page?: number;
  per_page?: number;
  status?: string;
  service_type?: string;
  customer_id?: string;
  search?: string;
}): Promise<OrderListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.service_type) qs.set("service_type", params.service_type);
  if (params.customer_id) qs.set("customer_id", params.customer_id);
  const res = await fetch(`${BASE}/orders?${qs}`, { headers: headers() });
  return handleResponse<OrderListResponse>(res);
}

export async function fetchOrder(id: string): Promise<Order & { solar_detail?: any; tank_detail?: any; activity_logs?: any[] }> {
  const res = await fetch(`${BASE}/orders/${id}`, { headers: headers() });
  const data = await handleResponse<{ order: Order; solar_detail: any; tank_detail: any; activity_logs: any[] }>(res);
  return { ...data.order, solar_detail: data.solar_detail, tank_detail: data.tank_detail, activity_logs: data.activity_logs };
}

export async function createOrder(payload: OrderCreate): Promise<Order> {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status, notes }),
  });
  return handleResponse<Order>(res);
}

export async function updateOrder(id: string, payload: Partial<Order>): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Failed to delete order");
}
