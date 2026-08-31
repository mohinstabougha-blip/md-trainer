"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { getConsent, CONSENT_EVENT } from "@/lib/consent";

const PIXEL_ID = "1044627358565472";

// Meta Pixel – lädt ausschließlich nach erteilter Einwilligung (siehe
// ConsentBanner / lib/consent). Ohne Einwilligung wird nichts eingebunden.
export function MetaPixel() {
  const [granted, setGranted] = useState(false);
  const pathname = usePathname();
  const initialTrackDone = useRef(false);

  useEffect(() => {
    const sync = () => setGranted(getConsent() === "granted");
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  // Client-seitige Navigationen als weitere PageViews zählen. Der erste
  // PageView kommt schon aus dem Init-Snippet unten – daher überspringen.
  useEffect(() => {
    if (!granted) return;
    if (!initialTrackDone.current) {
      initialTrackDone.current = true;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    fbq?.("track", "PageView");
  }, [pathname, granted]);

  if (!granted) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
