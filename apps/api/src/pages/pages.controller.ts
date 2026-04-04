import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Section } from '@publication/shared';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(
    @Query('brandId') brandId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pagesService.findAll(brandId, status, sortBy, limit ? parseInt(limit) : undefined);
  }

  @Get('search')
  search(@Query('q') q: string, @Query('brandId') brandId?: string) {
    return this.pagesService.searchPages(q || '', brandId);
  }

  @Get('dashboard')
  getDashboard(@Query('brandId') brandId?: string) {
    return this.pagesService.getDashboardStats(brandId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.pagesService.findById(id);
  }

  @Get(':id/export')
  exportPage(@Param('id') id: string) {
    return this.pagesService.exportPageData(id);
  }

  @Get(':id/leads')
  getPageLeads(@Param('id') id: string) {
    return this.pagesService.getLeads({ pageId: id });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreatePageDto) {
    const validation = this.pagesService.validatePageData(dto);
    if (!validation.valid) {
      return { error: validation.errors.join(', '), success: false };
    }
    return this.pagesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Put('bulk/status')
  bulkUpdateStatus(@Body() body: { pageIds: string[]; status: 'draft' | 'published' | 'archived' }) {
    return this.pagesService.bulkUpdateStatus(body.pageIds, body.status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.pagesService.delete(id);
  }

  // Section endpoints

  @Post(':id/sections')
  addSection(
    @Param('id') id: string,
    @Body() body: { type: Section['type']; title: string; content?: Record<string, any> },
  ) {
    return this.pagesService.addSection(id, body.type, body.title, body.content);
  }

  @Put(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.pagesService.updateSection(id, sectionId, dto);
  }

  @Put(':id/sections/:sectionId/autosave')
  autosaveSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() body: { content: Record<string, any> },
  ) {
    return this.pagesService.autosaveSectionContent(id, sectionId, body.content);
  }

  @Put(':id/sections/reorder')
  reorderSections(@Param('id') id: string, @Body() body: { sectionIds: string[] }) {
    return this.pagesService.reorderSections(id, body.sectionIds);
  }

  @Delete(':id/sections/:sectionId')
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return this.pagesService.removeSection(id, sectionId);
  }
}
