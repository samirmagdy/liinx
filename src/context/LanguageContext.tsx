import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, translations, type Translations } from '../config/i18n';
import { translateRuntime } from '../config/runtimeTranslations';
import { languageForPath, localizedPath } from '../utils/languagePaths';

interface LanguageContextType {
  lang: Language;
  t: Translations;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  tr: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode; initialLanguage?: Language }> = ({ children, initialLanguage }) => {
  const [lang, setLang] = useState<Language>(() => {
    if (initialLanguage) return initialLanguage;
    return typeof window === 'undefined' ? 'en' : languageForPath(window.location.pathname);
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  const setLanguage = (newLang: Language) => {
    if (typeof window !== 'undefined') {
      const currentLanguage = languageForPath(window.location.pathname);
      if (currentLanguage !== newLang) {
        const nextPath = localizedPath(window.location.pathname, newLang);
        window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
        return;
      }
    }
    setLang(newLang);
  };

  const tr = (text: string): string => {
    return translateRuntime(text, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], isRtl, setLanguage, tr }}>
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
