import React, { Component, lazy, Suspense } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesSection } from './components/FeaturesSection';
import { ComparisonSection } from './components/ComparisonSection';
import { TemplatesSection } from './components/TemplatesSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
const BuilderStudio = lazy(() => import('./components/BuilderStudio').then(module => ({ default: module.BuilderStudio })));
import { PublicBioView } from './components/PublicBioView';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PrivacyPage, TermsPage, ContactPage, AboutPage } from './pages/LegalPages';
import { CreatorProfile } from './types';
import { api, authStorage } from './services/api';
import { RESERVED_USERNAMES } from './config/brand';
import { PageMetadata } from './components/PageMetadata';

function chooseTemplate(profile: CreatorProfile, navigate: (path: string) => void) {
  const theme = encodeURIComponent(profile.themeId);
  navigate(authStorage.getToken() ? `/studio?template=${theme}` : `/register?template=${theme}`);
}

function HomePage() {
  const [, setLocation] = useLocation();

  const handleClaimUsername = (handle: string) => {
    setLocation(`/register?username=${encodeURIComponent(handle)}`);
  };

  const handleOpenStudio = () => {
    setLocation('/studio');
  };

  const handleSelectTemplate = (profile: CreatorProfile) => {
    chooseTemplate(profile, setLocation);
  };

  const handleSelectPlan = (plan: string, interval: 'month' | 'year') => {
    setLocation(`/register?plan=${plan}&interval=${interval}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="home" onClaimClick={handleClaimUsername} />
      <main className="flex-1">
        <Hero
          onClaimUsername={handleClaimUsername}
          onOpenStudio={handleOpenStudio}
        />
        <FeaturesSection onOpenStudio={handleOpenStudio} />
        <ComparisonSection />
        <TemplatesSection onSelectTemplate={handleSelectTemplate} />
        <PricingSection onSelectPlan={handleSelectPlan} />
        <FaqSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

function StudioPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { tr } = useLanguage();
  if (isLoading) return <p role="status" className="p-8">{tr('Loading your profile…')}</p>;
  if (!user) return <div className="p-8 text-center"><h1>{tr('Sign in to edit your page')}</h1><a href="/login" className="inline-block p-4 underline">{tr('Sign In')}</a></div>;

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="builder" />
      <main className="flex-1">
        <Suspense fallback={<p role="status" className="p-8">{tr('Loading your profile…')}</p>}><BuilderStudio
          onViewFullscreen={(profile) => {
            setLocation(`/@${profile.username}`);
          }}
        /></Suspense>
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

function TemplatesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="templates" />
      <main className="flex-1 pt-8">
        <TemplatesSection headingLevel={1} onSelectTemplate={(p) => chooseTemplate(p, setLocation)} />
        <ComparisonSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
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
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="pricing" />
      <main className="flex-1 pt-8">
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
  return <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-5">
    <h1 className="text-2xl font-bold">{tr('Something went wrong')}</h1>
    <p>{tr('Reload this page to try again.')}</p>
    <a className="underline p-3" href="/">{tr('Back to Home')}</a>
    <button className="rounded-full bg-neutral-900 text-white px-6 py-3" onClick={() => window.location.reload()}>{tr('Reload Page')}</button>
  </main>;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Application error', error, info); }
  render() {
    return this.state.hasError ? <LanguageProvider><CrashFallback /></LanguageProvider> : this.props.children;
  }
}

export default function App() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const defaultHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'liinx.vercel.app', 'liinx.app'];
  const isCustomDomain = currentHost && !defaultHosts.includes(currentHost) && !currentHost.endsWith('.liinx.app');

  if (isCustomDomain) {
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <PublicBioView
              customDomain={currentHost}
              onBackToStudio={() => window.location.href = 'https://liinx.app/studio'}
            />
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <PageMetadata />
          <Switch>
            {/* Core application routes */}
            <Route path="/" component={HomePage} />
            <Route path="/features" component={FeaturesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/pricing" component={PricingPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/studio" component={StudioPage} />

            {/* Dynamic Public Bio Pages */}
            <Route path="/@:username">
              {(params) => (
                <PublicBioView
                  username={params.username}
                  onBackToStudio={() => window.location.href = '/studio'}
                />
              )}
            </Route>

            <Route path="/:username">
              {(params) => {
                // Guard against system routes and reserved words
                const clean = params.username.toLowerCase();
                if (RESERVED_USERNAMES.includes(clean as any)) {
                  return <HomePage />;
                }
                return (
                  <PublicBioView
                    username={params.username}
                    onBackToStudio={() => window.location.href = '/studio'}
                  />
                );
              }}
            </Route>
          </Switch>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
