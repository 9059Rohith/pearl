'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { SectionEditor } from '@/components/SectionEditor';
import { PageSettings } from '@/components/PageSettings';

export default function PageEditor() {
  const params = useParams();
  const pageId = params.id as string;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'settings'>('sections');

  useEffect(() => {
    loadPage();
  }, [pageId]);

  async function loadPage() {
    try {
      const data = await api.getPage(pageId);
      setPage(data);
    } catch (err) {
      console.error('Failed to load page:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSection(type: string) {
    await api.addSection(pageId, { type, title: `New ${type} section` });
    loadPage();
  }

  if (loading) return <p>Loading...</p>;
  if (!page) return <p>Page not found.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{page.title}</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>/{page.slug}</p>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          background: page.status === 'published' ? '#d4edda' : '#fff3cd',
        }}>
          {page.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #eee', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('sections')}
          style={{ padding: '8px 16px', border: 'none', borderBottom: activeTab === 'sections' ? '2px solid #1a1a2e' : '2px solid transparent', background: 'none', cursor: 'pointer' }}
        >
          Sections
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{ padding: '8px 16px', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid #1a1a2e' : '2px solid transparent', background: 'none', cursor: 'pointer' }}
        >
          Settings
        </button>
      </div>

      {activeTab === 'sections' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            {['hero', 'content', 'gallery', 'testimonial', 'cta', 'form'].map((type) => (
              <button
                key={type}
                onClick={() => handleAddSection(type)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f8f9fa', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + {type}
              </button>
            ))}
          </div>

          {page.sections.map((section: any) => (
            <SectionEditor
              key={section.id}
              pageId={pageId}
              section={section}
              onUpdate={loadPage}
            />
          ))}

          {page.sections.length === 0 && (
            <p style={{ color: '#666' }}>No sections yet. Add one using the buttons above.</p>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <PageSettings page={page} onUpdate={loadPage} />
      )}
    </div>
  );
}
