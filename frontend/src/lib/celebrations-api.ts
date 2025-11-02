
import { apiClient } from "./api-client";

export const celebrationsApi = {
  getAll: () => apiClient.get("/celebrations"),
  create: (data: FormData, token: string) =>
    apiClient.post("/celebrations/admin", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  update: (id: string, data: FormData, token: string) =>
    apiClient.patch(`/celebrations/admin/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  delete: (id: string, token: string) =>
    apiClient.delete(`/celebrations/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  reorder: (orderedIds: string[], token: string) =>
    apiClient.post("/celebrations/admin/reorder", { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getProducts: (celebrationId: string) =>
    apiClient.get(`/celebrations/${celebrationId}/products`),
  createProduct: (data: FormData, token: string) =>
    apiClient.post(`/celebrations/products/admin`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateProduct: (productId: string, data: FormData, token: string) =>
    apiClient.patch(`/celebrations/products/admin/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  deleteProduct: (productId: string, token: string) =>
    apiClient.delete(`/celebrations/products/admin/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  reorderProducts: (orderedIds: string[], token: string) =>
    apiClient.post("/celebrations/products/admin/reorder", { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
