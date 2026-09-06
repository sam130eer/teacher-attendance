import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, LogOut, MessageCircle, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import type { EarlyDeparture, Teacher } from '../types';
import { calcEarlyDepartureMinutes, formatDate, formatTime, getTodayStr } from '../utils/helpers';

const empty = { teacherId: '', date: getTodayStr(), scheduledEndTime: '14:00', actualDepartureTime: '', notes: '' };

function sendWhatsApp(phone: string, msg: string) {
  const num = phone.replace(/\D/g, '').replace(/^0/, '966');
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}


function hijriDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function dayName(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'long' });
  } catch { return ''; }
}

function buildForm18HTML(
  teacher: Teacher,
  r: EarlyDeparture,
  schoolName: string,
  principalName: string,
  origin: string,
) {
  const hDate = hijriDate(r.date);
  const day   = dayName(r.date);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>نموذج مساءلة - ${teacher.name}</title>
<style>
  @page { size: A4 portrait; margin: 1.2cm 1.5cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Tahoma, sans-serif; font-size: 10pt; direction: rtl; color: #000; background: #fff; }

  /* ─── Header ─── */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 6px; }
  .gov { font-size: 9pt; line-height: 2; text-align: right; }
  .logo { text-align: center; }
  .logo img { height: 80px; }
  .ref { font-size: 8.5pt; line-height: 2; text-align: left; }

  /* ─── Form title bar ─── */
  .title-bar { display: flex; justify-content: space-between; background: #c0c0c0; border: 1px solid #000; padding: 4px 8px; margin-bottom: 0; font-weight: bold; font-size: 9.5pt; }

  /* ─── Info rows ─── */
  .info-row { display: flex; border: 1px solid #000; border-top: none; }
  .info-label { background: #c0c0c0; font-weight: bold; padding: 4px 8px; min-width: 90px; border-left: 1px solid #000; font-size: 9pt; white-space: nowrap; }
  .info-val { padding: 4px 8px; flex: 1; font-size: 9.5pt; }

  /* ─── Teacher table ─── */
  .t-tbl { width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none; margin-bottom: 10px; }
  .t-tbl th { background: #c0c0c0; border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; font-weight: bold; text-align: center; }
  .t-tbl td { border: 1px solid #000; padding: 4px 6px; font-size: 9pt; text-align: center; }

  /* ─── Body ─── */
  .salutation { margin: 6px 0 4px; font-size: 10pt; }
  .body-line  { margin: 3px 0; font-size: 9.5pt; line-height: 1.7; }
  .violation-box { border: 1.5px solid #000; background: #f0f0f0; padding: 5px 10px; margin: 4px 0; font-size: 10pt; font-weight: bold; }
  .violation-normal { border: 1px solid #ccc; padding: 4px 10px; margin: 3px 0; font-size: 9.5pt; color: #555; }
  .req { margin: 8px 0 4px; font-size: 9.5pt; }

  /* ─── Signatures ─── */
  .sig-row { display: flex; justify-content: flex-end; gap: 40px; margin: 6px 0; font-size: 9pt; }
  .sig-item { display: flex; gap: 6px; align-items: center; }
  .sig-line { display: inline-block; border-bottom: 1px solid #000; width: 120px; }

  /* ─── Divider ─── */
  .divider { border: none; border-top: 1.5px dashed #555; margin: 10px 0; }

  /* ─── Reply section ─── */
  .reply-label { font-size: 9.5pt; margin: 4px 0; }
  .dot-line { border-bottom: 1px dotted #000; min-height: 16px; margin: 6px 0; }

  /* ─── Decision ─── */
  .decision-row { display: flex; align-items: center; gap: 16px; font-size: 9.5pt; margin: 6px 0; }
  .checkbox { display: inline-flex; align-items: center; gap: 4px; }
  .checkbox-box { width: 12px; height: 12px; border: 1.5px solid #000; display: inline-block; }

  /* ─── Note ─── */
  .note { font-size: 8pt; color: #444; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 4px; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="gov">
    <div>المملكة العربية السعودية</div>
    <div>وزارة التعليم</div>
    <div>الإدارة العامة للتعليم بالمنطقة الشرقية</div>
  </div>
  <div class="logo">
    <img src="${origin}/ministry-logo.png" alt="شعار" onerror="this.style.display='none'" />
  </div>
  <div class="ref">
    <div>الرقم :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
    <div>التاريخ : ${hijriDate(new Date().toISOString().split('T')[0])}هـ</div>
    <div>المشفوعات :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
    <div>مدرسة : ${schoolName}</div>
  </div>
</div>

<!-- Form title -->
<div class="title-bar">
  <span>اسم النموذج : مساءلة على تأخر / انصراف</span>
  <span>نموذج رقم ( 18 )</span>
</div>
<div class="title-bar" style="background:#e8e8e8;font-weight:normal;font-size:9pt;">
  <span>رمز النموذج ( : و.م.ع.ن ) 02 - 02 - .</span>
</div>

<!-- School -->
<div class="info-row">
  <div class="info-label">المدرسة</div>
  <div class="info-val">${schoolName}</div>
</div>

<!-- National ID -->
<div class="info-row">
  <div class="info-label">السجل المدني</div>
  <div class="info-val">${teacher.nationalId}</div>
</div>

<!-- Teacher info table -->
<table class="t-tbl">
  <tr>
    <th>الاسم</th>
    <th>التخصص</th>
    <th>المستوى / الرتبة</th>
    <th>رقم الوظيفة</th>
    <th>العمل الحالي</th>
  </tr>
  <tr>
    <td>${teacher.name}</td>
    <td>${teacher.specialty}</td>
    <td></td>
    <td></td>
    <td>معلم</td>
  </tr>
</table>

<!-- Body -->
<div class="salutation">المكرم المعلم / <strong>${teacher.name}</strong> &nbsp;.وفقه الله</div>
<div class="body-line">السلام عليكم ورحمة الله وبركاته وبعد:</div>
<div class="body-line">إنه في يوم <strong>${day}</strong> الموافق <strong>${hDate}</strong>هـ&nbsp; اتضح ما يلي:</div>

<div class="violation-box">انصرافكم مبكراً قبل نهاية العمل</div>

<div class="req">عليه نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،، ولكم تحياتي</div>

<div class="sig-row">
  <div class="sig-item">التاريخ : ${hijriDate(new Date().toISOString().split('T')[0])}هـ</div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">مدير المدرسة : <strong>${principalName || '________________'}</strong></div>
</div>

<hr class="divider">

<!-- Teacher response -->
<div class="reply-label">المكرم / مدير مدرسة <strong>${schoolName}</strong>&nbsp;&nbsp;وفقه الله</div>
<div class="body-line">السلام عليكم ورحمة الله وبركاته</div>
<div class="body-line">أفيدكم أن أسباب ذلك ما يلي:</div>
<div class="dot-line"></div>
<div class="dot-line"></div>
<div class="dot-line"></div>

<div class="sig-row" style="justify-content:space-between;margin-top:8px;">
  <div class="sig-item">الاسم : <strong>${teacher.name}</strong></div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">التاريخ&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;1448هـ</div>
</div>

<hr class="divider">

<!-- Decision -->
<div class="decision-row">
  <span>رأي مدير المدرسة</span>
  <span class="checkbox"><span class="checkbox-box"></span> عذره مقبول</span>
  <span class="checkbox"><span class="checkbox-box"></span> عذره غير مقبول ويحسم عليه</span>
</div>

<div class="sig-row">
  <div class="sig-item">التاريخ&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;1448هـ</div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">مدير المدرسة : <strong>${principalName || '________________'}</strong></div>
</div>

<div class="note">ملاحظة : ترفق بطاقة المساءلة مع أصل القرار في حالة عدم قبول العذر لحفظها بملفه بالإدارة ، وأصله لملفه بالمدرسة</div>

</body>
</html>`;
}

export default function EarlyDeparturePage() {
  const { teachers, earlyDepartures, settings, addEarlyDeparture, updateEarlyDeparture, deleteEarlyDeparture } = useApp();
  const weekSchedule = settings.weekSchedule ?? {};

  const [search, setSearch]               = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editing, setEditing]             = useState<EarlyDeparture | null>(null);
  const [form, setForm]                   = useState({ ...empty, scheduledEndTime: settings.defaultScheduledTime || '14:00' });
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const filtered = earlyDepartures
    .filter(r => {
      const teacher = teachers.find(t => t.id === r.teacherId);
      const matchName    = !search        || teacher?.name.includes(search);
      const matchTeacher = !filterTeacher || r.teacherId === filterTeacher;
      return matchName && matchTeacher;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function getScheduledEndForDate(dateStr: string): string {
    if (!dateStr) return '14:00';
    const day = new Date(dateStr).getDay().toString();
    return weekSchedule[day] || '14:00';
  }

  function openAdd() {
    setEditing(null);
    const today = getTodayStr();
    setForm({ ...empty, scheduledEndTime: getScheduledEndForDate(today) });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(r: EarlyDeparture) {
    setEditing(r);
    setForm({ teacherId: r.teacherId, date: r.date, scheduledEndTime: r.scheduledEndTime, actualDepartureTime: r.actualDepartureTime, notes: r.notes });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.teacherId) e.teacherId = 'اختر المعلم';
    if (!form.date) e.date = 'التاريخ مطلوب';
    if (!form.scheduledEndTime) e.scheduledEndTime = 'وقت الانصراف المقرر مطلوب';
    if (!form.actualDepartureTime) e.actualDepartureTime = 'وقت الانصراف الفعلي مطلوب';
    else if (form.actualDepartureTime >= form.scheduledEndTime)
      e.actualDepartureTime = 'وقت الانصراف الفعلي يجب أن يكون قبل الوقت المقرر';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setSaveError(null);
    const err = editing
      ? await updateEarlyDeparture(editing.id, form)
      : await addEarlyDeparture(form);
    setSaving(false);
    if (err) { setSaveError(err); return; }
    setShowModal(false);
  }

  function handlePrint(r: EarlyDeparture) {
    const teacher = teachers.find(t => t.id === r.teacherId);
    if (!teacher) return;
    const html = buildForm18HTML(teacher, r, settings.schoolName, settings.principalName, window.location.origin);
    const win = window.open('', '_blank', 'width=860,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  function handleWhatsApp(r: EarlyDeparture) {
    const teacher = teachers.find(t => t.id === r.teacherId);
    if (!teacher?.phone) return;
    const mins      = calcEarlyDepartureMinutes(r);
    const totalMins = earlyDepartures.filter(x => x.teacherId === r.teacherId).reduce((s, x) => s + calcEarlyDepartureMinutes(x), 0);
    const times     = earlyDepartures.filter(x => x.teacherId === r.teacherId).length;
    const msg = `معلمنا الفاضل ${teacher.name} حفظه الله،\nنود إشعاركم بأنه تم تسجيل انصرافكم المبكر بتاريخ ${r.date} بمقدار (${mins}) دقيقة.\n\nإجمالي الانصراف المبكر المسجل عليكم حتى الآن:\n• عدد المرات: ${times} مرة\n• إجمالي الدقائق: ${totalMins} دقيقة\n\nنرجو الالتزام بوقت الانصراف المقرر، وفقكم الله.`;
    sendWhatsApp(teacher.phone, msg);
  }

  const totalMins = filtered.reduce((s, r) => s + calcEarlyDepartureMinutes(r), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">الانصراف المبكر</h1>
          <p className="text-slate-500 text-base mt-1">{filtered.length} سجل — إجمالي {totalMins} دقيقة</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          إضافة انصراف مبكر
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute top-3 right-3 text-slate-400" />
          <input type="text" placeholder="بحث بالاسم..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          />
        </div>
        <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm">
          <option value="">كل المعلمين</option>
          {sorted.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogOut className="text-slate-400" size={32} />
          </div>
          <p className="text-slate-500 font-medium mb-1">لا توجد سجلات انصراف مبكر</p>
          <p className="text-slate-400 text-sm">اضغط "إضافة انصراف مبكر" لتسجيل سجل جديد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">المعلم</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">التاريخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">وقت الانصراف المقرر</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">وقت الانصراف الفعلي</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الدقائق</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">ملاحظات</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const teacher = teachers.find(t => t.id === r.teacherId);
                  const mins = calcEarlyDepartureMinutes(r);
                  return (
                    <tr key={r.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{teacher?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{formatTime(r.scheduledEndTime)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{formatTime(r.actualDepartureTime)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">{mins} د</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-40 truncate">{r.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handlePrint(r)} title="طباعة نموذج المساءلة"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Printer size={14} />
                          </button>
                          {teacher?.phone && (
                            <button onClick={() => handleWhatsApp(r)} title="واتساب"
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <MessageCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => openEdit(r)} title="تعديل"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(r.id)} title="حذف"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-slate-600">الإجمالي</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold">{totalMins} د</span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'تعديل انصراف مبكر' : 'إضافة انصراف مبكر'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المعلم</label>
              <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.teacherId ? 'border-red-400' : 'border-slate-300'}`}>
                <option value="">-- اختر المعلم --</option>
                {sorted.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.teacherId && <p className="text-xs text-red-500 mt-1">{errors.teacherId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, scheduledEndTime: getScheduledEndForDate(e.target.value) }))}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.date ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">وقت الانصراف المقرر</label>
              <input type="time" value={form.scheduledEndTime}
                onChange={e => setForm(f => ({ ...f, scheduledEndTime: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.scheduledEndTime ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.scheduledEndTime && <p className="text-xs text-red-500 mt-1">{errors.scheduledEndTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">وقت الانصراف الفعلي</label>
              <input type="time" value={form.actualDepartureTime}
                onChange={e => setForm(f => ({ ...f, actualDepartureTime: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.actualDepartureTime ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.actualDepartureTime && <p className="text-xs text-red-500 mt-1">{errors.actualDepartureTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات (اختياري)</label>
              <textarea value={form.notes} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 break-words">
                <strong>خطأ في الحفظ:</strong> {saveError}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'جاري الحفظ...' : (editing ? 'حفظ التعديلات' : 'إضافة')}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-slate-600 text-sm mb-4">هل أنت متأكد من حذف هذا السجل؟</p>
          <div className="flex gap-3">
            <button onClick={() => { deleteEarlyDeparture(confirmDelete!); setConfirmDelete(null); }}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-red-700">
              حذف
            </button>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
