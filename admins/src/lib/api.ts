const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAdminKey = (): string | null => {
  return sessionStorage.getItem('adminKey');
};

const setAdminKey = (key: string): void => {
  sessionStorage.setItem('adminKey', key);
};

const clearAdminKey = (): void => {
  sessionStorage.removeItem('adminKey');
};

const isAuthenticated = (): boolean => {
  return !!getAdminKey();
};

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const adminKey = getAdminKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminKey();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    throw new ApiError(
      data?.error || data?.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
}

// Admin API endpoints
export const adminApi = {
  auth: {
    login: (key: string) => {
      return api('/api/admin/stats', {
        headers: {
          'x-admin-key': key,
        },
      }).then((res) => {
        setAdminKey(key);
        return res;
      });
    },
    logout: () => {
      clearAdminKey();
    },
    isAuthenticated,
    getAdminKey,
  },

  stats: () => api<{ totalUsers: number; premiumUsers: number; freeUsers: number }>('/api/admin/stats'),

  pendingPayments: () => api<{ users: Array<{ id: string; email: string; name: string; createdAt: string }> }>('/api/admin/pending-payments'),

  listAll: () => api<{ users: Array<{ id: string; email: string; name: string; createdAt: string; isPremium: boolean; premiumExpiry: string | null }> }>('/api/admin/list-all'),

  activatePremium: (data: {
    userId: string;
    months: number;
    paymentMethod?: string;
    paymentReference?: string;
  }) => api('/api/admin/activate-premium', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  cancelPremium: (userId: string) => api('/api/admin/cancel-premium', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),

  deleteUser: (userId: string) => api(`/api/admin/user/${userId}`, {
    method: 'DELETE',
  }),

  // Complaint endpoints
  listAllComplaints: () => api<{ complaints: Array<{ id: string; userId: string; userEmail: string; message: string; status: string; createdAt: string; updatedAt: string }> }>('/api/admin/complaints'),
  
  updateComplaintStatus: (complaintId: string, status: string) => api(`/api/admin/complaint/${complaintId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  deleteComplaint: (complaintId: string) => api(`/api/admin/complaint/${complaintId}`, {
    method: 'DELETE',
  }),
};

export { ApiError };
