import { api } from "./api-client";

export const celebrationsApi = {
  getAll: () => api.get("/celebrations"),
  create: (data: FormData) =>
    api.post("/celebrations/admin", data),
  update: (id: string, data: FormData) =>
    api.patch(`/celebrations/admin/${id}`, data),
  delete: (id: string) =>
    api.delete(`/celebrations/admin/${id}`),
  reorder: (orderedIds: string[]) =>
    api.post("/celebrations/admin/reorder", { orderedIds }),
  getProducts: (celebrationId: string) =>
    api.get(`/celebrations/${celebrationId}/products`),
  createProduct: (data: FormData) =>
    api.post(`/celebrations/products/admin`, data),
  updateProduct: (productId: string, data: FormData) =>
    api.patch(`/celebrations/products/admin/${productId}`, data),
  deleteProduct: (productId: string) =>
    api.delete(`/celebrations/products/admin/${productId}`),
  reorderProducts: (orderedIds: string[]) =>
    api.post("/celebrations/products/admin/reorder", { orderedIds }),
};