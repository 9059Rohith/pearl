import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Brand, Lead, Page, Section } from '@publication/shared';
import { createPage, createSection, generateSlug } from './page.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

const MAX_SECTIONS_PER_PAGE = 20;
const SLUG_MAX_LEN = 128;
const DEFAULT_THEME_PRIMARY = '#000000';
const DEFAULT_THEME_SECONDARY = '#ffffff';
const DEFAULT_FONT = 'system-ui';
const AUTOSAVE_THROTTLE_MS = 1500;
const ANALYTICS_BUFFER_SIZE = 50;

type PageStatus = 'draft' | 'published' | 'archived';

type PageDbRecord = {
  id: string;
  title: string;
  slug: string;
  brandId: string;
  status: string;
  sections: Prisma.JsonValue;
  theme: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type LeadDbRecord = {
  id: string;
  pageId: string;
  brandId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  metadata: Prisma.JsonValue;
  notes: string | null;
  createdAt: Date;
};

@Injectable()
export class PagesService {
  private pages: Map<string, Page> = new Map();
  private slugIndex: Map<string, string> = new Map();
  private slugRedirects: Map<string, string> = new Map();
  private _leads: Lead[] = [];
  private _brandCache: Map<string, Brand> = new Map();
  private _analyticsBuffer: Array<{ type: string; data: any; ts: number }> = [];
  private _analyticsTimer: any = null;
  private _autosaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private _lastSaveTimestamps: Map<string, number> = new Map();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private shouldUseDatabase(): boolean {
    return !!this.prisma && !!process.env.DATABASE_URL;
  }

  private _cloneData<T>(data: T): T {
    if (typeof structuredClone === 'function') {
      return structuredClone(data);
    }
    return JSON.parse(JSON.stringify(data));
  }

  private toPageRecord(raw: PageDbRecord): Page {
    return {
      id: raw.id,
      title: raw.title,
      slug: raw.slug,
      brandId: raw.brandId,
      status: raw.status as Page['status'],
      sections: Array.isArray(raw.sections) ? (raw.sections as unknown as Section[]) : [],
      theme:
        raw.theme && typeof raw.theme === 'object' && !Array.isArray(raw.theme)
          ? (raw.theme as unknown as Page['theme'])
          : undefined,
      createdAt: new Date(raw.createdAt).toISOString(),
      updatedAt: new Date(raw.updatedAt).toISOString(),
    };
  }

  private toLeadRecord(raw: LeadDbRecord): Lead {
    return {
      id: raw.id,
      pageId: raw.pageId,
      brandId: raw.brandId,
      name: raw.name,
      email: raw.email,
      phone: raw.phone || undefined,
      message: raw.message || undefined,
      metadata:
        raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
          ? (raw.metadata as Record<string, unknown>)
          : {},
      notes: raw.notes || undefined,
      createdAt: new Date(raw.createdAt).toISOString(),
    };
  }

  private mergeTheme(currentTheme: any, nextTheme: any) {
    return {
      primaryColor: nextTheme?.primaryColor || currentTheme?.primaryColor || DEFAULT_THEME_PRIMARY,
      secondaryColor: nextTheme?.secondaryColor || currentTheme?.secondaryColor || DEFAULT_THEME_SECONDARY,
      fontFamily: nextTheme?.fontFamily || currentTheme?.fontFamily || DEFAULT_FONT,
      headerStyle: nextTheme?.headerStyle || currentTheme?.headerStyle || 'centered',
    };
  }

  async findAll(brandId?: string, status?: string, sortBy?: string, limit?: number): Promise<Page[]> {
    if (this.shouldUseDatabase()) {
      const pages: PageDbRecord[] = await this.prisma!.page.findMany({
        where: {
          brandId: brandId || undefined,
          status: status || undefined,
        },
      });
      let output = pages.map((page) => this.toPageRecord(page));
      if (sortBy === 'title') {
        output = output.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'created') {
        output = output.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        output = output.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      return limit && limit > 0 ? output.slice(0, limit) : output;
    }

    let pages = Array.from(this.pages.values());
    if (brandId) pages = pages.filter((p) => p.brandId === brandId);
    if (status) pages = pages.filter((p) => p.status === status);

    if (sortBy === 'title') {
      pages.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'created') {
      pages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      pages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return limit && limit > 0 ? pages.slice(0, limit) : pages;
  }

  async findById(id: string): Promise<Page> {
    if (this.shouldUseDatabase()) {
      const page = await this.prisma!.page.findUnique({ where: { id } });
      if (!page) {
        throw new NotFoundException(`Page ${id} not found`);
      }
      return this.toPageRecord(page);
    }

    const page = this.pages.get(id);
    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    return page;
  }

  async findBySlug(slug: string): Promise<Page> {
    if (this.shouldUseDatabase()) {
      const redirectTarget = this.slugRedirects.get(slug);
      const effectiveSlug = redirectTarget || slug;
      const page = await this.prisma!.page.findUnique({ where: { slug: effectiveSlug } });
      if (!page) {
        throw new NotFoundException(`Page with slug "${slug}" not found`);
      }
      return this.toPageRecord(page);
    }

    const redirectTarget = this.slugRedirects.get(slug);
    if (redirectTarget) {
      const pageId = this.slugIndex.get(redirectTarget);
      if (pageId) return this.findById(pageId);
    }

    const pageId = this.slugIndex.get(slug);
    if (!pageId) throw new NotFoundException(`Page with slug "${slug}" not found`);
    return this.findById(pageId);
  }

  async create(dto: CreatePageDto): Promise<Page> {
    if (dto.templateId) {
      return this._cloneFromTemplate(dto.templateId, dto);
    }

    const slug = generateSlug(dto.title);
    if (slug.length > SLUG_MAX_LEN) {
      throw new ConflictException('Title too long for slug generation');
    }

    if (this.shouldUseDatabase()) {
      const existing = await this.prisma!.page.findUnique({ where: { slug } });
      if (existing) {
        throw new ConflictException(`Slug "${slug}" is already in use`);
      }

      const page = createPage(dto.title, dto.brandId);
      const created = await this.prisma!.page.create({
        data: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          brandId: page.brandId,
          status: page.status,
          sections: page.sections as any,
          theme: (page.theme || undefined) as any,
        },
      });
      this._trackEvent('page_created', { pageId: created.id, brandId: dto.brandId, slug: created.slug });
      return this.toPageRecord(created);
    }

    if (this.slugIndex.has(slug)) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }

    const page = createPage(dto.title, dto.brandId);
    this.pages.set(page.id, page);
    this.slugIndex.set(page.slug, page.id);
    this._trackEvent('page_created', { pageId: page.id, brandId: dto.brandId, slug: page.slug });
    return page;
  }

  async update(id: string, dto: UpdatePageDto): Promise<Page> {
    const page = await this.findById(id);
    let nextSlug = page.slug;

    if (dto.title && dto.title !== page.title) {
      const generatedSlug = generateSlug(dto.title);
      if (generatedSlug.length > SLUG_MAX_LEN) {
        throw new ConflictException('Title too long for slug generation');
      }

      if (this.shouldUseDatabase()) {
        const existingPage = await this.prisma!.page.findUnique({ where: { slug: generatedSlug } });
        if (existingPage && existingPage.id !== id) {
          throw new ConflictException(`Slug "${generatedSlug}" is already in use`);
        }
      } else {
        const existingPageId = this.slugIndex.get(generatedSlug);
        if (existingPageId && existingPageId !== id) {
          throw new ConflictException(`Slug "${generatedSlug}" is already in use`);
        }
      }

      if (page.slug !== generatedSlug) {
        this.slugRedirects.set(page.slug, generatedSlug);
      }
      nextSlug = generatedSlug;
    }

    const updatedTheme = dto.theme ? this.mergeTheme(page.theme, dto.theme) : page.theme;

    if (this.shouldUseDatabase()) {
      const updated = await this.prisma!.page.update({
        where: { id },
        data: {
          title: dto.title ?? page.title,
          slug: nextSlug,
          status: dto.status ?? page.status,
          theme: updatedTheme || undefined,
          updatedAt: new Date(),
        },
      });

      if (dto.status === 'published' && page.status !== 'published') {
        this._trackEvent('page_published', { pageId: id, slug: nextSlug });
      }

      this._trackEvent('page_updated', { pageId: id });
      return this.toPageRecord(updated);
    }

    if (dto.title && dto.title !== page.title) {
      this.slugIndex.delete(page.slug);
      this.slugIndex.set(nextSlug, id);
      page.title = dto.title;
      page.slug = nextSlug;
    }

    if (dto.status) {
      const previousStatus = page.status;
      page.status = dto.status;
      if (dto.status === 'published' && previousStatus !== 'published') {
        this._trackEvent('page_published', { pageId: id, slug: page.slug });
      }
    }

    if (dto.theme) {
      page.theme = updatedTheme;
    }

    page.updatedAt = new Date().toISOString();
    this._trackEvent('page_updated', { pageId: id });
    return page;
  }

  async delete(id: string): Promise<void> {
    const page = await this.findById(id);

    if (this.shouldUseDatabase()) {
      await this.prisma!.page.delete({ where: { id } });
      this._trackEvent('page_deleted', { pageId: id, slug: page.slug });
      return;
    }

    this.slugIndex.delete(page.slug);
    this.pages.delete(id);
    this._trackEvent('page_deleted', { pageId: id, slug: page.slug });
  }

  async addSection(pageId: string, type: Section['type'], title: string, content: Record<string, any> = {}): Promise<Section> {
    const page = await this.findById(pageId);
    if (page.sections.length >= MAX_SECTIONS_PER_PAGE) {
      throw new ConflictException(`Maximum ${MAX_SECTIONS_PER_PAGE} sections per page`);
    }

    const section = createSection(type, title, content, page.sections.length);
    const sections = [...page.sections, section];

    if (this.shouldUseDatabase()) {
      await this.prisma!.page.update({
        where: { id: pageId },
        data: {
          sections: sections as any,
          updatedAt: new Date(),
        },
      });
      return section;
    }

    page.sections = sections;
    page.updatedAt = new Date().toISOString();
    return section;
  }

  async updateSection(pageId: string, sectionId: string, dto: UpdateSectionDto): Promise<Section> {
    const page = await this.findById(pageId);
    const sectionIndex = page.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const section = page.sections[sectionIndex];
    const updatedSection: Section = {
      ...section,
      title: dto.title !== undefined ? dto.title : section.title,
      content: dto.content !== undefined
        ? { ...section.content, ...this._cloneData(dto.content) }
        : section.content,
      order: dto.order !== undefined ? dto.order : section.order,
    };

    const updatedSections = [...page.sections];
    updatedSections[sectionIndex] = updatedSection;

    if (this.shouldUseDatabase()) {
      await this.prisma!.page.update({
        where: { id: pageId },
        data: {
          sections: updatedSections as any,
          updatedAt: new Date(),
        },
      });
      return updatedSection;
    }

    page.sections = updatedSections;
    page.updatedAt = new Date().toISOString();
    return updatedSection;
  }

  async removeSection(pageId: string, sectionId: string): Promise<void> {
    const page = await this.findById(pageId);
    const index = page.sections.findIndex((s) => s.id === sectionId);
    if (index === -1) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const sections = page.sections.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }));

    if (this.shouldUseDatabase()) {
      await this.prisma!.page.update({
        where: { id: pageId },
        data: { sections, updatedAt: new Date() },
      });
      return;
    }

    page.sections = sections;
    page.updatedAt = new Date().toISOString();
  }

  async reorderSections(pageId: string, sectionIds: string[]): Promise<Section[]> {
    const page = await this.findById(pageId);
    const reordered: Section[] = [];

    for (let i = 0; i < sectionIds.length; i++) {
      const section = page.sections.find((s) => s.id === sectionIds[i]);
      if (section) {
        reordered.push({ ...section, order: i });
      }
    }

    for (const section of page.sections) {
      if (!sectionIds.includes(section.id)) {
        reordered.push({ ...section, order: reordered.length });
      }
    }

    if (this.shouldUseDatabase()) {
      await this.prisma!.page.update({
        where: { id: pageId },
        data: { sections: reordered as any, updatedAt: new Date() },
      });
      return reordered;
    }

    page.sections = reordered;
    page.updatedAt = new Date().toISOString();
    return reordered;
  }

  private async _cloneFromTemplate(templateId: string, dto: CreatePageDto): Promise<Page> {
    const template = await this.findById(templateId);
    const slug = generateSlug(dto.title);

    if (this.shouldUseDatabase()) {
      const existing = await this.prisma!.page.findUnique({ where: { slug } });
      if (existing) {
        throw new ConflictException(`Slug "${slug}" is already in use`);
      }

      const created = await this.prisma!.page.create({
        data: {
          id: uuid(),
          title: dto.title,
          slug,
          brandId: dto.brandId,
          status: 'draft',
          sections: template.sections.map((section) => ({
            ...section,
            id: uuid(),
            content: this._cloneData(section.content),
          })),
          theme: template.theme ? { ...template.theme } : undefined,
        },
      });

      this._trackEvent('page_cloned', { templateId, newPageId: created.id });
      return this.toPageRecord(created);
    }

    if (this.slugIndex.has(slug)) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }

    const page: Page = {
      ...template,
      id: uuid(),
      title: dto.title,
      slug,
      brandId: dto.brandId,
      status: 'draft',
      sections: template.sections.map((section) => ({
        ...section,
        id: uuid(),
        content: this._cloneData(section.content),
      })),
      theme: template.theme ? { ...template.theme } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pages.set(page.id, page);
    this.slugIndex.set(page.slug, page.id);
    this._trackEvent('page_cloned', { templateId, newPageId: page.id });
    return page;
  }

  async submitLead(data: any, queryParams: Record<string, string> = {}): Promise<Lead> {
    const page = await this.findById(data.pageId);

    const utmParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (key.startsWith('utm_')) {
        utmParams[key] = value;
      }
    }

    const leadPayload: Lead = {
      id: uuid(),
      pageId: page.id,
      brandId: data.brandId,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      message: data.message || undefined,
      metadata: { ...data.metadata, ...utmParams },
      notes: data.message || undefined,
      createdAt: new Date().toISOString(),
    };

    if (this.shouldUseDatabase()) {
      const created = await this.prisma!.lead.create({
        data: {
          id: leadPayload.id,
          pageId: leadPayload.pageId,
          brandId: leadPayload.brandId,
          name: leadPayload.name,
          email: leadPayload.email,
          phone: leadPayload.phone,
          message: leadPayload.message,
          metadata: leadPayload.metadata,
          notes: leadPayload.notes,
          createdAt: new Date(leadPayload.createdAt),
        },
      });
      this._trackEvent('lead_submitted', {
        leadId: created.id,
        pageId: created.pageId,
        brandId: created.brandId,
        hasUtm: Object.keys(utmParams).length > 0,
      });
      return this.toLeadRecord(created);
    }

    this._leads.push(leadPayload);
    this._trackEvent('lead_submitted', {
      leadId: leadPayload.id,
      pageId: leadPayload.pageId,
      brandId: leadPayload.brandId,
      hasUtm: Object.keys(utmParams).length > 0,
    });
    return leadPayload;
  }

  async getLeads(filters: { brandId?: string; pageId?: string; startDate?: string; endDate?: string } = {}): Promise<Lead[]> {
    if (this.shouldUseDatabase()) {
      const leads: LeadDbRecord[] = await this.prisma!.lead.findMany({
        where: {
          brandId: filters.brandId || undefined,
          pageId: filters.pageId || undefined,
          createdAt: {
            gte: filters.startDate ? new Date(filters.startDate) : undefined,
            lte: filters.endDate ? new Date(filters.endDate) : undefined,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return leads.map((lead) => this.toLeadRecord(lead));
    }

    let results = [...this._leads];
    if (filters.brandId) results = results.filter((l) => l.brandId === filters.brandId);
    if (filters.pageId) results = results.filter((l) => l.pageId === filters.pageId);
    if (filters.startDate) results = results.filter((l) => new Date(l.createdAt) >= new Date(filters.startDate!));
    if (filters.endDate) results = results.filter((l) => new Date(l.createdAt) <= new Date(filters.endDate!));
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLeadById(leadId: string): Promise<Lead> {
    if (this.shouldUseDatabase()) {
      const lead = await this.prisma!.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }
      return this.toLeadRecord(lead);
    }

    const lead = this._leads.find((l) => l.id === leadId);
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found`);
    return lead;
  }

  async getLeadStats(brandId: string): Promise<{ total: number; thisWeek: number; thisMonth: number; byPage: Record<string, number> }> {
    const leads = await this.getLeads({ brandId });
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const byPage: Record<string, number> = {};
    for (const lead of leads) {
      byPage[lead.pageId] = (byPage[lead.pageId] || 0) + 1;
    }

    return {
      total: leads.length,
      thisWeek: leads.filter((l) => new Date(l.createdAt) >= weekAgo).length,
      thisMonth: leads.filter((l) => new Date(l.createdAt) >= monthAgo).length,
      byPage,
    };
  }

  registerBrand(brand: Brand) {
    this._brandCache.set(brand.id, brand);
  }

  getBrandFromCache(brandId: string): Brand | undefined {
    return this._brandCache.get(brandId);
  }

  private _trackEvent(type: string, data: any) {
    this._analyticsBuffer.push({ type, data: { ...data, timestamp: new Date().toISOString() }, ts: Date.now() });
    if (this._analyticsBuffer.length >= ANALYTICS_BUFFER_SIZE) {
      this._analyticsBuffer = [];
      return;
    }

    if (!this._analyticsTimer) {
      this._analyticsTimer = setTimeout(() => {
        this._analyticsBuffer = [];
        this._analyticsTimer = null;
      }, 30000);
      if (typeof this._analyticsTimer.unref === 'function') {
        this._analyticsTimer.unref();
      }
    }
  }

  async autosaveSectionContent(pageId: string, sectionId: string, content: Record<string, any>): Promise<{ saved: boolean; throttled: boolean }> {
    const key = `${pageId}:${sectionId}`;
    const now = Date.now();
    const lastSave = this._lastSaveTimestamps.get(key) || 0;

    if (now - lastSave < AUTOSAVE_THROTTLE_MS) {
      if (this._autosaveTimers.has(key)) {
        clearTimeout(this._autosaveTimers.get(key)!);
      }

      this._autosaveTimers.set(key, setTimeout(async () => {
        await this.updateSection(pageId, sectionId, { content });
        this._lastSaveTimestamps.set(key, Date.now());
        this._autosaveTimers.delete(key);
      }, AUTOSAVE_THROTTLE_MS));

      return { saved: false, throttled: true };
    }

    await this.updateSection(pageId, sectionId, { content });
    this._lastSaveTimestamps.set(key, now);
    return { saved: true, throttled: false };
  }

  async bulkUpdateStatus(pageIds: string[], status: PageStatus): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const id of pageIds) {
      try {
        await this.update(id, { status });
        updated++;
      } catch {
        failed.push(id);
      }
    }

    return { updated, failed };
  }

  async getPageWithLeadCount(id: string): Promise<Page & { leadCount: number }> {
    const page = await this.findById(id);
    const leads = await this.getLeads({ pageId: id });
    return { ...page, leadCount: leads.length };
  }

  async getDashboardStats(brandId?: string): Promise<{
    totalPages: number;
    publishedPages: number;
    draftPages: number;
    totalLeads: number;
    leadsThisWeek: number;
    topPages: Array<{ pageId: string; title: string; leads: number }>;
  }> {
    const pages = await this.findAll(brandId);
    const leads = await this.getLeads({ brandId });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const leadsByPage: Record<string, number> = {};
    for (const lead of leads) {
      leadsByPage[lead.pageId] = (leadsByPage[lead.pageId] || 0) + 1;
    }

    const topPages = Object.entries(leadsByPage)
      .map(([pageId, count]) => {
        const page = pages.find((p) => p.id === pageId);
        return { pageId, title: page?.title || 'Deleted Page', leads: count };
      })
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5);

    return {
      totalPages: pages.length,
      publishedPages: pages.filter((p) => p.status === 'published').length,
      draftPages: pages.filter((p) => p.status === 'draft').length,
      totalLeads: leads.length,
      leadsThisWeek: leads.filter((l) => new Date(l.createdAt) >= weekAgo).length,
      topPages,
    };
  }

  async searchPages(query: string, brandId?: string): Promise<Page[]> {
    const q = query.toLowerCase();
    const pages = await this.findAll(brandId);
    return pages.filter((page) => {
      if (page.title.toLowerCase().includes(q)) return true;
      if (page.slug.includes(q)) return true;
      for (const section of page.sections) {
        if (section.title.toLowerCase().includes(q)) return true;
        if (JSON.stringify(section.content).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }

  validatePageData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (data.title && data.title.length > 200) {
      errors.push('Title must be under 200 characters');
    }
    if (!data.brandId || typeof data.brandId !== 'string') {
      errors.push('Brand ID is required');
    }
    if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
      errors.push('Invalid status');
    }
    return { valid: errors.length === 0, errors };
  }

  async exportPageData(id: string): Promise<any> {
    const page = await this.findById(id);
    const leads = await this.getLeads({ pageId: id });

    let brand: Brand | null = null;
    if (this.shouldUseDatabase()) {
      const dbBrand = await this.prisma!.brand.findUnique({ where: { id: page.brandId } });
      if (dbBrand) {
        brand = {
          id: dbBrand.id,
          name: dbBrand.name,
          slug: dbBrand.slug,
          logoUrl: dbBrand.logoUrl || undefined,
          primaryColor: dbBrand.primaryColor,
          secondaryColor: dbBrand.secondaryColor,
          contactEmail: dbBrand.contactEmail,
          settings: dbBrand.settings as Record<string, any>,
        };
      }
    } else {
      brand = this._brandCache.get(page.brandId) || null;
    }

    return {
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        sections: page.sections,
        theme: page.theme,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
      brand: brand ? { name: brand.name, slug: brand.slug } : null,
      leads: leads.map((lead) => ({
        name: lead.name,
        email: lead.email,
        createdAt: lead.createdAt,
        metadata: lead.metadata,
      })),
      exportedAt: new Date().toISOString(),
    };
  }
}
