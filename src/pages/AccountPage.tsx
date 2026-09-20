import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ProfileSettingsPanel } from '../features/account/components/ProfileSettingsPanel';
import { BillingSettingsPanel } from '../features/account/components/BillingSettingsPanel';
import { ProfilesSettingsPanel } from '../features/account/components/ProfilesSettingsPanel';
import { DeveloperSettingsPanel } from '../features/account/components/DeveloperSettingsPanel';
import { SecuritySettingsPanel } from '../features/account/components/SecuritySettingsPanel';
import { AccountSidebar, type SettingsTab } from '../features/account/components/AccountSidebar';
import { useAccountSecurity } from '../features/account/hooks/useAccountSecurity';
import { useAccountProfiles } from '../features/account/hooks/useAccountProfiles';
import { useApiKeys } from '../features/account/hooks/useApiKeys';
import { useBillingStatus } from '../features/account/hooks/useBillingStatus';

export function AccountPage() {
  const { user, profile, isLoading, logout, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const security = useAccountSecurity(user, ar, logout, setLocation, refreshProfile);
  const accountProfiles = useAccountProfiles(user, profile, refreshProfile, setLocation);
  const apiKeys = useApiKeys(user, profile?.plan, ar);
  const billing = useBillingStatus(user, profile);

  useEffect(() => {
    if (!isLoading && !user) setLocation('/login');
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPlan = profile?.plan || 'free';
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Navbar activeView="builder" />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 text-start">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">{ar ? 'إعدادات الحساب' : 'Account Settings'}</h1>
          <p className="text-sm text-neutral-500 mt-1">{ar ? 'إدارة الهوية، والأمان، والاشتراكات، ومفاتيح API لبيئة عملك.' : 'Manage your master login, security, multi-profile limits, and developer credentials.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <AccountSidebar ar={ar} activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="md:col-span-9 space-y-6">
            {activeTab === 'profile' && <ProfileSettingsPanel ar={ar} {...security} />}
            {activeTab === 'billing' && <BillingSettingsPanel ar={ar} currentPlan={currentPlan} profilesCount={accountProfiles.profilesList.length} hasActiveSubscription={Boolean(billing.billingStatus?.hasActiveSubscription)} setLocation={setLocation} openBillingPortal={billing.openBillingPortal} />}
            {activeTab === 'profiles' && <ProfilesSettingsPanel ar={ar} profilesList={accountProfiles.profilesList} profilesLoading={accountProfiles.profilesLoading} setLocation={setLocation} selectProfile={accountProfiles.selectProfile} />}
            {activeTab === 'developers' && <DeveloperSettingsPanel ar={ar} currentPlan={currentPlan} setLocation={setLocation} {...apiKeys} />}
            {activeTab === 'security' && <SecuritySettingsPanel ar={ar} {...security} />}
          </div>
        </div>
      </main>
      <Footer onSelectView={view => {
        if (view === 'home') setLocation('/');
        else if (view === 'builder') setLocation('/studio');
        else if (view === 'templates') setLocation('/templates');
        else if (view === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}
