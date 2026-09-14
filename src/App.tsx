import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesSection } from './components/FeaturesSection';
import { ComparisonSection } from './components/ComparisonSection';
import { TemplatesSection } from './components/TemplatesSection';
import { PricingSection } from './components/PricingSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { BuilderStudio } from './components/BuilderStudio';
import { PublicBioView } from './components/PublicBioView';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreatorProfile } from './types';
import { api } from './services/api';

function HomePage() {
  const [, setLocation] = useLocation();

  const handleClaimUsername = (handle: string) => {
    setLocation(`/register?username=${encodeURIComponent(handle)}`);
  };

  const handleOpenStudio = () => {
    setLocation('/studio');
  };

  const handleSelectTemplate = (profile: CreatorProfile) => {
    setLocation(`/@${profile.username}`);
  };

  const handleSelectPlan = () => {
    setLocation('/register');
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="builder" />
      <main className="flex-1">
        <BuilderStudio
          onViewFullscreen={(profile) => {
            setLocation(`/@${profile.username}`);
          }}
        />
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
        <TemplatesSection onSelectTemplate={(p) => setLocation(`/@${p.username}`)} />
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

  const handleSelectPlan = async (planId: string) => {
    try {
      const cleanPlan = planId.toLowerCase() as 'free' | 'pro' | 'studio';
      await api.studio.updatePlan(cleanPlan);
      setLocation('/studio?plan=updated');
    } catch {
      setLocation(`/register?plan=${encodeURIComponent(planId)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="pricing" />
      <main className="flex-1 pt-8">
        <PricingSection onSelectPlan={handleSelectPlan} />
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

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6 text-neutral-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto text-lg font-bold">
              LX
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-neutral-900">Something went wrong</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                An unexpected error occurred while loading this view.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-left text-neutral-700 overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
              >
                Back to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Switch>
          {/* Core application routes */}
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/studio" component={StudioPage} />
          <Route path="/templates" component={TemplatesPage} />
          <Route path="/pricing" component={PricingPage} />

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
              // Guard against system routes
              const reserved = ['login', 'register', 'studio', 'templates', 'pricing', 'api', 'uploads'];
              if (reserved.includes(params.username)) {
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
    </ErrorBoundary>
  );
}
