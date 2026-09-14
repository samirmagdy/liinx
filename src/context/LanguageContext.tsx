import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '../config/i18n';
import { translateRuntime } from '../config/runtimeTranslations';

interface LanguageContextType {
  lang: Language;
  t: Translations;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  tr: (text: string) => string;
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
  }, [lang, isRtl]);

  const setLanguage = (newLang: Language) => {
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
