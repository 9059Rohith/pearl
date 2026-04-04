'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface InquiryFormProps {
  pageId: string;
  brandId: string;
  brandName?: string;
  primaryColor?: string;
  showPhone?: boolean;
  requireMessage?: boolean;
}

export function InquiryForm({ pageId, brandId, brandName, primaryColor = '#1a1a2e', showPhone = true, requireMessage = false }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (showPhone && formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (requireMessage && !formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.submitLead({
        pageId,
        brandId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', background: '#f0fdf4', borderRadius: '8px' }}>
        <h3>Thank you for your inquiry!</h3>
        <p>We'll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
      <h3>Inquire About {brandName || 'This Brand'}</h3>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
          Full Name <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ width: '100%', padding: '8px', border: `1px solid ${errors.name ? '#dc3545' : '#ddd'}`, borderRadius: '4px', boxSizing: 'border-box' }}
        />
        {errors.name && <p style={{ color: '#dc3545', fontSize: '0.85rem', margin: '4px 0 0' }}>{errors.name}</p>}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
          Email <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{ width: '100%', padding: '8px', border: `1px solid ${errors.email ? '#dc3545' : '#ddd'}`, borderRadius: '4px', boxSizing: 'border-box' }}
        />
        {errors.email && <p style={{ color: '#dc3545', fontSize: '0.85rem', margin: '4px 0 0' }}>{errors.email}</p>}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          style={{ width: '100%', padding: '8px', border: `1px solid ${errors.phone ? '#dc3545' : '#ddd'}`, borderRadius: '4px', boxSizing: 'border-box' }}
        />
        {errors.phone && <p style={{ color: '#dc3545', fontSize: '0.85rem', margin: '4px 0 0' }}>{errors.phone}</p>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>Message</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={4}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          placeholder="Tell us about your interest in this brand..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          padding: '12px',
          background: primaryColor,
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '1rem',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Inquiry'}
      </button>
    </form>
  );
}
