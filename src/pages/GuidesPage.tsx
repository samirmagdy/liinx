import { Link, useLocation } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLanguage, useLanguage as useUiLanguage } from '../context/LanguageContext';
import { Reveal } from '../components/motion/Reveal';
import { getGuides, type Guide } from './guides.data';

function navigateFooter(view: 'home' | 'builder' | 'templates' | 'pricing' | 'features' | 'about' | 'contact', setLocation: (path: string) => void) {
  const paths = { home: '/', builder: '/studio', templates: '/templates', pricing: '/pricing' };
  const path = paths[view as keyof typeof paths];
  if (path) setLocation(path);
}

export function GuidesPage() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [path, setLocation] = useLocation();
  const guides = getGuides(ar);
  const activeGuide = guides.find(guide => guide.path === path);

  return <div className="marketing-shell marketing-guides-page min-h-screen bg-white text-neutral-900">
    <Navbar activeView="home" onClaimClick={() => setLocation('/register')} />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      {activeGuide
        ? <GuideArticle guide={activeGuide} ar={ar} />
        : <GuideIndex guides={guides} ar={ar} />}
    </main>
    <Footer onSelectView={view => navigateFooter(view, setLocation)} />
  </div>;
}

function GuideArticle({ guide, ar }: { guide: Guide; ar: boolean }) {
  const { tr: ui } = useUiLanguage();
  return <article>
    <Link href="/guides" className="text-sm font-semibold text-indigo-800 hover:underline">{ui('All guides')}</Link>
    <Reveal distance="md" className="mt-8 max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">{guide.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-neutral-600">{guide.summary}</p>
    </Reveal>
    <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
      {guide.sections.map((section, index) => <section key={section.title} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr]">
        <span className="font-mono text-sm text-indigo-800">0{index + 1}</span>
        <div><h2 className="text-lg font-bold">{section.title}</h2><p className="mt-2 text-sm leading-7 text-neutral-600">{section.body}</p></div>
      </section>)}
    </div>
    <div className="mt-8 flex items-start gap-3 rounded-2xl bg-neutral-50 p-5">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
      <p className="text-sm leading-relaxed text-neutral-700">{ui('Check your links and details before sharing. External services can change their interface over time.')}</p>
    </div>
    <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
      {ui('Build your site')}<ArrowRight className={`h-4 w-4 ${ar ? 'rotate-180' : ''}`} />
    </Link>
  </article>;
}

function GuideIndex({ guides, ar }: { guides: Guide[]; ar: boolean }) {
  const { tr: ui } = useUiLanguage();
  return <>
    <Reveal distance="md" className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-800">{ui('Practical guides')}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">{ui('Make your site useful')}</h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-600">{ui('Straightforward advice for building a useful page and sharing it in English or Arabic.')}</p>
    </Reveal>
    <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
      {guides.map(guide => <Link key={guide.path} href={guide.path} className="group block py-6">
        <h2 className="text-xl font-bold group-hover:text-indigo-800">{guide.title}<ArrowRight className={`ms-2 inline h-4 w-4 ${ar ? 'rotate-180' : ''}`} /></h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{guide.summary}</p>
      </Link>)}
    </div>
  </>;
}
