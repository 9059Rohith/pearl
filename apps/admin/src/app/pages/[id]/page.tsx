'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { SectionEditor } from '@/components/SectionEditor';
import { PageSettings } from '@/components/PageSettings';
import { ThemeControls } from '@/components/ThemeControls';
import { InquiryForm } from '@/components/InquiryForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';

// Hardcoded template IDs for quick clone
const TEMPLATES = {
  blank: null,
  standard: 'tpl-standard-landing',
  premium: 'tpl-premium-showcase',
  minimal: 'tpl-minimal-contact',
};

export default function PageEditor() {
  const params = useParams();
  const pageId = params.id as string;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'settings' | 'theme' | 'preview' | 'leads'>('sections');
  const [pageLeads, setPageLeads] = useState<any[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [cloning, setCloning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPage();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pageId]);

  // Poll for lead count every 30s when on leads tab
  useEffect(() => {
    if (activeTab === 'leads') {
      loadPageLeads();
      pollRef.current = setInterval(loadPageLeads, 30000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTab]);

  async function loadPage() {
    try {
      const data = await api.getPage(pageId);
      setPage(data);
      // Also get lead count via direct fetch (bypasses api client)
      try {
        const res = await fetch(`${API_BASE}/pages/${pageId}/leads`);
        if (res.ok) {
          const leads = await res.json();
          setLeadCount(Array.isArray(leads) ? leads.length : 0);
        }
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to load page:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPageLeads() {
    try {
      // Direct fetch instead of using api client
      const res = await fetch(`${API_BASE}/leads?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setPageLeads(data);
        setLeadCount(data.length);
      }
    } catch (e) {
      console.error('Failed to load leads');
    }
  }

  async function handleAddSection(type: string) {
    await api.addSection(pageId, { type, title: `New ${type} section` });
    loadPage();
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      // Validate before publishing
      if (!page.sections || page.sections.length === 0) {
        alert('Cannot publish a page with no sections');
        return;
      }
      if (!page.sections.some((s: any) => s.type === 'hero')) {
        if (!confirm('This page has no hero section. Publish anyway?')) return;
      }
      await api.updatePage(pageId, { status: 'published' });
      loadPage();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  }

  async function handleClone() {
    const newTitle = prompt('Title for cloned page:');
    if (!newTitle) return;
    setCloning(true);
    try {
      // Direct API call for clone
      const res = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          brandId: page.brandId,
          templateId: pageId,
        }),
      });
      if (res.ok) {
        const cloned = await res.json();
        alert(`Page cloned! New page ID: ${cloned.id}`);
      } else {
        const err = await res.json();
        alert(`Clone failed: ${err.message}`);
      }
    } catch (err) {
      alert('Clone failed');
    } finally {
      setCloning(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!page) return <p>Page not found.</p>;

  const tabs = ['sections', 'settings', 'theme', 'preview', 'leads'] as const;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{page.title}</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>/{page.slug} &middot; {leadCount} leads</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClone}
            disabled={cloning}
            style={{ padding: '6px 16px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
          >
            {cloning ? 'Cloning...' : 'Clone'}
          </button>
          {page.status !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{ padding: '6px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            background: page.status === 'published' ? '#d4edda' : '#fff3cd',
            alignSelf: 'center',
          }}>
            {page.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #eee', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1a1a2e' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}{tab === 'leads' ? ` (${leadCount})` : ''}
          </button>
        ))}
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

          {page.sections
            .sort((a: any, b: any) => a.order - b.order)
            .map((section: any) => (
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

      {activeTab === 'theme' && (
        <ThemeControls pageId={pageId} theme={page.theme} onUpdate={loadPage} />
      )}

      {activeTab === 'preview' && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#f8f9fa', padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Preview</span>
            <a href={`${SITE_BASE}/${page.slug}`} target="_blank" style={{ fontSize: '0.85rem' }}>Open in new tab</a>
          </div>
          <div style={{ padding: '24px' }}>
            <InquiryForm pageId={pageId} brandId={page.brandId} primaryColor={page.theme?.primaryColor} />
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div>
          <h2>Leads for this page</h2>
          {pageLeads.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Email</th>
                  <th style={{ padding: '8px' }}>Notes</th>
                  <th style={{ padding: '8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {pageLeads.map((lead: any) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{lead.name}</td>
                    <td style={{ padding: '8px' }}>{lead.email}</td>
                    <td style={{ padding: '8px', color: '#666', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.notes || '—'}
                    </td>
                    <td style={{ padding: '8px', color: '#666' }}>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666' }}>No leads yet for this page.</p>
          )}
        </div>
      )}
    </div>
  );
}
