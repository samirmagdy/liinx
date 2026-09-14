import { CreatorProfile, ThemeConfig, ProfileBlock } from '../types';

const TOKEN_KEY = 'liinx_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    checkUsername: async (username: string): Promise<{ available: boolean; reason?: string }> => {
      return request<{ available: boolean; reason?: string }>(`/api/auth/check-username/${encodeURIComponent(username)}`);
    },
    register: async (email: string, password: string, username: string) => {
      const data = await request<{ token: string; user: any; profileId: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });
      authStorage.setToken(data.token);
      return data;
    },
    login: async (email: string, password: string) => {
      const data = await request<{ token: string; user: any; profileId: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      authStorage.setToken(data.token);
      return data;
    },
    me: async () => {
      return request<{ user: any; profile: CreatorProfile }>('/api/auth/me');
    },
    logout: () => {
      authStorage.removeToken();
    }
  },

  profiles: {
    getByUsername: async (username: string): Promise<CreatorProfile> => {
      return request<CreatorProfile>(`/api/profiles/${encodeURIComponent(username)}`);
    }
  },

  studio: {
    getProfile: async (): Promise<CreatorProfile> => {
      return request<CreatorProfile>('/api/studio/profile');
    },
    updateProfile: async (data: Partial<CreatorProfile>): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    updatePlan: async (plan: 'free' | 'pro' | 'studio'): Promise<{ success: boolean; plan: string; message: string }> => {
      return request<{ success: boolean; plan: string; message: string }>('/api/studio/plan', {
        method: 'PUT',
        body: JSON.stringify({ plan })
      });
    },
    createBlock: async (blockData: { type: string; title: string; [key: string]: any }): Promise<ProfileBlock> => {
      return request<ProfileBlock>('/api/studio/blocks', {
        method: 'POST',
        body: JSON.stringify(blockData)
      });
    },
    updateBlock: async (id: string, blockData: Record<string, any>): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/studio/blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(blockData)
      });
    },
    deleteBlock: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/studio/blocks/${id}`, {
        method: 'DELETE'
      });
    },
    reorderBlocks: async (blockIds: string[]): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/api/studio/blocks/reorder', {
        method: 'PUT',
        body: JSON.stringify({ blockIds })
      });
    },
    getAnalytics: async () => {
      return request<{
        totalViews: number;
        uniqueVisitors: number;
        totalClicks: number;
        ctr: string;
        topLinks: { id: string; title: string; url: string; clicks: number; percentage: number }[];
        dailyTimeline: { date: string; views: number; clicks: number }[];
        topReferrers: { referrer: string; count: number }[];
      }>('/api/analytics/stats');
    },
    getSubscribers: async () => {
      return request<{
        count: number;
        subscribers: { id: string; email: string; subscribedAt: string }[];
      }>('/api/studio/subscribers');
    },
    uploadImage: async (file: File): Promise<{ success: boolean; url: string }> => {
      const token = authStorage.getToken();
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      return data;
    }
  },

  analytics: {
    recordView: async (profileId: string, referrer?: string) => {
      return request<{ success: boolean }>('/api/analytics/view', {
        method: 'POST',
        body: JSON.stringify({ profileId, referrer: referrer || document.referrer || 'direct' })
      });
    }
  },

  newsletter: {
    subscribe: async (profileId: string, blockId: string | undefined, email: string) => {
      return request<{ success: boolean; message: string }>('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ profileId, blockId, email })
      });
    }
  }
};
