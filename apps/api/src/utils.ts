// Utility functions used across the application

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - strips script tags and event handlers
  // TODO: use a proper library like DOMPurify
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/\son\w+="[^"]*"/g, '');
  clean = clean.replace(/\son\w+='[^']*'/g, '');
  return clean;
}

export function truncate(str: string, len: number = 100): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function parseQueryFilters(query: any): Record<string, any> {
  const filters: Record<string, any> = {};
  for (const key of Object.keys(query)) {
    if (query[key] !== undefined && query[key] !== '' && query[key] !== 'undefined') {
      if (key === 'limit' || key === 'offset' || key === 'page') {
        filters[key] = parseInt(query[key], 10);
        if (isNaN(filters[key])) delete filters[key];
      } else if (key === 'active' || key === 'published') {
        filters[key] = query[key] === 'true' || query[key] === '1';
      } else {
        filters[key] = query[key];
      }
    }
  }
  return filters;
}

export function formatDate(date: string | Date, format: string = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'iso') return d.toISOString();
  if (format === 'short') return d.toLocaleDateString();
  if (format === 'long') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }
  return d.toISOString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function extractUtmParams(query: Record<string, any>): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith('utm_') && typeof v === 'string') {
      utm[k] = v;
    }
  }
  return utm;
}

// Color utilities for theme processing
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// String helpers
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}

// Array helpers
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(arr: T[], key?: (item: T) => any): T[] {
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
