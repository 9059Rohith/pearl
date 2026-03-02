'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface SectionEditorProps {
  pageId: string;
  section: {
    id: string;
    type: string;
    title: string;
    content: Record<string, any>;
    order: number;
  };
  onUpdate: () => void;
}

export function SectionEditor({ pageId, section, onUpdate }: SectionEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(JSON.stringify(section.content, null, 2));
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        alert('Invalid JSON in content');
        setSaving(false);
        return;
      }

      await api.updateSection(pageId, section.id, {
        title,
        content: parsedContent,
      });
      onUpdate();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove "${section.title}" section?`)) return;
    await api.removeSection(pageId, section.id);
    onUpdate();
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '12px 16px', background: '#f8f9fa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <span style={{ fontWeight: 'bold' }}>{section.title}</span>
          <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.85rem' }}>({section.type})</span>
        </div>
        <span style={{ color: '#666' }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Content (JSON)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRemove}
              style={{ padding: '6px 12px', color: '#dc3545', background: 'none', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer' }}
            >
              Remove
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '6px 12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
