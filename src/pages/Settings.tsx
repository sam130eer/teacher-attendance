import { useState, useRef } from 'react';
import { Settings, Clock, School, Save, CheckCircle, KeyRound, Eye, EyeOff, Download, Upload, UserCog, AlertTriangle, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCredentials, saveCredentials } from '../utils/auth';
import { supabase } from '../lib/supabase';
import type { Teacher, Absence, Tardiness } from '../types';

interface BackupData {
  exportedAt: string;
  teachers: Teacher[];
  absences: Absence[];
  tardiness: Tardiness[];
}

export default function SettingsPage() {
  const { settings, updateSettings, teachers, absences, tardiness } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const [principalName, setPrincipalName] = useState(() => settings.principalName || '');

  const stored = getCredentials();
  const [authForm, setAuthForm] = useState({ username: stored.username, password: '', confirmPassword: '' });
  const [authSaved, setAuthSaved] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [backupMsg, setBackupMsg]       = useState('');
  const [backupError, setBackupError]   = useState('');
  const [importedData, setImportedData] = useState<BackupData | null>(null);
  const [restoring, setRestoring]       = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('school_name', form.schoolName.trim());
    updateSettings({ ...form, principalName: principalName.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    if (!authForm.username.trim()) { setAuthError('اسم المستخدم مطلوب'); return; }
    if (authForm.password && authForm.password !== authForm.confirmPassword) {
      setAuthError('كلمتا المرور غير متطابقتين');
      return;
    }
    saveCredentials({
      username: authForm.username.trim(),
      password: authForm.password || getCredentials().password,
    });
    setAuthForm(f => ({ ...f, password: '', confirmPassword: '' }));
    setAuthSaved(true);
    setTimeout(() => setAuthSaved(false), 2500);
  }

  function handleExport() {
    const data = {
      exportedAt: new Date().toISOString(),
      teachers,
      absences,
      tardiness,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupMsg('');
    setBackupError('');
    setImportedData(null);
    setConfirmRestore(false);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data.teachers) || !Array.isArray(data.absences) || !Array.isArray(data.tardiness)) {
          setBackupError('الملف غير صالح أو تالف');
          return;
        }
        setImportedData(data as BackupData);
        setBackupMsg(`${data.teachers.length} معلم — ${data.absences.length} غياب — ${data.tardiness.length} تأخير`);
      } catch {
        setBackupError('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleRestore() {
    if (!importedData) return;
    setRestoring(true);
    setBackupError('');
    try {
      // Delete all existing records (order matters: children first)
      await supabase.from('tardiness').delete().neq('id', '');
      await supabase.from('absences').delete().neq('id', '');
      await supabase.from('teachers').delete().neq('id', '');

      // Insert teachers
      if (importedData.teachers.length > 0) {
        const { error } = await supabase.from('teachers').insert(
          importedData.teachers.map(t => ({
            id: t.id, name: t.name, national_id: t.nationalId,
            specialty: t.specialty, phone: t.phone ?? '',
            created_at: t.createdAt,
          }))
        );
        if (error) throw error;
      }

      // Insert absences
      if (importedData.absences.length > 0) {
        const { error } = await supabase.from('absences').insert(
          importedData.absences.map(a => ({
            id: a.id, teacher_id: a.teacherId, type: a.type,
            start_date: a.startDate, end_date: a.endDate,
            notes: a.notes ?? '', added_in_fares: a.addedInFares ?? false,
            created_at: a.createdAt,
          }))
        );
        if (error) throw error;
      }

      // Insert tardiness
      if (importedData.tardiness.length > 0) {
        const { error } = await supabase.from('tardiness').insert(
          importedData.tardiness.map(r => ({
            id: r.id, teacher_id: r.teacherId, date: r.date,
            scheduled_time: r.scheduledTime, actual_time: r.actualTime,
            notes: r.notes ?? '', created_at: r.createdAt,
          }))
        );
        if (error) throw error;
      }

      setBackupMsg('تم الاسترجاع بنجاح — سيتم تحديث الصفحة...');
      setImportedData(null);
      setConfirmRestore(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackupError('فشل الاسترجاع: ' + msg);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Settings size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">الإعدادات</h1>
          <p className="text-slate-500 text-sm mt-0.5">ضبط إعدادات النظام العامة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <School size={16} className="text-slate-400" />
            إعدادات المدرسة
          </h2>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">اسم المدرسة</label>
            <input
              type="text"
              value={form.schoolName}
              onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
              placeholder="أدخل اسم المدرسة"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">يظهر في التقارير وشاشة الدخول</p>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1 flex items-center gap-2">
              <UserCog size={14} className="text-slate-400" />
              اسم مدير المدرسة
            </label>
            <input
              type="text"
              value={principalName}
              onChange={e => setPrincipalName(e.target.value)}
              placeholder="أدخل اسم مدير المدرسة"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">يظهر في نموذج حصر التأخر عند الطباعة</p>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              وقت الحضور المقرر الافتراضي
            </label>
            <input
              type="time"
              value={form.defaultScheduledTime}
              onChange={e => setForm(f => ({ ...f, defaultScheduledTime: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">يُستخدم كقيمة افتراضية عند تسجيل تأخير جديد</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Save size={15} />
            حفظ الإعدادات
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle size={16} />
              تم الحفظ
            </span>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Download size={16} className="text-slate-400" />
          النسخ الاحتياطي والاسترجاع
        </h2>
        <p className="text-sm text-slate-500">تصدير أو استرجاع جميع البيانات (المعلمون، الغياب، التأخير).</p>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">تصدير</p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={15} />
            تصدير نسخة احتياطية
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">استرجاع</p>
          <button
            onClick={() => { setImportedData(null); setBackupMsg(''); setBackupError(''); setConfirmRestore(false); fileRef.current?.click(); }}
            className="flex items-center gap-2 border border-slate-200 px-5 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors"
          >
            <Upload size={15} />
            اختر ملف احتياطي
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          {backupMsg && !backupError && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle size={15} className="text-green-500 shrink-0" />
                <span>{backupMsg}</span>
              </div>

              {importedData && !confirmRestore && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2 text-amber-800 text-sm">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>سيتم <strong>حذف جميع البيانات الحالية</strong> واستبدالها بالنسخة الاحتياطية. هذا الإجراء لا يمكن التراجع عنه.</span>
                  </div>
                  <button
                    onClick={() => setConfirmRestore(true)}
                    className="text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                  >
                    نعم، أفهم — أريد الاستمرار
                  </button>
                </div>
              )}

              {importedData && confirmRestore && (
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-base font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw size={15} className={restoring ? 'animate-spin' : ''} />
                  {restoring ? 'جارٍ الاسترجاع...' : 'استرجاع البيانات'}
                </button>
              )}
            </div>
          )}

          {backupError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{backupError}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleAuthSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <KeyRound size={16} className="text-slate-400" />
            بيانات تسجيل الدخول
          </h2>

          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">اسم المستخدم</label>
            <input
              type="text"
              value={authForm.username}
              onChange={e => { setAuthForm(f => ({ ...f, username: e.target.value })); setAuthError(''); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={authForm.password}
                onChange={e => { setAuthForm(f => ({ ...f, password: e.target.value })); setAuthError(''); }}
                placeholder="اتركها فارغة للإبقاء على الحالية"
                className="w-full border border-slate-300 rounded-lg px-3 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authForm.password && (
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">تأكيد كلمة المرور</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={authForm.confirmPassword}
                onChange={e => { setAuthForm(f => ({ ...f, confirmPassword: e.target.value })); setAuthError(''); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {authError && <p className="text-sm text-red-600">{authError}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Save size={15} />
            حفظ بيانات الدخول
          </button>
          {authSaved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle size={16} />
              تم الحفظ
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
