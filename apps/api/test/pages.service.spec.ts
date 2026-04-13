import { PagesService } from '../src/pages/pages.service';

describe('PagesService (unit)', () => {
  let service: PagesService;

  beforeEach(() => {
    service = new PagesService();
  });

  it('clones template sections with independent references', async () => {
    const template = await service.create({ title: 'Template Page', brandId: 'brand-1' });
    const templateSection = await service.addSection(template.id, 'hero', 'Hero', {
      headline: 'Original headline',
      cta: { text: 'Learn More' },
    });

    const clone = await service.create({
      title: 'Cloned Page',
      brandId: 'brand-1',
      templateId: template.id,
    });

    expect(clone.sections).toHaveLength(1);
    expect(clone.sections[0].id).not.toBe(templateSection.id);

    await service.updateSection(clone.id, clone.sections[0].id, {
      content: {
        headline: 'Updated headline',
        cta: { text: 'Contact Us' },
      },
    });

    const originalAfter = await service.findById(template.id);
    const cloneAfter = await service.findById(clone.id);

    expect(originalAfter.sections[0].content.headline).toBe('Original headline');
    expect((originalAfter.sections[0].content.cta as { text: string }).text).toBe('Learn More');

    expect(cloneAfter.sections[0].content.headline).toBe('Updated headline');
    expect((cloneAfter.sections[0].content.cta as { text: string }).text).toBe('Contact Us');
  });

  it('stores UTM params in metadata without exposing them in notes', async () => {
    const page = await service.create({ title: 'Landing', brandId: 'brand-1' });

    const lead = await service.submitLead(
      {
        pageId: page.id,
        brandId: 'brand-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Interested in learning more',
        metadata: { source: 'contact-form' },
      },
      {
        utm_source: 'google',
        utm_medium: 'cpc',
      },
    );

    expect(lead.metadata.utm_source).toBe('google');
    expect(lead.metadata.utm_medium).toBe('cpc');
    expect(lead.notes).toBe('Interested in learning more');
    expect(lead.notes).not.toContain('utm_source');
    expect(lead.notes).not.toContain('Source:');
  });
});
