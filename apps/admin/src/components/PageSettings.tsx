'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface PageSettingsProps {
  page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    theme?: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      headerStyle: string;
    };
  };
  onUpdate: () => void;
}

export function PageSettings({ page, onUpdate }: PageSettingsProps) {
  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState(page.status);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updatePage(page.id, { title, status });
      onUpdate();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2>Page Settings</h2>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>
          Slug: /{page.slug}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '8px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
