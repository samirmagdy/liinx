import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '../config/i18n';
import { translateRuntime } from '../config/runtimeTranslations';

interface LanguageContextType {
  lang: Language;
  t: Translations;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('liinx_lang') as Language;
      return (stored === 'ar' || stored === 'en') ? stored : 'en';
    } catch {
      return 'en';
    }
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('liinx_lang', lang);
    } catch {}

    const translateDom = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'CODE'].includes(parent.tagName)) continue;
        const source = parent.dataset.i18nSource || node.nodeValue || '';
        const trimmed = source.trim();
        if (!trimmed) continue;
        const translated = translateRuntime(trimmed, lang);
        if (translated !== trimmed) {
          if (!parent.dataset.i18nSource) parent.dataset.i18nSource = source;
          node.nodeValue = source.replace(trimmed, translated);
        } else if (parent.dataset.i18nSource && lang === 'en') {
          node.nodeValue = parent.dataset.i18nSource;
          delete parent.dataset.i18nSource;
        }
      }

      document.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]').forEach((el) => {
        for (const attr of ['placeholder', 'aria-label', 'title']) {
          const value = el.getAttribute(attr);
          if (!value) continue;
          const source = el.dataset[`i18n${attr.replace('-', '')}`] || value;
          const translated = translateRuntime(source, lang);
          if (translated !== source) el.dataset[`i18n${attr.replace('-', '')}`] = source;
          el.setAttribute(attr, translated);
        }
      });
    };

    translateDom();
    const observer = new MutationObserver(translateDom);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [lang, isRtl]);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], isRtl, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
