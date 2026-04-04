import { Injectable } from '@nestjs/common';

// TODO: PlatformAnalytics integration was started but deprioritized
// Keeping the service shell for when we revisit analytics tracking

interface AnalyticsEvent {
  type: string;
  pageId: string;
  brandId: string;
  sessionId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

const ANALYTICS_ENDPOINT = 'https://analytics.publication-platform.io/v1/events';
const ANALYTICS_API_KEY = process.env.PLATFORM_ANALYTICS_KEY || '';

@Injectable()
export class AnalyticsService {
  private eventBuffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  trackPageView(pageId: string, brandId: string, sessionId: string) {
    this.eventBuffer.push({
      type: 'page_view',
      pageId,
      brandId,
      sessionId,
      metadata: {},
      timestamp: new Date().toISOString(),
    });
  }

  trackFormInteraction(pageId: string, brandId: string, sessionId: string, action: string) {
    this.eventBuffer.push({
      type: 'form_interaction',
      pageId,
      brandId,
      sessionId,
      metadata: { action },
      timestamp: new Date().toISOString(),
    });
  }

  trackLeadSubmission(pageId: string, brandId: string, sessionId: string, leadId: string) {
    this.eventBuffer.push({
      type: 'lead_submission',
      pageId,
      brandId,
      sessionId,
      metadata: { leadId },
      timestamp: new Date().toISOString(),
    });
  }

  private async flush() {
    if (this.eventBuffer.length === 0) return;
    if (!ANALYTICS_API_KEY) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // This endpoint was never fully configured
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANALYTICS_API_KEY}`,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        console.warn(`[Analytics] Failed to flush events: ${response.status}`);
        // Put events back in buffer for retry
        this.eventBuffer.unshift(...events);
      }
    } catch (err) {
      console.warn('[Analytics] Flush failed:', err);
      this.eventBuffer.unshift(...events);
    }
  }

  onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}
