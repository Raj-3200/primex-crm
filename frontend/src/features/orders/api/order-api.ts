import apiClient from "@/lib/api-client";
import type { Order, OrderCreate, OrderListResponse } from "../types";

export async function fetchOrders(params: {
  page?: number;
  per_page?: number;
  status?: string;
  service_type?: string;
  customer_id?: string;
  search?: string;
}): Promise<OrderListResponse> {
  const { data } = await apiClient.get("/orders", { params });
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
}

export async function createOrder(payload: OrderCreate): Promise<Order> {
  const { data } = await apiClient.post("/orders", payload);
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  notes?: string
): Promise<Order> {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status, notes });
  return data;
}

export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}
