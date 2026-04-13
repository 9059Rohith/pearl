import { Test } from '@nestjs/testing';
import { LeadsController } from '../src/leads/leads.controller';
import { PagesService } from '../src/pages/pages.service';

describe('LeadsController (integration)', () => {
  let controller: LeadsController;
  let pagesService: PagesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [PagesService],
    }).compile();

    controller = moduleRef.get(LeadsController);
    pagesService = moduleRef.get(PagesService);
  });

  it('passes query UTM params and keeps them out of notes', async () => {
    const page = await pagesService.create({ title: 'Integration Page', brandId: 'brand-1' });

    const lead = await controller.create(
      {
        pageId: page.id,
        brandId: 'brand-1',
        name: 'Integration Tester',
        email: 'integration@example.com',
        message: 'Please reach out',
      },
      {
        query: {
          utm_source: 'newsletter',
          utm_campaign: 'spring-launch',
        },
      } as any,
    );

    expect(lead.metadata.utm_source).toBe('newsletter');
    expect(lead.metadata.utm_campaign).toBe('spring-launch');
    expect(lead.notes).toBe('Please reach out');
    expect(lead.notes).not.toContain('Source:');
  });
});
