"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomerTimeline,
} from "../api/customer-api";
import type { CustomerCreate, CustomerUpdate } from "../types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export function useCustomers(params: {
  page?: number;
  per_page?: number;
  search?: string;
  property_type?: string;
  lead_source?: string;
} = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCustomerTimeline(id: string) {
  return useQuery({
    queryKey: ["customer-timeline", id],
    queryFn: () => fetchCustomerTimeline(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerCreate) => createCustomer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdate) => updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", id] });
      toast.success("Customer updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
