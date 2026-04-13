import { expect, test } from '@playwright/test';

test('admin creates page and site captures UTM lead', async ({ page, request }) => {
  const brandRes = await request.post('http://localhost:3001/brands', {
    data: {
      name: `Journey Brand ${Date.now()}`,
      contactEmail: 'owner@brand.test',
      primaryColor: '#1a1a2e',
      secondaryColor: '#f5f5f5',
    },
  });
  expect(brandRes.ok()).toBeTruthy();
  const brand = await brandRes.json();

  const pageTitle = `Journey Page ${Date.now()}`;

  await page.goto('http://localhost:3000/pages');
  await page.getByPlaceholder('Page title').fill(pageTitle);
  await page.getByPlaceholder('Brand ID').fill(brand.id);
  await page.getByRole('button', { name: 'Create Page' }).click();

  await page.getByRole('link', { name: pageTitle }).click();
  await page.getByRole('button', { name: '+ content' }).click();

  await page.getByText('New content section').first().click();
  await page.locator('textarea').first().fill('{"headline":"Admin Journey Headline"}');
  await page.getByRole('button', { name: 'Save' }).click();

  const pagesRes = await request.get(`http://localhost:3001/pages?brandId=${brand.id}`);
  expect(pagesRes.ok()).toBeTruthy();
  const pages = await pagesRes.json();
  const createdPage = pages.find((p: any) => p.title === pageTitle);
  expect(createdPage).toBeTruthy();

  await page.goto(`http://localhost:3002/${createdPage.slug}?utm_source=google&utm_medium=cpc&utm_campaign=qa`);
  await page.getByPlaceholder('Your Name *').fill('QA Lead');
  await page.getByPlaceholder('Email Address *').fill('qa.lead@example.com');
  await page.getByPlaceholder('Phone Number').fill('1234567890');
  await page.getByPlaceholder('Tell us about yourself and why you\'re interested...').fill('Interested from campaign');
  await page.getByRole('button', { name: 'Request Information' }).click();

  await expect(page.getByText('Thank You!')).toBeVisible();

  const leadsRes = await request.get(`http://localhost:3001/leads?pageId=${createdPage.id}`);
  expect(leadsRes.ok()).toBeTruthy();
  const leads = await leadsRes.json();
  expect(leads.length).toBeGreaterThan(0);

  const lastLead = leads[0];
  expect(lastLead.metadata.utm_source).toBe('google');
  expect(lastLead.metadata.utm_medium).toBe('cpc');
  expect(lastLead.metadata.utm_campaign).toBe('qa');
  expect(lastLead.notes).toBe('Interested from campaign');
  expect(lastLead.notes).not.toContain('Source:');

  await page.goto(`http://localhost:3000/pages/${createdPage.id}`);
  await page.getByRole('button', { name: /leads/i }).click();
  await expect(page.getByText('QA Lead')).toBeVisible();
});
