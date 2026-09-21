import type { ProfileSettingsPanelProps } from './accountPanelTypes';
import { PanelFeedback } from './PanelFeedback';

export function ProfileSettingsPanel(props: ProfileSettingsPanelProps) {
  const { ar } = props;
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="text-base font-bold text-neutral-900">{ar ? 'معلومات تسجيل الدخول' : 'Login Credentials'}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'البريد الإلكتروني الأساسي المقترن بحسابك.' : 'The primary email address associated with your account.'}</p>
        </div>
        <form onSubmit={props.handleUpdateEmail} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="account-email" className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input id="account-email" type="email" name="email" dir="ltr" autoComplete="email" required value={props.newEmail} onChange={event => props.setNewEmail(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900" />
          </div>
          <div>
            <label htmlFor="account-email-password" className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الحالية للتأكيد' : 'Current Password (to confirm)'}</label>
            <input id="account-email-password" type="password" name="current_password" autoComplete="current-password" required value={props.emailPassword} onChange={event => props.setEmailPassword(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900" />
          </div>
          <PanelFeedback message={props.emailMessage} />
          <button type="submit" disabled={props.emailLoading} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50">
            {props.emailLoading ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'تحديث البريد الإلكتروني' : 'Update Email')}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="text-base font-bold text-neutral-900">{ar ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'تأكد من اختيار كلمة مرور قوية لا تقل عن 8 أحرف.' : 'Ensure your account is protected with a strong passphrase (min 8 characters).'}</p>
        </div>
        <form onSubmit={props.handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="account-current-password" className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الحالية' : 'Current Password'}</label>
            <input id="account-current-password" type="password" name="current_password" autoComplete="current-password" required value={props.currentPassword} onChange={event => props.setCurrentPassword(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900" />
          </div>
          <div>
            <label htmlFor="account-new-password" className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'كلمة المرور الجديدة' : 'New Password'}</label>
            <input id="account-new-password" type="password" name="new_password" autoComplete="new-password" required minLength={8} value={props.newPassword} onChange={event => props.setNewPassword(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900" />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="block text-xs font-semibold text-neutral-700 mb-1.5">{ar ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
            <input id="account-confirm-password" type="password" name="confirm_password" autoComplete="new-password" required minLength={8} value={props.confirmPassword} onChange={event => props.setConfirmPassword(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900" />
          </div>
          <PanelFeedback message={props.passwordMessage} />
          <button type="submit" disabled={props.passwordLoading} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50">
            {props.passwordLoading ? (ar ? 'جاري التحديث...' : 'Updating...') : (ar ? 'تغيير كلمة المرور' : 'Change Password')}
          </button>
        </form>
      </div>
    </div>
  );
}
