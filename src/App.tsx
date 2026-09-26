import React, { Component, lazy, Suspense, useEffect } from 'react';
import { Switch, Route, Router, useLocation } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { CapabilitiesProvider } from './context/CapabilitiesContext';
const Navbar = lazy(() => import('./components/Navbar').then(module => ({ default: module.Navbar })));
const Hero = lazy(() => import('./components/Hero').then(module => ({ default: module.Hero })));
const ComparisonSection = lazy(() => import('./components/ComparisonSection').then(module => ({ default: module.ComparisonSection })));
const StickyMobileCta = lazy(() => import('./components/StickyMobileCta').then(module => ({ default: module.StickyMobileCta })));
const TemplatesSection = lazy(() => import('./components/TemplatesSection').then(module => ({ default: module.TemplatesSection })));
const PricingSection = lazy(() => import('./components/PricingSection').then(module => ({ default: module.PricingSection })));
const GuidesPage = lazy(() => import('./pages/GuidesPage').then(module => ({ default: module.GuidesPage })));
const FaqSection = lazy(() => import('./components/FaqSection').then(module => ({ default: module.FaqSection })));
const Footer = lazy(() => import('./components/Footer').then(module => ({ default: module.Footer })));
import { HandoffFinalCta } from './components/HandoffBenefits';
const BuilderStudio = lazy(() => import('./components/BuilderStudio').then(module => ({ default: module.BuilderStudio })));
const PublicBioView = lazy(() => import('./components/PublicBioView').then(module => ({ default: module.PublicBioView })));
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { AccountPage } from './pages/AccountPage';
import { PrivacyPage, TermsPage, ContactPage, AboutPage } from './pages/LegalPages';
import { api } from './services/api';
import { RESERVED_USERNAMES, canonicalOrigin, isFirstPartyHost } from './config/brand';
import { PageMetadata } from './components/PageMetadata';
import { SkipLink } from './components/SkipLink';
import { ProductFeedbackProvider } from './components/ProductFeedback';
import { LoadingScreen, BioSkeletonLoader } from './components/LoadingScreen';
import { Lock, ArrowRight, AlertTriangle, RotateCw } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { languageForPath } from './utils/languagePaths';
import {
  clearFullscreenPreviewMark,
  isFullscreenPreviewMarked,
  readFullscreenPreviewTheme,
  setFullscreenPreviewTheme
} from './utils/previewSession';
import { starterSitePath } from './utils/starterSites';
import type { Language } from './config/i18n';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { TouchpointConvergenceSection, CreatorJobsSection, CreatorSegmentsSection } from './components/CreatorLandingSections';



function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleClaimUsername = (handle: string) => {
    setLocation(`/register?username=${encodeURIComponent(handle)}`);
  };

  const handleOpenStudio = () => {
    setLocation('/studio');
  };

  const handleSelectTemplate = (templateId: string) => {
    setLocation(starterSitePath(templateId, Boolean(user)));
  };

  const handleSelectPlan = (plan: string, interval: 'month' | 'year') => {
    setLocation(`/register?plan=${plan}&interval=${interval}`);
  };

  return (
    <div className="marketing-home min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="home" onClaimClick={handleClaimUsername} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Hero
          onClaimUsername={handleClaimUsername}
          onOpenStudio={handleOpenStudio}
        />
        <TouchpointConvergenceSection />
        <TemplatesSection maxVisible={4} onSelectTemplate={handleSelectTemplate} />
        <CreatorJobsSection />
        <CreatorSegmentsSection />
        <PricingSection onSelectPlan={handleSelectPlan} />
        <FaqSection />
        <HandoffFinalCta onClaimUsername={handleClaimUsername} />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
      <StickyMobileCta />
    </div>
  );
}

function PublicProfilePage({ username, pageSlug }: { username: string; pageSlug?: string }) {
  // Latched for the lifetime of this mount and cleared once it has committed. Re-reading the
  // tab-scoped flag on every render would hand a later render `previewOnly: false`, which is how the
  // creator's own preview came to be counted as a visitor.
  const [fullscreenPreview] = React.useState(() => isFullscreenPreviewMarked(username));
  React.useEffect(() => {
    if (fullscreenPreview) clearFullscreenPreviewMark(username);
  }, [fullscreenPreview, username]);
  return (
    <Suspense fallback={<BioSkeletonLoader />}>
      <PublicBioView
        username={username}
        pageSlug={pageSlug}
        customTheme={readFullscreenPreviewTheme(username)}
        previewOnly={fullscreenPreview}
        onBackToStudio={() => window.location.href = '/studio'}
      />
    </Suspense>
  );
}

function StudioPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { tr } = useLanguage();

  const handleFooterNavigation = (v: string) => {
    if (v === 'home') setLocation('/');
    else if (v === 'builder') setLocation('/studio');
    else if (v === 'templates') setLocation('/templates');
    else if (v === 'pricing') setLocation('/pricing');
  };

  if (isLoading) {
    return <LoadingScreen message={tr('Loading your profile…')} submessage="Preparing your creative studio" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Navbar activeView="builder" />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center mb-6 shadow-xs text-neutral-900">
            <Lock className="w-7 h-7 text-neutral-800" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-3 text-balance">
            {tr('Sign in to edit your page')}
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md mb-8 text-pretty">
            {tr('Access your bio builder, customize your theme, and manage your links and live analytics.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setLocation('/login')}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center gap-2"
            >
              <span>{tr('Sign In')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setLocation('/register')}
              className="px-6 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {tr('Create an account')}
            </button>
          </div>
        </main>
        <Footer onSelectView={handleFooterNavigation} />
      </div>
    );
  }

  return (
    // The Studio's bottom chrome is fixed, so the page reserves its band once here rather
    // than in each column — otherwise the last footer row can never be scrolled clear.
    <div className="studio-page marketing-shell min-h-screen flex flex-col bg-white text-neutral-900 pb-36 lg:pb-0">
      <Navbar activeView="builder" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Suspense fallback={<LoadingScreen message={tr('Loading your profile…')} submessage="Preparing your creative studio" fullscreen={false} />}>
          <BuilderStudio
            onViewFullscreen={(profile, theme) => {
              setFullscreenPreviewTheme(profile.username, theme);
              // A preview step that only existed in this tab would vanish on another device, so the
              // visit is recorded on the account. If the write fails the step stays unticked, which is
              // the honest direction: nothing here claims a step the server did not store.
              void api.studio.previewed().catch(() => {});
              setLocation(`/@${profile.username}`);
            }}
          />
        </Suspense>
      </main>
      <Footer onSelectView={handleFooterNavigation} />
    </div>
  );
}

function TemplatesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleSelectTemplate = (templateId: string) => {
    setLocation(starterSitePath(templateId, Boolean(user)));
  };

  return (
    <div className="marketing-shell marketing-templates-page min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="templates" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <TemplatesSection headingLevel={1} onSelectTemplate={handleSelectTemplate} />
        <ComparisonSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
      <StickyMobileCta />
    </div>
  );
}

function PricingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const handleSelectPlan = async (planId: string, interval: 'month' | 'year') => {
    if (!user) { setLocation('/register?plan=' + planId + '&interval=' + interval); return; }
    if (planId === 'free') { setLocation('/studio'); return; }
    const res = await api.billing.createCheckoutSession(planId as 'pro' | 'studio', interval);
    window.location.assign(res.url);
  };

  return (
    <div className="marketing-shell marketing-pricing-page min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="pricing" />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PricingSection headingLevel={1} onSelectPlan={handleSelectPlan} />
        <ComparisonSection />
        <FaqSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
      <StickyMobileCta />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function CrashFallback() {
  const { tr } = useLanguage();
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-neutral-900">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{tr('Something went wrong')}</h1>
          <p className="text-sm text-neutral-500">{tr('Reload this page to try again.')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="w-4 h-4" />
            <span>{tr('Reload Page')}</span>
          </button>
          <a
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-2"
            href="/"
          >
            <span>{tr('Back to Home')}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application error', error, info);
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack || 'unknown' } } });
  }
  render() {
    return this.state.hasError ? <LanguageProvider><CrashFallback /></LanguageProvider> : this.props.children;
  }
}

interface AppProps {
  initialLanguage?: Language;
  initialPath?: string;
}

interface RoutedAppProps {
  language: Language;
  routerBase?: string;
  routerSsrPath: { ssrPath?: string };
}

function CustomDomainApp({ currentHost, language, routerBase, routerSsrPath }: RoutedAppProps & { currentHost: string }) {
  const customPageSlug = typeof window !== 'undefined'
    ? window.location.pathname.split('/').filter(Boolean)[0] || undefined
    : undefined;

  return (
    <Router base={routerBase} {...routerSsrPath}>
      <ErrorBoundary>
        <LanguageProvider initialLanguage={language}>
          <AuthProvider>
            <div className="relative min-h-screen">
              <div className="relative z-10">
                <Suspense fallback={<BioSkeletonLoader />}><PublicBioView
                  customDomain={currentHost}
                  pageSlug={customPageSlug}
                  onBackToStudio={() => window.location.href = `${canonicalOrigin}/studio`}
                /></Suspense>
              </div>
            </div>
            <SpeedInsights />
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </Router>
  );
}

function MainApplication({ language, routerBase, routerSsrPath }: RoutedAppProps) {
  useEffect(() => {
    const referral = new URLSearchParams(window.location.search).get('ref')?.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    if (referral) window.localStorage.setItem('raloa-referral', referral);
    const agencyReferral = new URLSearchParams(window.location.search).get('agency_ref')?.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    if (agencyReferral) window.localStorage.setItem('raloa-agency-referral', agencyReferral);
  }, []);
  return (
    <Router base={routerBase} {...routerSsrPath}>
    <ErrorBoundary>
      <LanguageProvider initialLanguage={language}>
        <CapabilitiesProvider>
          <AuthProvider>
          <SkipLink />
          <ProductFeedbackProvider>
          <div className="relative min-h-screen">
            <div className="relative z-10">
              <PageMetadata />
              <Suspense fallback={<LoadingScreen message="Loading..." submessage="RALOA" />}><Switch>
            {/* Core application routes */}
            <Route path="/" component={HomePage} />
            <Route path="/features" component={FeaturesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/pricing" component={PricingPage} />
            <Route path="/guides" component={GuidesPage} />
            <Route path="/guides/:guide" component={GuidesPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/studio" component={StudioPage} />
            <Route path="/account" component={AccountPage} />

            {/* Reserved System Demo Routes */}
            <Route path="/demo/:identifier">
              {(params) => params ? <PublicProfilePage username={params.identifier} /> : <HomePage />}
            </Route>

            {/* Dynamic Public Bio Pages */}
            <Route path="/@:username/:pageSlug">
              {(params) => params ? <PublicProfilePage username={params.username} pageSlug={params.pageSlug} /> : <HomePage />}
            </Route>
            <Route path="/@:username">
              {(params) => params ? <PublicProfilePage username={params.username} /> : <HomePage />}
            </Route>

            <Route path="/:username/:pageSlug">
              {(params) => {
                if (!params) return <HomePage />;
                const clean = params.username.toLowerCase();
                if (RESERVED_USERNAMES.includes(clean as any)) return <HomePage />;
                return <PublicProfilePage username={params.username} pageSlug={params.pageSlug} />;
              }}
            </Route>

            <Route path="/:username">
              {(params) => {
                if (!params) return <HomePage />;
                // Guard against system routes and reserved words
                const clean = params.username.toLowerCase();
                if (RESERVED_USERNAMES.includes(clean as any)) {
                  return <HomePage />;
                }
                return <PublicProfilePage username={params.username} />;
              }}
            </Route>
              </Switch></Suspense>
            </div>
          </div>
          <SpeedInsights />
          </ProductFeedbackProvider>
        </AuthProvider>
      </CapabilitiesProvider>
    </LanguageProvider>
    </ErrorBoundary>
    </Router>
  );
}

export default function App({ initialLanguage, initialPath }: AppProps = {}) {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const currentPath = initialPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const language = initialLanguage || languageForPath(currentPath);
  const routerBase = language === 'ar' ? '/ar' : undefined;
  const routerSsrPath = initialPath ? { ssrPath: initialPath } : {};
  const isCustomDomain = currentHost && !isFirstPartyHost(currentHost);

  return isCustomDomain
    ? <CustomDomainApp currentHost={currentHost} language={language} routerBase={routerBase} routerSsrPath={routerSsrPath} />
    : <MainApplication language={language} routerBase={routerBase} routerSsrPath={routerSsrPath} />;
}
