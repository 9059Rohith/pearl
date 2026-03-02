const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Pages
  getPages: (brandId?: string) =>
    request<any[]>(`/pages${brandId ? `?brandId=${brandId}` : ''}`),

  getPage: (id: string) =>
    request<any>(`/pages/${id}`),

  createPage: (data: { title: string; brandId: string; templateId?: string }) =>
    request<any>('/pages', { method: 'POST', body: JSON.stringify(data) }),

  updatePage: (id: string, data: any) =>
    request<any>(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePage: (id: string) =>
    request<void>(`/pages/${id}`, { method: 'DELETE' }),

  // Sections
  addSection: (pageId: string, data: { type: string; title: string; content?: any }) =>
    request<any>(`/pages/${pageId}/sections`, { method: 'POST', body: JSON.stringify(data) }),

  updateSection: (pageId: string, sectionId: string, data: any) =>
    request<any>(`/pages/${pageId}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removeSection: (pageId: string, sectionId: string) =>
    request<void>(`/pages/${pageId}/sections/${sectionId}`, { method: 'DELETE' }),

  // Brands
  getBrands: () => request<any[]>('/brands'),
  getBrand: (id: string) => request<any>(`/brands/${id}`),

  // Leads
  getLeads: (brandId?: string, pageId?: string) => {
    const params = new URLSearchParams();
    if (brandId) params.set('brandId', brandId);
    if (pageId) params.set('pageId', pageId);
    const qs = params.toString();
    return request<any[]>(`/leads${qs ? `?${qs}` : ''}`);
  },

  submitLead: (data: any) =>
    request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
};
