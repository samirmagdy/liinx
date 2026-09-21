import { Trash2, Download } from 'lucide-react';
import type { SecuritySettingsPanelProps } from './accountPanelTypes';

export function SecuritySettingsPanel(props: SecuritySettingsPanelProps) {
  const { ar } = props;
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-start">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="text-base font-bold text-neutral-900">{ar ? 'تصدير بيانات الحساب' : 'Export your account data'}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'نزّل ملف JSON يتضمن بيانات الحساب والملفات الشخصية والصفحات والعناصر ومشتركي النشرة وردود النماذج. لا يتضمن ملفات الوسائط نفسها أو سجل التحليلات الخام.' : 'Download a JSON file with account metadata, profiles, pages, blocks, newsletter subscribers, and form submissions. Uploaded file binaries and raw analytics history are not included.'}</p>
        </div>
        <button onClick={props.handleExportData} disabled={props.exportLoading} className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50">
          <Download className="w-4 h-4 text-neutral-500" />
          <span>{props.exportLoading ? (ar ? 'جاري التصدير...' : 'Exporting...') : (ar ? 'تنزيل بيانات الحساب (.json)' : 'Download account data (.json)')}</span>
        </button>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs space-y-4 text-start">
        <div className="border-b border-rose-100 pb-4">
          <h2 className="text-base font-bold text-rose-700 flex items-center gap-2"><Trash2 className="w-4 h-4" /><span>{ar ? 'منطقة الحذف النهائي' : 'Permanent Account Deletion'}</span></h2>
          <p className="text-xs text-neutral-500 mt-0.5">{ar ? 'حذف هذا الحساب سيؤدي إلى إلغاء اشتراكاتك، وحذف كافة الصفحات والروابط والوسائط بشكل دائم لا يمكن استرجاعه.' : 'Deleting your account cancels all subscriptions and permanently removes all profiles, media, and subscriber data.'}</p>
        </div>
        <div className="space-y-3 max-w-md">
          <p className="text-xs text-neutral-600 font-medium">{ar ? 'أدخل كلمة مرورك الحالية واكتب DELETE لتأكيد الحذف:' : 'Enter your current password and type DELETE to confirm deletion:'}</p>
          <label className="block text-xs font-medium text-neutral-700" htmlFor="delete-account-password">{ar ? 'كلمة المرور الحالية' : 'Current password'}</label>
          <input id="delete-account-password" type="password" autoComplete="current-password" value={props.deletePassword} onChange={event => props.setDeletePassword(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs focus:ring-2 focus-visible:ring-rose-500" />
          <label className="block text-xs font-medium text-neutral-700" htmlFor="delete-account-confirmation">{ar ? 'اكتب DELETE للتأكيد' : 'Type DELETE to confirm'}</label>
          <input id="delete-account-confirmation" type="text" value={props.deleteConfirmText} onChange={event => props.setDeleteConfirmText(event.target.value)} placeholder="DELETE" className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs font-mono font-bold text-rose-900 focus:ring-2 focus-visible:ring-rose-500" />
          {props.deleteError && <p className="text-xs text-rose-600 font-medium">{props.deleteError}</p>}
          <button type="button" disabled={props.deleteConfirmText !== 'DELETE' || !props.deletePassword || props.deleteLoading} onClick={props.handleDeleteAccount} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {props.deleteLoading ? (ar ? 'جاري الحذف...' : 'Deleting Account...') : (ar ? 'تأكيد وحذف الحساب نهائياً' : 'Permanently Delete Account')}
          </button>
        </div>
      </div>
    </div>
  );
}
