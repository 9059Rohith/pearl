import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Publication API (e2e)', () => {
  let app: INestApplication;
  let brandId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    brandId = `brand-e2e-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/brands')
      .send({
        name: `Brand ${brandId}`,
        contactEmail: `${brandId}@example.com`,
      })
      .expect(201);

    const brandsRes = await request(app.getHttpServer()).get('/brands').expect(200);
    const match = brandsRes.body.find((b: any) => b.name === `Brand ${brandId}`);
    brandId = match.id;
  });

  it('prevents section edits on a clone from mutating the template', async () => {
    const templateRes = await request(app.getHttpServer())
      .post('/pages')
      .send({ title: 'E2E Template', brandId })
      .expect(201);

    const templateId = templateRes.body.id as string;

    const templateSectionRes = await request(app.getHttpServer())
      .post(`/pages/${templateId}/sections`)
      .send({
        type: 'hero',
        title: 'Hero',
        content: { headline: 'Template headline' },
      })
      .expect(201);

    const templateSectionId = templateSectionRes.body.id as string;

    const cloneRes = await request(app.getHttpServer())
      .post('/pages')
      .send({ title: 'E2E Clone', brandId, templateId })
      .expect(201);

    const cloneId = cloneRes.body.id as string;
    const cloneSectionId = cloneRes.body.sections[0].id as string;

    expect(cloneSectionId).not.toBe(templateSectionId);

    await request(app.getHttpServer())
      .put(`/pages/${cloneId}/sections/${cloneSectionId}`)
      .send({ content: { headline: 'Clone headline' } })
      .expect(200);

    const templateAfter = await request(app.getHttpServer())
      .get(`/pages/${templateId}`)
      .expect(200);

    const cloneAfter = await request(app.getHttpServer())
      .get(`/pages/${cloneId}`)
      .expect(200);

    expect(templateAfter.body.sections[0].content.headline).toBe('Template headline');
    expect(cloneAfter.body.sections[0].content.headline).toBe('Clone headline');
  });

  it('captures UTM parameters in metadata and excludes them from notes', async () => {
    const pageRes = await request(app.getHttpServer())
      .post('/pages')
      .send({ title: 'UTM Landing', brandId })
      .expect(201);

    const pageId = pageRes.body.id as string;

    const leadRes = await request(app.getHttpServer())
      .post('/leads?utm_source=google&utm_medium=cpc&utm_campaign=q2')
      .send({
        pageId,
        brandId,
        name: 'E2E Lead',
        email: 'lead@example.com',
        message: 'Hello from campaign',
      })
      .expect(201);

    expect(leadRes.body.metadata.utm_source).toBe('google');
    expect(leadRes.body.metadata.utm_medium).toBe('cpc');
    expect(leadRes.body.metadata.utm_campaign).toBe('q2');
    expect(leadRes.body.notes).toBe('Hello from campaign');
    expect(leadRes.body.notes).not.toContain('utm_');
    expect(leadRes.body.notes).not.toContain('Source:');
  });
});
