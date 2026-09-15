import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PublicBioView } from './PublicBioView';
import { CreatorProfile, ThemeConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';

/** A real iframe viewport: media queries use the selected device width. */
export function ViewportPreview({ profile, customTheme, deviceMode }: { profile: CreatorProfile; customTheme: ThemeConfig; deviceMode: 'mobile' | 'tablet' | 'desktop' }) {
  const { lang } = useLanguage();
  const host = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(380);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const width = { mobile: 390, tablet: 768, desktop: 1280 }[deviceMode];
  const height = deviceMode === 'mobile' ? 844 : 900;
  const scale = Math.min(available / width, 1);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (root) { root.ownerDocument.documentElement.lang = lang; root.ownerDocument.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; } }, [root, lang]);
  useEffect(() => {
    if (!root || !profile.customFontUrl) return;
    const link = root.ownerDocument.createElement('link');
    link.rel = 'stylesheet'; link.href = profile.customFontUrl;
    root.ownerDocument.head.appendChild(link);
    return () => link.remove();
  }, [root, profile.customFontUrl]);
  return <div ref={host} className="w-full min-w-0">
    <p className="text-xs text-neutral-600 text-center mb-3">{lang === 'ar' ? 'معاينة التخطيط فقط. افتح الصفحة المنشورة للتفاعل.' : 'Layout preview only. Open the live page to interact.'} <bdi>{width} × {height}</bdi></p>
    <div className="relative mx-auto overflow-hidden border rounded-2xl bg-white" style={{ width: width * scale, height: height * scale }}>
      <iframe title={lang === 'ar' ? 'معاينة تخطيط الصفحة' : 'Page layout preview'} tabIndex={-1} className="absolute top-0 left-0 border-0 origin-top-left pointer-events-none" style={{ width, height, transform: `scale(${scale})` }} srcDoc="<!doctype html><html><head></head><body style='margin:0'><div id='preview-root' inert></div></body></html>" onLoad={event => {
        const doc = event.currentTarget.contentDocument;
        if (!doc) return;
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => doc.head.appendChild(style.cloneNode(true)));
        setRoot(doc.getElementById('preview-root'));
      }} />
      {root && createPortal(<PublicBioView profile={profile} customTheme={customTheme} previewOnly />, root)}
    </div>
  </div>;
}
