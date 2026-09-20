import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  User,
  ShieldCheck,
  Key,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

type SettingsTab = 'profile' | 'billing' | 'profiles' | 'developers' | 'security';

export function AccountPage() {
  const { user, profile, isLoading, logout, refreshProfile } = useAuth();
  const { lang, isRtl: _isRtl } = useLanguage();
  const ar = lang === 'ar';
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profiles list state
  const [profilesList, setProfilesList] = useState<{ id: string; username: string; displayName: string; avatarUrl: string; plan: string; category: string }[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  // API keys state (for Studio users)
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; prefix: string; createdAt: number }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  // Billing state
  const [billingStatus, setBillingStatus] = useState<{ configured: boolean; plan: string; hasActiveSubscription: boolean } | null>(null);

  // Data export state
  const [exportLoading, setExportLoading] = useState(false);

  // Danger zone state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (user) {
      setNewEmail(user.email);
      // Fetch billing status
      api.billing.getStatus().then(setBillingStatus).catch(() => {});
      // Fetch user's profiles
      setProfilesLoading(true);
      api.studio.getProfiles()
        .then(res => setProfilesList(res.profiles || []))
        .catch(() => {})
        .finally(() => setProfilesLoading(false));
      // Fetch API keys if on Studio plan
      if (profile?.plan === 'studio') {
        api.studio.getApiKeys()
          .then(data => { if (data.keys) setApiKeys(data.keys); })
          .catch(() => {});
      }
    }
  }, [user, profile]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    setEmailLoading(true);
    try {
      const res = await api.auth.updateEmail(newEmail, emailPassword);
      setEmailMessage({ type: 'success', text: res.message || (ar ? 'تم تحديث البريد الإلكتروني بنجاح' : 'Email updated successfully') });
      setEmailPassword('');
      await refreshProfile();
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || (ar ? 'تعذر تحديث البريد الإلكتروني' : 'Failed to update email') });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: ar ? 'كلمتا المرور غير متطابقتين' : 'New passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: res.message || (ar ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || (ar ? 'تعذر تغيير كلمة المرور' : 'Failed to change password') });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyLoading(true);
    try {
      const data = await api.studio.createApiKey(newKeyName.trim());
      setGeneratedKey(data.apiKey);
      setApiKeys(prev => [data.key, ...prev]);
      setNewKeyName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create API key');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm(ar ? 'هل أنت متأكد من إلغاء هذا المفتاح؟' : 'Are you sure you want to revoke this API key?')) return;
    try {
      await api.studio.revokeApiKey(keyId);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    } catch {
      alert(ar ? 'تعذر إلغاء المفتاح' : 'Failed to revoke API key');
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const blob = await api.auth.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liinx-data-export-${user?.username || 'user'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.auth.deleteAccount(deletePassword);
      logout();
      setLocation('/');
    } catch (err: any) {
      setDeleteError(err.message || (ar ? 'تعذر حذف الحساب' : 'Failed to delete account'));
      setDeleteLoading(false);
    }
  };

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
        {/* Header Title */}
        <div className="mb-8 text-start">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {ar ? 'إعدادات الحساب' : 'Account Settings'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {ar ? 'إدارة الهوية، والأمان، والاشتراكات، ومفاتيح API لبيئة عملك.' : 'Manage your master login, security, multi-profile limits, and developer credentials.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <nav className="md:col-span-3 space-y-1 bg-white p-2 rounded-2xl border border-neutral-200 shadow-xs">
            {[
              { id: 'profile' as const, label: ar ? 'الملف الشخصي والحساب' : 'Profile & Login', icon: User },
              { id: 'billing' as const, label: ar ? 'الخطة والاشتراك' : 'Plans & Billing', icon: ShieldCheck },
              { id: 'profiles' as const, label: ar ? 'الملفات والمواقع المصغرة' : 'Profiles & Sites', icon: Layers },
              { id: 'developers' as const, label: ar ? 'المطورون ومفاتيح API' : 'API & Developer', icon: Key },
              { id: 'security' as const, label: ar ? 'الأمان وتصدير البيانات' : 'Security & Privacy', icon: Lock }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-start ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Content Area */}
          <div className="md:col-span-9 space-y-6">

            {/* TAB 1: Profile & Login */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Account Identity Card */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
                  <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-base font-bold text-neutral-900">{ar ? 'معلومات تسجيل الدخول' : 'Login Credentials'}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'البريد الإلكتروني الأساسي المقترن بحسابك.' : 'The primary email address associated with your account.'}</p>
                  </div>

                  <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الحالية للتأكيد' : 'Current Password (to confirm)'}</label>
                      <input
                        type="password"
                        required
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    {emailMessage && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${emailMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {emailMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{emailMessage.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {emailLoading ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'تحديث البريد الإلكتروني' : 'Update Email')}
                    </button>
                  </form>
                </div>

                {/* Change Password Card */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
                  <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-base font-bold text-neutral-900">{ar ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'تأكد من اختيار كلمة مرور قوية لا تقل عن 8 أحرف.' : 'Ensure your account is protected with a strong passphrase (min 8 characters).'}</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    {passwordMessage && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{passwordMessage.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? (ar ? 'جاري التحديث...' : 'Updating...') : (ar ? 'تغيير كلمة المرور' : 'Change Password')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: Plans & Billing */}
            {activeTab === 'billing' && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6 text-start">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">{ar ? 'الخطة والاشتراك' : 'Subscription & Quotas'}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'إدارة مستوى اشتراكك وحدود الحساب.' : 'Manage your current plan entitlement and account limits.'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-neutral-100 text-neutral-900 border border-neutral-200">
                    {currentPlan}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
                    <p className="text-xs text-neutral-500 font-medium">{ar ? 'الملفات المتاحة' : 'Profile Limit'}</p>
                    <p className="text-xl font-bold text-neutral-900 font-mono mt-1">
                      {currentPlan === 'studio' ? '25' : currentPlan === 'pro' ? '5' : '1'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{profilesList.length} {ar ? 'مستخدمة حالياً' : 'currently active'}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
                    <p className="text-xs text-neutral-500 font-medium">{ar ? 'النطاقات المخصصة' : 'Custom Domains'}</p>
                    <p className="text-xl font-bold text-neutral-900 font-mono mt-1">
                      {currentPlan === 'free' ? (ar ? 'غير متاح' : 'None') : (ar ? 'مشمول' : 'Included')}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{ar ? 'تشفير HTTPS وتوجيه DNS' : 'Managed DNS & SSL'}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
                    <p className="text-xs text-neutral-500 font-medium">{ar ? 'واجهة REST API' : 'REST API v1'}</p>
                    <p className="text-xl font-bold text-neutral-900 font-mono mt-1">
                      {currentPlan === 'studio' ? (ar ? 'مفعل' : 'Active') : (ar ? 'خطة Studio فقط' : 'Studio only')}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{ar ? 'مفاتيح API مع صلاحيات' : 'Headless integration'}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setLocation('/pricing')}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{currentPlan === 'free' ? (ar ? 'ترقية الخطة' : 'Upgrade Plan') : (ar ? 'تغيير الخطة' : 'Change Plan')}</span>
                  </button>

                  {billingStatus?.hasActiveSubscription && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.billing.createPortalSession();
                          if (res.url) window.location.href = res.url;
                        } catch {
                          alert('Billing portal unavailable');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{ar ? 'بوابة فواتير Stripe' : 'Manage on Stripe'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Profiles & Sites */}
            {activeTab === 'profiles' && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">{ar ? 'الملفات والمواقع المصغرة' : 'Your Profiles & Mini-Sites'}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'قائمة بجميع المواقع المصغرة التابعة لحسابك.' : 'All public handles and links managed under this master account.'}</p>
                  </div>
                  <button
                    onClick={() => setLocation('/studio?tab=settings')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
                  >
                    {ar ? 'إنشاء ملف جديد' : '+ New Profile'}
                  </button>
                </div>

                {profilesLoading ? (
                  <div className="py-6 text-center text-xs text-neutral-400 font-mono">Loading profiles...</div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {profilesList.map(p => (
                      <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-700 overflow-hidden">
                            {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : p.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900">@{p.username}</p>
                            <p className="text-[11px] text-neutral-500">{p.displayName} • {p.category || 'Creator'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/@${p.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
                            title="View live page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => {
                              api.studio.selectProfile(p.id).then(() => {
                                refreshProfile().then(() => setLocation('/studio'));
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                          >
                            {ar ? 'تحرير في الاستوديو' : 'Edit in Studio'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: API & Developer */}
            {activeTab === 'developers' && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6 text-start">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-base font-bold text-neutral-900">{ar ? 'واجهة البرمجة ومفاتيح API' : 'REST API v1 Access'}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'أتمتة تحديث الروابط ونشر المحتوى برمجياً.' : 'Manage headless API keys for programmatic publishing and link synchronization.'}</p>
                </div>

                {currentPlan !== 'studio' ? (
                  <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{ar ? 'ميزة حصرية لخطة Studio' : 'Exclusive to Studio Plan'}</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {ar ? 'تتطلب واجهة REST API v1 الترقية إلى خطة Studio لتوليد مفاتيح تشغيل مؤتمتة.' : 'Public REST API keys are available exclusively on the Studio tier. Upgrade your account to unlock headless CMS and CI/CD pipelines.'}
                    </p>
                    <button
                      onClick={() => setLocation('/pricing')}
                      className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>{ar ? 'ترقية إلى Studio' : 'Upgrade to Studio'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Create New Key Form */}
                    <form onSubmit={handleCreateApiKey} className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        placeholder={ar ? 'اسم المفتاح (مثال: GitHub Action)' : 'Key name (e.g. Website Sync)'}
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                      <button
                        type="submit"
                        disabled={keyLoading || !newKeyName.trim()}
                        className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {keyLoading ? '...' : (ar ? 'إنشاء مفتاح' : 'Create Key')}
                      </button>
                    </form>

                    {generatedKey && (
                      <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2 font-mono text-xs">
                        <p className="text-amber-400 font-bold">{ar ? 'انسخ مفتاحك الآن (لن يظهر مجدداً):' : 'Copy your API key now (it will never be displayed again):'}</p>
                        <div className="flex items-center justify-between gap-2 p-2 bg-neutral-800 rounded-xl">
                          <code className="text-[11px] truncate">{generatedKey}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKey);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }}
                            className="p-1.5 hover:bg-neutral-700 rounded-lg text-neutral-300 hover:text-white"
                          >
                            {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Keys list */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-neutral-700 uppercase font-mono">{ar ? 'المفاتيح النشطة' : 'Active Keys'}</h3>
                      {apiKeys.length === 0 ? (
                        <p className="text-xs text-neutral-400">{ar ? 'لا توجد مفاتيح نشطة حالياً.' : 'No active API keys created yet.'}</p>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {apiKeys.map(k => (
                            <div key={k.id} className="py-2.5 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-neutral-900">{k.name}</p>
                                <p className="text-[11px] font-mono text-neutral-400">{k.prefix}</p>
                              </div>
                              <button
                                onClick={() => handleRevokeApiKey(k.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                              >
                                {ar ? 'إلغاء المفتاح' : 'Revoke'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Security & Privacy */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Data Portability / Export */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
                  <div className="border-b border-neutral-100 pb-4">
                    <h2 className="text-base font-bold text-neutral-900">{ar ? 'تصدير كامل بيانات الحساب' : 'Account Data Portability (JSON)'}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'تنزيل حزمة كاملة لجميع ملفاتك، وصفحاتك، وعناصرك، ومشتركيك بصيغة مفتوحة.' : 'Download a complete export of all your profiles, sub-pages, blocks, and subscribers with zero lock-in.'}</p>
                  </div>

                  <button
                    onClick={handleExportData}
                    disabled={exportLoading}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-neutral-500" />
                    <span>{exportLoading ? (ar ? 'جاري التصدير...' : 'Exporting...') : (ar ? 'تنزيل حزمة البيانات (.json)' : 'Download Account Archive (.json)')}</span>
                  </button>
                </div>

                {/* Danger Zone: Account Deletion */}
                <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs space-y-4 text-start">
                  <div className="border-b border-rose-100 pb-4">
                    <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span>{ar ? 'منطقة الحذف النهائي' : 'Permanent Account Deletion'}</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {ar ? 'حذف هذا الحساب سيؤدي إلى إلغاء اشتراكاتك، وحذف كافة الصفحات والروابط والوسائط بشكل دائم لا يمكن استرجاعه.' : 'Deleting your account cancels all subscriptions and permanently removes all profiles, media, and subscriber data.'}
                    </p>
                  </div>

                  <div className="space-y-3 max-w-md">
                    <p className="text-xs text-neutral-600 font-medium">
                      {ar ? 'أدخل كلمة مرورك الحالية واكتب DELETE لتأكيد الحذف:' : 'Enter your current password and type DELETE to confirm deletion:'}
                    </p>
                    <label className="block text-xs font-medium text-neutral-700" htmlFor="delete-account-password">
                      {ar ? 'كلمة المرور الحالية' : 'Current password'}
                    </label>
                    <input
                      id="delete-account-password"
                      type="password"
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <label className="block text-xs font-medium text-neutral-700" htmlFor="delete-account-confirmation">
                      {ar ? 'اكتب DELETE للتأكيد' : 'Type DELETE to confirm'}
                    </label>
                    <input
                      id="delete-account-confirmation"
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs font-mono font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />

                    {deleteError && (
                      <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
                    )}

                    <button
                      type="button"
                      disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deleteLoading}
                      onClick={handleDeleteAccount}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? (ar ? 'جاري الحذف...' : 'Deleting Account...') : (ar ? 'تأكيد وحذف الحساب نهائياً' : 'Permanently Delete Account')}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
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
