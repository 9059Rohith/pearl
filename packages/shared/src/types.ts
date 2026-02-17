export interface Page {
  id: string;
  title: string;
  slug: string;
  brandId: string;
  status: 'draft' | 'published' | 'archived';
  sections: Section[];
  theme?: PageTheme;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  type: 'hero' | 'content' | 'gallery' | 'testimonial' | 'cta' | 'form';
  title: string;
  content: Record<string, any>;
  order: number;
}

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerStyle: 'centered' | 'left-aligned' | 'full-width';
}

export interface Lead {
  id: string;
  pageId: string;
  brandId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  metadata: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  settings: Record<string, any>;
}

export interface CreatePageRequest {
  title: string;
  brandId: string;
  templateId?: string;
}

export interface UpdatePageRequest {
  title?: string;
  status?: Page['status'];
  theme?: Partial<PageTheme>;
}

export interface CreateLeadRequest {
  pageId: string;
  brandId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
