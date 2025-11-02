// In production, use the full backend URL from the environment variable.
// In development, use the relative path which will be handled by the Vite proxy.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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

  return {
    ok: response.ok,
    data: data,
    error: !response.ok ? data?.error || `HTTP ${response.status}` : undefined,
    status: response.status,
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post("/admin/login", { email, password });
  },
};

export const galleryApi = {
  async upload(
    files: FileList,
    title: string,
    token: string
  ): Promise<ApiResponse<{ images: any[] }>> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    if (title) formData.append("title", title);

    return apiClient.post("/gallery/admin", formData, { headers: { Authorization: `Bearer ${token}` } });
  },

  async delete(id: string, token: string): Promise<ApiResponse<{ ok: boolean }>> {
    return apiClient.delete(`/gallery/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },

  async toggleFeatured(
    id: string,
    featured: boolean,
    token: string
  ): Promise<ApiResponse<{ image: any }>> {
    return apiClient.patch(`/gallery/admin/${id}`, { featured }, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
    token: string
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

    return apiClient.post("/donors/admin", formData, { headers: { Authorization: `Bearer ${token}` } });
  },

  async delete(id: string, token: string): Promise<ApiResponse<{ ok: boolean }>> {
    return apiClient.delete(`/donors/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },

  async reorder(
    orderedIds: string[],
    token: string
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return apiClient.post("/donors/admin/reorder", { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
    token: string
  ): Promise<ApiResponse<{ member: any }>> {
    const formData = new FormData();
    formData.append("name", member.name);
    if (member.role) formData.append("role", member.role);
    if (member.bio) formData.append("bio", member.bio);
    if (member.instaId) formData.append("instaId", member.instaId);
    if (member.email) formData.append("email", member.email);
    if (member.contact) formData.append("contact", member.contact);
    if (photo) formData.append("photo", photo);

    return apiClient.post("/members/admin", formData, { headers: { Authorization: `Bearer ${token}` } });
  },

  async delete(id: string, token: string): Promise<ApiResponse<{ ok: boolean }>> {
    return apiClient.delete(`/members/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },

  async reorder(
    orderedIds: string[],
    token: string
  ): Promise<ApiResponse<{ ok: boolean }>> {
    return apiClient.post("/members/admin/reorder", { orderedIds }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

export const apiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, options);
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    if (!(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST',
      ...options,
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    if (!(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}/api${path}`, {
      method: 'PATCH',
      ...options,
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}/api${path}`, {
      method: 'DELETE',
      ...options,
    });
    return handleResponse<T>(response);
  },
};
