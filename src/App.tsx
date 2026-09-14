import React from 'react';
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
        <TestimonialsSection />
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
      alert(`Upgraded to ${planId.toUpperCase()} tier!`);
      setLocation('/studio');
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

export default function App() {
  return (
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
  );
}
