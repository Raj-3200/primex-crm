"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders, fetchOrder, createOrder, updateOrderStatus, deleteOrder,
} from "../api/order-api";
import type { OrderCreate } from "../types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export function useOrders(params: {
  page?: number;
  per_page?: number;
  status?: string;
  service_type?: string;
  customer_id?: string;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrderCreate) => createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Order created successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      updateOrderStatus(id, status, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Order status updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
