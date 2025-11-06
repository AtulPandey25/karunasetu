// In production, use the full backend URL from the environment variable.
// In development, use the relative path which will be handled by the Vite proxy.
// In development, use Vite proxy by leaving base empty. In production, use env or fallback URL.
const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || "https://karunaapi.onrender.com")
  : "";

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type");
  let data: any;

  try {
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }

  if (response.status === 401) {
    // Unauthorized, clear token and reload
    localStorage.removeItem("adminToken");
    // Use location.reload() to force a re-render of the admin page
    // which will then show the login form.
    location.reload();
  }

  return {
    ok: response.ok,
    data: data,
    error: !response.ok ? data?.error || `HTTP ${response.status}` : undefined,
    status: response.status,
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    const params = new URLSearchParams({ email: email.trim(), password: password.trim() });
    // Send both query and JSON body for maximum compatibility with proxies
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    return apiClient.post(`/admin/login`, formData);
  },
};

export const galleryApi = {
  async upload(
    files: FileList,
    title: string,
  ): Promise<ApiResponse<{ images: any[] }>> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    if (title) formData.append("title", title);

    return api.post("/gallery/admin", formData);
  },

  async delete(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return api.delete(`/gallery/admin/${id}`);
  },

  async toggleFeatured(
    id: string,
    featured: boolean,
  ): Promise<ApiResponse<{ image: any }>> {
    return api.patch(`/gallery/admin/${id}`, { featured });
  },
};

export const donorsApi = {
  async create(
    donor: {
      name: string;
      tier: string;
      website?: string;
      donatedAmount?: number;
      donatedCommodity?: string;
    },
    logo: File | null,
  ): Promise<ApiResponse<{ donor: any }>> {
    const formData = new FormData();
    formData.append("name", donor.name);
    formData.append("tier", donor.tier);
    if (donor.website) formData.append("website", donor.website);
    if (donor.donatedAmount !== undefined)
      formData.append("donatedAmount", String(donor.donatedAmount));
    if (donor.donatedCommodity)
      formData.append("donatedCommodity", donor.donatedCommodity);
    if (logo) formData.append("logo", logo);

    return api.post("/donors/admin", formData);
  },

  async delete(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return api.delete(`/donors/admin/${id}`);
  },

  async reorder(
    orderedIds: string[],
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return api.post("/donors/admin/reorder", { orderedIds });
  },
};

export const membersApi = {
  async create(
    member: {
      name: string;
      role?: string;
      bio?: string;
      instaId?: string;
      email?: string;
      contact?: string;
    },
    photo: File | null,
  ): Promise<ApiResponse<{ member: any }>> {
    const formData = new FormData();
    formData.append("name", member.name);
    if (member.role) formData.append("role", member.role);
    if (member.bio) formData.append("bio", member.bio);
    if (member.instaId) formData.append("instaId", member.instaId);
    if (member.email) formData.append("email", member.email);
    if (member.contact) formData.append("contact", member.contact);
    if (photo) formData.append("photo", photo);

    return api.post("/members/admin", formData);
  },

  async delete(id: string): Promise<ApiResponse<{ ok: boolean }>> {
    return api.delete(`/members/admin/${id}`);
  },

  async reorder(
    orderedIds: string[],
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return api.post("/members/admin/reorder", { orderedIds });
  },
};

export const apiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, options);
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, {
      method: "POST",
      ...options,
      body:
        body instanceof FormData || typeof body === "string"
          ? body
          : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, {
      method: "PATCH",
      ...options,
      body:
        body instanceof FormData || typeof body === "string"
          ? body
          : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, {
      method: "DELETE",
      ...options,
    });
    return handleResponse<T>(response);
  },
};

const getToken = () => localStorage.getItem("adminToken");

export const api = {
  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${getToken()}`);
    return apiClient.get<T>(path, { ...options, headers });
  },

  async post<T>(
    path: string,
    body: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${getToken()}`);
    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return apiClient.post<T>(path, body, { ...options, headers });
  },

  async patch<T>(
    path: string,
    body: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
headers.set("Authorization", `Bearer ${getToken()}`);
    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    return apiClient.patch<T>(path, body, { ...options, headers });
  },

  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${getToken()}`);
    return apiClient.delete<T>(path, { ...options, headers });
  },
};