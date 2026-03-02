'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  brandId: string;
  sections: any[];
  updatedAt: string;
}

export default function PagesList() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBrandId, setNewBrandId] = useState('');

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const data = await api.getPages();
      setPages(data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newBrandId.trim()) return;
    try {
      await api.createPage({ title: newTitle, brandId: newBrandId });
      setNewTitle('');
      loadPages();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this page?')) return;
    await api.deletePage(id);
    loadPages();
  }

  if (loading) return <p>Loading pages...</p>;

  return (
    <div>
      <h1>Pages</h1>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <input
          placeholder="Page title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="Brand ID"
          value={newBrandId}
          onChange={(e) => setNewBrandId(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Page
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Title</th>
            <th style={{ padding: '8px' }}>Slug</th>
            <th style={{ padding: '8px' }}>Status</th>
            <th style={{ padding: '8px' }}>Sections</th>
            <th style={{ padding: '8px' }}>Updated</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>
                <a href={`/pages/${page.id}`}>{page.title}</a>
              </td>
              <td style={{ padding: '8px', color: '#666' }}>{page.slug}</td>
              <td style={{ padding: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  background: page.status === 'published' ? '#d4edda' : page.status === 'draft' ? '#fff3cd' : '#f8d7da',
                }}>
                  {page.status}
                </span>
              </td>
              <td style={{ padding: '8px' }}>{page.sections.length}</td>
              <td style={{ padding: '8px', color: '#666' }}>{new Date(page.updatedAt).toLocaleDateString()}</td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleDelete(page.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pages.length === 0 && <p style={{ color: '#666', marginTop: '16px' }}>No pages yet. Create one above.</p>}
    </div>
  );
}
