import React, { useEffect } from 'react';
import HotjarTracking from './HotjarTracking';
import FacebookPixel from './FacebookPixel';

interface AnalyticsTrackingProps {
  hotjarId?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
}

const AnalyticsTracking: React.FC<AnalyticsTrackingProps> = ({
  hotjarId = import.meta.env.VITE_HOTJAR_ID || "YOUR_HOTJAR_ID",
  facebookPixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID || "YOUR_PIXEL_ID",
  googleAnalyticsId = import.meta.env.VITE_GA_ID || "YOUR_GA_ID"
}) => {
  useEffect(() => {
    // Google Analytics 4
    if (googleAnalyticsId && googleAnalyticsId !== "YOUR_GA_ID") {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', googleAnalyticsId);
    }
  }, [googleAnalyticsId]);

  return (
    <>
      <HotjarTracking hotjarId={hotjarId} />
      <FacebookPixel pixelId={facebookPixelId} />
    </>
  );
};

export default AnalyticsTracking;
