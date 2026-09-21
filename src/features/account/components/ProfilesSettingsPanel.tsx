import { ExternalLink } from 'lucide-react';
import type { ProfilesSettingsPanelProps } from './accountPanelTypes';
import { PanelLoading } from './PanelFeedback';

export function ProfilesSettingsPanel({ ar, profilesList, profilesLoading, setLocation, selectProfile }: ProfilesSettingsPanelProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">{ar ? 'الملفات والمواقع المصغرة' : 'Your Profiles & Mini-Sites'}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'قائمة بجميع المواقع المصغرة التابعة لحسابك.' : 'All public handles and links managed under this master account.'}</p>
        </div>
        <button onClick={() => setLocation('/studio?tab=settings')} className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer">
          {ar ? 'إنشاء ملف جديد' : '+ New Profile'}
        </button>
      </div>
      {profilesLoading ? <PanelLoading>Loading profiles...</PanelLoading> : (
        <div className="divide-y divide-neutral-100">
          {profilesList.map(profile => (
            <div key={profile.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-700 overflow-hidden">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" width={36} height={36} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : profile.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900" dir="ltr">@{profile.username}</p>
                  <p className="text-xs text-neutral-500">{profile.displayName} • {profile.category || 'Creator'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/@${profile.username}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors" title="View live page">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => { void selectProfile(profile.id); }} className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer">
                  {ar ? 'تحرير في الاستوديو' : 'Edit in Studio'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
