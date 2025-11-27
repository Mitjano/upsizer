'use client';

import { useCallback } from 'react';
import { AnalyticsEvents, trackEvent } from '@/components/Analytics';

export function useAnalytics() {
  // Tool usage events
  const trackImageUpscaled = useCallback((scale: number, model: string) => {
    AnalyticsEvents.imageUpscaled(scale, model);
  }, []);

  const trackBackgroundRemoved = useCallback(() => {
    AnalyticsEvents.backgroundRemoved();
  }, []);

  const trackPackshotGenerated = useCallback((preset: string) => {
    AnalyticsEvents.packshotGenerated(preset);
  }, []);

  const trackImageExpanded = useCallback((direction: string) => {
    AnalyticsEvents.imageExpanded(direction);
  }, []);

  const trackImageCompressed = useCallback((originalSize: number, compressedSize: number) => {
    AnalyticsEvents.imageCompressed(originalSize, compressedSize);
  }, []);

  // User actions
  const trackImageDownloaded = useCallback((tool: string) => {
    AnalyticsEvents.imageDownloaded(tool);
  }, []);

  const trackImageUploaded = useCallback((fileSize: number, fileType: string) => {
    AnalyticsEvents.imageUploaded(fileSize, fileType);
  }, []);

  // Auth events
  const trackSignupStarted = useCallback((method: string) => {
    AnalyticsEvents.signupStarted(method);
  }, []);

  const trackSignupCompleted = useCallback((method: string) => {
    AnalyticsEvents.signupCompleted(method);
  }, []);

  const trackLoginCompleted = useCallback((method: string) => {
    AnalyticsEvents.loginCompleted(method);
  }, []);

  // Conversion events
  const trackPricingViewed = useCallback(() => {
    AnalyticsEvents.pricingViewed();
  }, []);

  const trackPlanSelected = useCallback((plan: string, billing: 'monthly' | 'yearly') => {
    AnalyticsEvents.planSelected(plan, billing);
  }, []);

  const trackCheckoutStarted = useCallback((plan: string, amount: number) => {
    AnalyticsEvents.checkoutStarted(plan, amount);
  }, []);

  const trackPurchaseCompleted = useCallback((plan: string, amount: number) => {
    AnalyticsEvents.purchaseCompleted(plan, amount);
  }, []);

  // Engagement
  const trackFeatureClicked = useCallback((feature: string) => {
    AnalyticsEvents.featureClicked(feature);
  }, []);

  const trackCtaClicked = useCallback((cta: string, location: string) => {
    AnalyticsEvents.ctaClicked(cta, location);
  }, []);

  const trackFaqExpanded = useCallback((question: string) => {
    AnalyticsEvents.faqExpanded(question);
  }, []);

  // Errors
  const trackError = useCallback((error: string, context: string) => {
    AnalyticsEvents.errorOccurred(error, context);
  }, []);

  const trackApiError = useCallback((endpoint: string, statusCode: number) => {
    AnalyticsEvents.apiError(endpoint, statusCode);
  }, []);

  // Generic event
  const track = useCallback((eventName: string, params?: Record<string, any>) => {
    trackEvent(eventName, params);
  }, []);

  return {
    // Tool usage
    trackImageUpscaled,
    trackBackgroundRemoved,
    trackPackshotGenerated,
    trackImageExpanded,
    trackImageCompressed,

    // User actions
    trackImageDownloaded,
    trackImageUploaded,

    // Auth
    trackSignupStarted,
    trackSignupCompleted,
    trackLoginCompleted,

    // Conversion
    trackPricingViewed,
    trackPlanSelected,
    trackCheckoutStarted,
    trackPurchaseCompleted,

    // Engagement
    trackFeatureClicked,
    trackCtaClicked,
    trackFaqExpanded,

    // Errors
    trackError,
    trackApiError,

    // Generic
    track,
  };
}

export default useAnalytics;
