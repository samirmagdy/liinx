import { CreatorProfile, CreatorPage, ThemeConfig, ProfileBlock } from '../types';
import { friendlyErrorMessage } from '../utils/errors';

let sessionToken: string | null = null;

export const authStorage = {
  getToken: () => sessionToken,
  setToken: (token: string) => { sessionToken = token; },
  removeToken: () => { sessionToken = null; }
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, credentials: 'include', signal: options.signal || controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw Object.assign(new Error('The request timed out. Please try again.'), { status: 408 });
    throw new Error('Network error. Check your connection and try again.');
  } finally {
    globalThis.clearTimeout(timeout);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok || data === null) {
    const errorMsg = data?.error || (!isJson ? `Backend unreachable or returned non-JSON response (${res.status})` : `HTTP error ${res.status}`);
    throw Object.assign(new Error(friendlyErrorMessage({ message: errorMsg, status: res.status }, 'Request failed. Please try again.')), { status: res.status });
  }

  return data as T;
}

export const api = {
  contact: (data: { name: string; email: string; message: string }) => request<{ success: boolean; id: string }>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
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
      void request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => {});
      authStorage.removeToken();
    }
  },

  profiles: {
    getByUsername: async (username: string, pageSlug?: string): Promise<CreatorProfile> => {
      const query = pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : '';
      return request<CreatorProfile>(`/api/profiles/${encodeURIComponent(username)}${query}`);
    },
    getByCustomDomain: async (domain: string, pageSlug?: string): Promise<CreatorProfile> => {
      const query = pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : '';
      return request<CreatorProfile>(`/api/profiles/by-domain/${encodeURIComponent(domain)}${query}`);
    }
  },

  studio: {
    getProfile: async (): Promise<CreatorProfile> => {
      return request<CreatorProfile>('/api/studio/profile');
    },
    getPages: async (): Promise<{ pages: CreatorPage[] }> => request<{ pages: CreatorPage[] }>('/api/studio/pages'),
    createPage: async (data: { slug: string; title: string; description?: string; published?: boolean }): Promise<{ page: CreatorPage }> => request<{ page: CreatorPage }>('/api/studio/pages', { method: 'POST', body: JSON.stringify(data) }),
    updatePage: async (id: string, data: Partial<CreatorPage>): Promise<{ success: boolean; revision?: number }> => request<{ success: boolean; revision?: number }>(`/api/studio/pages/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePage: async (id: string): Promise<{ success: boolean }> => request<{ success: boolean }>(`/api/studio/pages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    reorderPages: async (pageIds: string[]): Promise<{ success: boolean; pages?: CreatorPage[] }> => request<{ success: boolean; pages?: CreatorPage[] }>('/api/studio/pages/reorder', { method: 'PUT', body: JSON.stringify({ pageIds }) }),
    updateProfile: async (data: Partial<CreatorProfile>): Promise<{ success: boolean; revision?: number; token?: string }> => {
      return request<{ success: boolean; revision?: number; token?: string }>('/api/studio/profile', {
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
    updateBlock: async (id: string, blockData: Record<string, any>): Promise<{ success: boolean; revision?: number }> => {
      return request<{ success: boolean; revision?: number }>(`/api/studio/blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(blockData)
      });
    },
    deleteBlock: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/studio/blocks/${id}`, {
        method: 'DELETE'
      });
    },
    moveBlock: async (id: string, pageId: string): Promise<{ success: boolean; block: { id: string; pageId: string; position?: number } }> => request<{ success: boolean; block: { id: string; pageId: string; position?: number } }>(`/api/studio/blocks/${id}/move`, { method: 'PUT', body: JSON.stringify({ pageId }) }),
    duplicateBlock: async (id: string, pageId: string): Promise<{ success: boolean; block: ProfileBlock }> => request<{ success: boolean; block: ProfileBlock }>(`/api/studio/blocks/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ pageId }) }),
    reorderBlocks: async (blockIds: string[], pageId?: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/api/studio/blocks/reorder', {
        method: 'PUT',
        body: JSON.stringify({ blockIds, pageId })
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
        topUtmCampaigns: { source: string; medium: string; campaign: string; count: number }[];
      }>('/api/analytics/stats');
    },
    getSubscribers: async () => {
      return request<{
        count: number;
        subscribers: { id: string; email: string; subscribedAt: string }[];
      }>('/api/studio/subscribers');
    },
    deleteSubscriber: async (id: string) => {
      return request<{ success: boolean }>(`/api/studio/subscribers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    uploadImage: async (file: File): Promise<{ success: boolean; url: string }> => {
      const token = authStorage.getToken();
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      return data;
    },
    uploadFile: async (file: File): Promise<{ success: boolean; url: string; originalName: string; size: number; mimeType: string }> => {
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', body: form, credentials: 'include', headers: authStorage.getToken() ? { Authorization: `Bearer ${authStorage.getToken()}` } : undefined });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw Object.assign(new Error(data?.error || 'File upload failed'), { status: response.status });
      return data;
    },
    deleteUploadedFile: async (url: string) => request<{ success: boolean }>('/api/upload/file', { method: 'DELETE', body: JSON.stringify({ url }) }),
    getProfiles: async () => {
      return request<{
        profiles: { id: string; username: string; displayName: string; avatarUrl: string; plan: string; category: string }[];
        activeProfileId: string;
      }>('/api/studio/profiles');
    },
    createProfile: async (data: { username: string; displayName: string; duplicateProfileId?: string }) => {
      return request<{
        success: boolean;
        profile: { id: string; username: string; displayName: string; plan: string };
        token: string;
      }>('/api/studio/profiles', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    deleteProfile: async (profileId: string) => request<{ success: boolean; message: string }>(`/api/studio/profiles/${profileId}`, { method: 'DELETE' }),
    selectProfile: async (profileId: string) => {
      return request<{
        success: boolean;
        token: string;
        profile: { id: string; username: string; displayName: string; plan: string };
      }>(`/api/studio/profiles/${profileId}/select`, {
        method: 'POST'
      });
    },
    getFormSubmissions: async (options: { page?: number; pageSize?: number; blockId?: string } = {}) => {
      const query = new URLSearchParams({ page: String(options.page || 1), pageSize: String(options.pageSize || 25) });
      if (options.blockId) query.set('blockId', options.blockId);
      return request<{ submissions: { id: string; blockId: string; formTitle: string; fieldLabels: Record<string, string>; fields: Record<string, string>; createdAt: number }[]; page: number; pageSize: number; total: number; hasMore: boolean; limited: boolean }>(`/api/studio/form-submissions?${query}`);
    },
    exportFormSubmissions: async (blockId?: string) => {
      const query = blockId ? `?blockId=${encodeURIComponent(blockId)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/studio/form-submissions/export${query}`, { credentials: 'include', headers: authStorage.getToken() ? { Authorization: `Bearer ${authStorage.getToken()}` } : undefined });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to export form responses.');
      return response.blob();
    },
    deleteFormSubmission: async (id: string) => request<{ success: boolean }>(`/api/studio/form-submissions/${id}`, { method: 'DELETE' }),
    verifyCustomDomain: async (domain: string) => {
      return request<{
        domain: string;
        verified: boolean;
        expectedTarget: string;
        cnameRecords: string[];
        message: string;
      }>('/api/studio/custom-domain/verify', {
        method: 'POST',
        body: JSON.stringify({ domain })
      });
    },
    getApiKeys: async () => {
      return request<{
        keys: { id: string; prefix: string; name: string; createdAt: number }[];
      }>('/api/studio/api-keys');
    },
    createApiKey: async (name: string) => {
      return request<{
        success: boolean;
        key: { id: string; name: string; prefix: string; createdAt: number };
        apiKey: string;
        warning: string;
      }>('/api/studio/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    },
    revokeApiKey: async (keyId: string) => {
      return request<{ success: boolean; message: string }>(`/api/studio/api-keys/${keyId}`, {
        method: 'DELETE'
      });
    }
  },

  analytics: {
    recordView: async (profileId: string, referrer?: string) => {
      let utmSource: string | undefined;
      let utmMedium: string | undefined;
      let utmCampaign: string | undefined;

      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        utmSource = searchParams.get('utm_source') || undefined;
        utmMedium = searchParams.get('utm_medium') || undefined;
        utmCampaign = searchParams.get('utm_campaign') || undefined;
      }

      return request<{ success: boolean }>('/api/analytics/view', {
        method: 'POST',
        body: JSON.stringify({ 
          profileId, 
          referrer: referrer || (typeof document !== 'undefined' ? document.referrer : '') || 'direct',
          utmSource,
          utmMedium,
          utmCampaign
        })
      });
    }
  },

  newsletter: {
    subscribe: async (profileId: string, blockId: string | undefined, email: string, consent = true) => {
      return request<{ success: boolean; message: string; unsubscribeUrl?: string }>('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ profileId, blockId, email, consent })
      });
    }
  },

  instagram: {
    getStatus: async () => {
      return request<{
        connected: boolean;
        configured: boolean;
        username?: string;
        autoSyncEnabled?: boolean;
        lastSyncedAt?: number;
        syncedLinksCount?: number;
      }>('/api/integrations/instagram/status');
    },
    getAuthUrl: async () => {
      return request<{ authUrl: string }>('/api/integrations/instagram/auth-url');
    },
    syncNow: async () => {
      return request<{
        success: boolean;
        message: string;
        mediaProcessed: number;
        linksCreated: { id: string; title: string; url: string }[];
      }>('/api/integrations/instagram/sync', {
        method: 'POST'
      });
    },
    testCaption: async (caption: string, saveToProfile = false) => {
      return request<{
        success: boolean;
        extracted: { url: string; title: string; snippet?: string }[];
        savedCount: number;
        blocks?: { id: string; title: string; url: string }[];
      }>('/api/integrations/instagram/test-caption', {
        method: 'POST',
        body: JSON.stringify({ caption, saveToProfile })
      });
    },
    toggleAutoSync: async (enabled: boolean) => {
      return request<{ success: boolean; autoSyncEnabled: boolean }>('/api/integrations/instagram/toggle-auto', {
        method: 'POST',
        body: JSON.stringify({ enabled })
      });
    },
    disconnect: async () => {
      return request<{ success: boolean; message: string }>('/api/integrations/instagram/disconnect', {
        method: 'POST'
      });
    }
  },

  importer: {
    preview: async (url: string) => {
      return request<{
        success: boolean;
        data: {
          sourceUrl: string;
          provider: 'linktree' | 'beacons' | 'biofm' | 'generic';
          displayName?: string;
          bio?: string;
          avatarUrl?: string;
          links: { title: string; url: string; subtitle?: string }[];
          socials: { platform: string; url: string }[];
        };
      }>('/api/studio/import/preview', {
        method: 'POST',
        body: JSON.stringify({ url })
      });
    },
    commit: async (payload: {
      links: { title: string; url: string; subtitle?: string }[];
      updateProfileInfo?: boolean;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
    }) => {
      return request<{ success: boolean; count: number; message: string }>('/api/studio/import/commit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  billing: {
    getStatus: async () => {
      return request<{
        configured: boolean;
        plan: string;
        hasStripeCustomer: boolean;
        hasActiveSubscription: boolean;
      }>('/api/billing/status');
    },
    createCheckoutSession: async (plan: 'pro' | 'studio', interval: 'month' | 'year' = 'month') => {
      return request<{ url: string; sessionId: string }>('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ plan, interval })
      });
    },
    createPortalSession: async () => {
      return request<{ url: string }>('/api/billing/create-portal-session', {
        method: 'POST'
      });
    }
  }
};
