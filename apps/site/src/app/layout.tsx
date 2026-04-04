import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brand Discovery',
  description: 'Explore brand opportunities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif' }}>
        <header style={{ background: '#0f172a', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '1.25rem' }}>Brand Discovery</strong>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <a href="/" style={{ color: '#94a3b8' }}>Home</a>
            <a href="/brands" style={{ color: '#94a3b8' }}>Brands</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
