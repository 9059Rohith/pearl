import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publication Admin',
  description: 'Brand publication management portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <nav style={{ background: '#1a1a2e', color: '#fff', padding: '12px 24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <strong>Publication Admin</strong>
          <a href="/" style={{ color: '#ccc' }}>Dashboard</a>
          <a href="/pages" style={{ color: '#ccc' }}>Pages</a>
          <a href="/leads" style={{ color: '#ccc' }}>Leads</a>
        </nav>
        <main style={{ padding: '24px' }}>{children}</main>
      </body>
    </html>
  );
}
