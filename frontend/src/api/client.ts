const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('kys_token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('kys_token', token);
  } else {
    localStorage.removeItem('kys_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: { name: string; email: string; password: string; preferredCurrency?: string; timezone?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  updateProfile: (profile: any) =>
    request<{ success: boolean; message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  // Catalog
  getCatalog: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return request<{ success: boolean; count: number; services: any[]; disclaimer: string }>(
      `/catalog?${query.toString()}`
    );
  },

  // Subscriptions
  getSubscriptions: (params?: { category?: string; frequency?: string; status?: string; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.frequency) query.append('frequency', params.frequency);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    return request<{ success: boolean; data: any[]; meta: any }>(`/subscriptions?${query.toString()}`);
  },

  getSubscriptionById: (id: string) =>
    request<{ success: boolean; subscription: any; monthlyEquivalent: number; billingEvents: any[] }>(
      `/subscriptions/${id}`
    ),

  createSubscription: (sub: any) =>
    request<{ success: boolean; message: string; subscription: any; monthlyEquivalent: number }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(sub),
    }),

  updateSubscription: (id: string, sub: any) =>
    request<{ success: boolean; message: string; subscription: any; monthlyEquivalent: number }>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sub),
    }),

  pauseSubscription: (id: string) =>
    request<{ success: boolean; message: string; subscription: any }>(`/subscriptions/${id}/pause`, {
      method: 'PATCH',
    }),

  resumeSubscription: (id: string, nextRenewalDate?: string) =>
    request<{ success: boolean; message: string; subscription: any }>(`/subscriptions/${id}/resume`, {
      method: 'PATCH',
      body: JSON.stringify({ nextRenewalDate }),
    }),

  cancelSubscription: (id: string) =>
    request<{ success: boolean; message: string; subscription: any }>(`/subscriptions/${id}/cancel`, {
      method: 'PATCH',
    }),

  deleteSubscription: (id: string) =>
    request<{ success: boolean; message: string }>(`/subscriptions/${id}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: () => request<{ success: boolean; data: any }>('/analytics'),

  // Budget
  getBudget: () => request<{ success: boolean; budget: any }>('/budget'),
  updateBudget: (budget: any) =>
    request<{ success: boolean; message: string; budget: any }>('/budget', {
      method: 'PUT',
      body: JSON.stringify(budget),
    }),

  // Notifications
  getNotifications: (params?: { status?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    return request<{ success: boolean; unreadCount: number; totalCount: number; today: any[]; earlier: any[]; all: any[] }>(
      `/notifications?${query.toString()}`
    );
  },

  markNotificationRead: (id: string) =>
    request<{ success: boolean; unreadCount: number; notification: any }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string; unreadCount: number }>('/notifications/mark-all-read', {
      method: 'POST',
    }),

  checkNotificationsNow: () =>
    request<{ success: boolean; message: string; result: any }>('/notifications/check-now', {
      method: 'POST',
    }),

  // Billing
  getBillingHistory: (subId: string) => request<{ success: boolean; events: any[] }>(`/billing/${subId}`),
  recordBillingEvent: (subId: string, eventData: any) =>
    request<{ success: boolean; message: string; event: any }>(`/billing/${subId}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  // Admin
  getAdminDashboard: () => request<{ success: boolean; data: any }>('/admin/dashboard'),
};
