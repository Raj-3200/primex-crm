import apiClient from "@/lib/api-client";
import type {
  Customer,
  CustomerCreate,
  CustomerListResponse,
  CustomerUpdate,
  TimelineEvent,
} from "../types";

export async function fetchCustomers(params: {
  page?: number;
  per_page?: number;
  search?: string;
  property_type?: string;
  lead_source?: string;
}): Promise<CustomerListResponse> {
  const { data } = await apiClient.get("/customers", { params });
  return data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await apiClient.post("/customers", payload);
  return data;
}

export async function updateCustomer(
  id: string,
  payload: CustomerUpdate
): Promise<Customer> {
  const { data } = await apiClient.put(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

export async function fetchCustomerTimeline(
  id: string
): Promise<TimelineEvent[]> {
  const { data } = await apiClient.get(`/customers/${id}/timeline`);
  return data;
}
