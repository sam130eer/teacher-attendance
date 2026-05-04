import { useState } from 'react';
import { Settings, Clock, School, Save, CheckCircle, KeyRound, Eye, EyeOff, UserCog } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCredentials, saveCredentials } from '../utils/auth';

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const [principalName, setPrincipalName] = useState(
    () => localStorage.getItem('principal_name') || ''
  );
  const [principalSaved, setPrincipalSaved] = useState(false);

  const stored = getCredentials();
  const [authForm, setAuthForm] = useState({ username: stored.username, password: '', confirmPassword: '' });
  const [authSaved, setAuthSaved] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPass, setShowPass] = useState(false);

  function handlePrincipalSubmit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('principal_name', principalName.trim());
    setPrincipalSaved(true);
    setTimeout(() => setPrincipalSaved(false), 2500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateSettings(form);
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
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            إعدادات الحضور
          </h2>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">وقت الحضور المقرر الافتراضي</label>
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

      <form onSubmit={handlePrincipalSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <UserCog size={16} className="text-slate-400" />
            بيانات مدير المدرسة
          </h2>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">اسم المدير</label>
            <input
              type="text"
              value={principalName}
              onChange={e => setPrincipalName(e.target.value)}
              placeholder="أدخل اسم مدير المدرسة"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">يظهر في نموذج حصر التأخر عند الطباعة</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Save size={15} />
            حفظ اسم المدير
          </button>
          {principalSaved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle size={16} />
              تم الحفظ
            </span>
          )}
        </div>
      </form>

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
