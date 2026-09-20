import { Building2, Gift, Key, Layers, Lock, ShieldCheck, User } from 'lucide-react';

export type SettingsTab = 'profile' | 'billing' | 'profiles' | 'referrals' | 'agency-referrals' | 'developers' | 'security';

export function AccountSidebar({ ar, activeTab, setActiveTab }: { ar: boolean; activeTab: SettingsTab; setActiveTab: (tab: SettingsTab) => void }) {
  const tabs = [
    { id: 'profile' as const, label: ar ? 'الملف الشخصي والحساب' : 'Profile & Login', icon: User },
    { id: 'billing' as const, label: ar ? 'الخطة والاشتراك' : 'Plans & Billing', icon: ShieldCheck },
    { id: 'profiles' as const, label: ar ? 'الملفات والمواقع المصغرة' : 'Profiles & Sites', icon: Layers },
    { id: 'referrals' as const, label: ar ? 'دعوة المبدعين' : 'Refer creators', icon: Gift },
    { id: 'agency-referrals' as const, label: ar ? 'إحالات الوكالات' : 'Agency referrals', icon: Building2 },
    { id: 'developers' as const, label: ar ? 'المطورون ومفاتيح API' : 'API & Developer', icon: Key },
    { id: 'security' as const, label: ar ? 'الأمان وتصدير البيانات' : 'Security & Privacy', icon: Lock }
  ];

  return (
    <nav className="md:col-span-3 space-y-1 bg-white p-2 rounded-2xl border border-neutral-200 shadow-xs">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isSelected = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-start ${isSelected ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
