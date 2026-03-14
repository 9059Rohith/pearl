'use client';

interface SEOHeadProps {
  page: {
    title: string;
    slug: string;
    sections: Array<{
      type: string;
      title: string;
      content: Record<string, any>;
    }>;
  };
  brand?: {
    name: string;
    slug: string;
    logoUrl?: string;
  };
}

export function SEOHead({ page, brand }: SEOHeadProps) {
  const pageTitle = brand ? `${page.title} | ${brand.name}` : page.title;
  const heroSection = page.sections.find((s) => s.type === 'hero');
  const description = heroSection?.content?.subtitle || `Learn about ${page.title}`;

  // Build canonical URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const canonical = `${baseUrl}/${page.slug}`;

  // Build JSON-LD schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description,
    url: canonical,
    ...(brand && {
      publisher: {
        '@type': 'Organization',
        name: brand.name,
        ...(brand.logoUrl && { logo: brand.logoUrl }),
      },
    }),
  };

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
