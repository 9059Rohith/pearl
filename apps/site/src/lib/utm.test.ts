import { describe, expect, it } from 'vitest';
import { extractUtmParams } from './utm';

describe('extractUtmParams', () => {
  it('returns only supported UTM keys with values', () => {
    const params = new URLSearchParams(
      'utm_source=google&utm_medium=cpc&utm_campaign=q2&utm_term=franchise&utm_content=cta&foo=bar',
    );

    expect(extractUtmParams(params)).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'q2',
      utm_term: 'franchise',
      utm_content: 'cta',
    });
  });

  it('skips empty UTM values', () => {
    const params = new URLSearchParams('utm_source=&utm_medium=cpc');

    expect(extractUtmParams(params)).toEqual({
      utm_medium: 'cpc',
    });
  });
});
