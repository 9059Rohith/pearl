'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { siteApi } from '@/lib/api';
import { SEOHead } from '@/components/SEOHead';
import { ContactForm } from '@/components/ContactForm';

export default function DeepDivePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    try {
      const pageData = await siteApi.getPageBySlug(slug);
      setPage(pageData);

      if (pageData.brandId) {
        const brandData = await siteApi.getBrand(pageData.brandId);
        setBrand(brandData);
      }
    } catch {
      // Page not found
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;
  if (!page) return <div style={{ padding: '48px', textAlign: 'center' }}><h1>Not Found</h1></div>;

  const theme = page.theme;
  const contentSections = page.sections.filter((s: any) => s.type === 'content');
  const testimonials = page.sections.filter((s: any) => s.type === 'testimonial');

  return (
    <>
      <SEOHead page={{ ...page, title: `${page.title} - Deep Dive` }} brand={brand} />

      {/* Hero */}
      <div style={{
        background: theme?.primaryColor || brand?.primaryColor || '#1a1a2e',
        color: '#fff',
        padding: '80px 32px',
        textAlign: 'center',
      }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem', opacity: 0.8 }}>Franchise Deep Dive</p>
        <h1 style={{ fontSize: '3rem', margin: '16px 0' }}>{page.title}</h1>
        {brand && <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>by {brand.name}</p>}
      </div>

      {/* Quick facts sidebar layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '48px', maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
        <div>
          {contentSections.map((section: any) => (
            <div key={section.id} style={{ marginBottom: '48px' }}>
              <h2>{section.title}</h2>
              {section.content.body && (
                <div dangerouslySetInnerHTML={{ __html: section.content.body }} style={{ lineHeight: 1.8 }} />
              )}
              {section.content.imageUrl && (
                <img src={section.content.imageUrl} alt={section.title} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '16px' }} />
              )}
            </div>
          ))}

          {testimonials.length > 0 && (
            <div style={{ borderTop: '1px solid #eee', paddingTop: '32px' }}>
              <h2>What Franchisees Say</h2>
              {testimonials.map((t: any) => (
                <blockquote key={t.id} style={{ borderLeft: `3px solid ${theme?.primaryColor || '#1a1a2e'}`, paddingLeft: '16px', margin: '24px 0', fontStyle: 'italic' }}>
                  <p>"{t.content.quote}"</p>
                  {t.content.author && <footer style={{ fontWeight: '600' }}>— {t.content.author}</footer>}
                </blockquote>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px' }}>Quick Facts</h3>
              <dl style={{ margin: 0 }}>
                {page.sections.find((s: any) => s.content?.investmentRange) && (
                  <>
                    <dt style={{ fontWeight: '600', marginTop: '8px' }}>Investment Range</dt>
                    <dd style={{ margin: '4px 0 0', color: '#666' }}>
                      {page.sections.find((s: any) => s.content?.investmentRange)?.content.investmentRange}
                    </dd>
                  </>
                )}
                {page.sections.find((s: any) => s.content?.franchiseFee) && (
                  <>
                    <dt style={{ fontWeight: '600', marginTop: '8px' }}>Franchise Fee</dt>
                    <dd style={{ margin: '4px 0 0', color: '#666' }}>
                      {page.sections.find((s: any) => s.content?.franchiseFee)?.content.franchiseFee}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            <ContactForm
              pageId={page.id}
              brandId={page.brandId}
              brandName={brand?.name}
              accentColor={theme?.primaryColor || brand?.primaryColor}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
