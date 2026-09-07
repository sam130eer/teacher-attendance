import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Clock, FileUp, Printer, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import BulkImportRecordsModal from '../components/UI/BulkImportRecordsModal';
import AccountabilityModal from '../components/UI/AccountabilityModal';
import type { Tardiness as TardinessType, Teacher } from '../types';
import { formatDate, formatTime, calcTardinessMinutes, getTodayStr } from '../utils/helpers';

function localDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function hijriDate(dateStr: string) {
  try { return localDate(dateStr).toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

function dayName(dateStr: string) {
  try { return localDate(dateStr).toLocaleDateString('ar-SA', { weekday: 'long' }); }
  catch { return ''; }
}

function todayHijri() {
  try { return new Date().toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

function todayHijriYear() {
  try { return new Date().toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric' }); }
  catch { return '1448'; }
}

function fmtTime12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function buildForm18TardinessHTML(
  teacher: Teacher,
  t: TardinessType,
  schoolName: string,
  principalName: string,
  origin: string,
) {
  const hDate = hijriDate(t.date);
  const day   = dayName(t.date);
  const actualTimeLabel = fmtTime12(t.actualTime);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>نموذج مساءلة - ${teacher.name}</title>
<style>
  @page { size: A4 portrait; margin: 1.2cm 1.5cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Tahoma, sans-serif; font-size: 10pt; direction: rtl; color: #000; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 6px; }
  .gov { font-size: 9pt; line-height: 2; text-align: right; }
  .logo { text-align: center; }
  .logo img { height: 80px; }
  .ref { font-size: 8.5pt; line-height: 2; text-align: left; }
  .title-bar { display: flex; justify-content: space-between; background: #c0c0c0; border: 1px solid #000; padding: 4px 8px; margin-bottom: 0; font-weight: bold; font-size: 9.5pt; }
  .info-row { display: flex; border: 1px solid #000; border-top: none; }
  .info-label { background: #c0c0c0; font-weight: bold; padding: 4px 8px; min-width: 90px; border-left: 1px solid #000; font-size: 9pt; white-space: nowrap; }
  .info-val { padding: 4px 8px; flex: 1; font-size: 9.5pt; }
  .t-tbl { width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none; margin-bottom: 10px; }
  .t-tbl th { background: #c0c0c0; border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; font-weight: bold; text-align: center; }
  .t-tbl td { border: 1px solid #000; padding: 4px 6px; font-size: 9pt; text-align: center; }
  .salutation { margin: 6px 0 4px; font-size: 10pt; }
  .body-line  { margin: 3px 0; font-size: 9.5pt; line-height: 1.7; }
  .violation-box { border: 1.5px solid #000; background: #f0f0f0; padding: 5px 10px; margin: 4px 0; font-size: 10pt; font-weight: bold; }
  .violation-normal { border: 1px solid #ccc; padding: 4px 10px; margin: 3px 0; font-size: 9.5pt; color: #555; }
  .req { margin: 8px 0 4px; font-size: 9.5pt; }
  .sig-row { display: flex; justify-content: flex-end; gap: 40px; margin: 6px 0; font-size: 9pt; }
  .sig-item { display: flex; gap: 6px; align-items: center; }
  .sig-line { display: inline-block; border-bottom: 1px solid #000; width: 120px; }
  .divider { border: none; border-top: 1.5px dashed #555; margin: 10px 0; }
  .reply-label { font-size: 9.5pt; margin: 4px 0; }
  .dot-line { border-bottom: 1px dotted #000; min-height: 16px; margin: 6px 0; }
  .decision-row { display: flex; align-items: center; gap: 16px; font-size: 9.5pt; margin: 6px 0; }
  .checkbox { display: inline-flex; align-items: center; gap: 4px; }
  .checkbox-box { width: 12px; height: 12px; border: 1.5px solid #000; display: inline-block; }
  .note { font-size: 8pt; color: #444; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 4px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

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
    <div>التاريخ : ${todayHijri()}هـ</div>
    <div>المشفوعات :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
    <div>مدرسة : ${schoolName}</div>
  </div>
</div>

<div class="title-bar">
  <span>اسم النموذج : مساءلة على تأخر / انصراف</span>
  <span>نموذج رقم ( 18 )</span>
</div>
<div class="title-bar" style="background:#e8e8e8;font-weight:normal;font-size:9pt;">
  <span>رمز النموذج ( : و.م.ع.ن ) 02 - 02 - .</span>
</div>

<div class="info-row">
  <div class="info-label">المدرسة</div>
  <div class="info-val">${schoolName}</div>
</div>
<div class="info-row">
  <div class="info-label">السجل المدني</div>
  <div class="info-val">${teacher.nationalId}</div>
</div>

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

<div class="salutation">المكرم المعلم / <strong>${teacher.name}</strong> &nbsp;.وفقه الله</div>
<div class="body-line">السلام عليكم ورحمة الله وبركاته وبعد:</div>
<div class="body-line">إنه في يوم <strong>${day}</strong> الموافق <strong>${hDate}</strong>هـ&nbsp; اتضح ما يلي:</div>

<div class="violation-box">تأخركم من بداية العمل، وحضوركم الساعة ( ${actualTimeLabel} )</div>

<div class="req">عليه نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،، ولكم تحياتي</div>

<div class="sig-row">
  <div class="sig-item">التاريخ : ${todayHijri()}هـ</div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">مدير المدرسة : <strong>${principalName || '________________'}</strong></div>
</div>

<hr class="divider">

<div class="reply-label">المكرم / مدير مدرسة <strong>${schoolName}</strong>&nbsp;&nbsp;وفقه الله</div>
<div class="body-line">السلام عليكم ورحمة الله وبركاته</div>
<div class="body-line">أفيدكم أن أسباب ذلك ما يلي:</div>
<div class="dot-line"></div>
<div class="dot-line"></div>
<div class="dot-line"></div>

<div class="sig-row" style="justify-content:space-between;margin-top:8px;">
  <div class="sig-item">الاسم : <strong>${teacher.name}</strong></div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">التاريخ&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;${todayHijriYear()}هـ</div>
</div>

<hr class="divider">

<div class="decision-row">
  <span>رأي مدير المدرسة</span>
  <span class="checkbox"><span class="checkbox-box"></span> عذره مقبول</span>
  <span class="checkbox"><span class="checkbox-box"></span> عذره غير مقبول ويحسم عليه</span>
</div>

<div class="sig-row">
  <div class="sig-item">التاريخ&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;${todayHijriYear()}هـ</div>
  <div class="sig-item">التوقيع <span class="sig-line"></span></div>
  <div class="sig-item">مدير المدرسة : <strong>${principalName || '________________'}</strong></div>
</div>

<div class="note">ملاحظة : ترفق بطاقة المساءلة مع أصل القرار في حالة عدم قبول العذر لحفظها بملفه بالإدارة ، وأصله لملفه بالمدرسة</div>

</body>
</html>`;
}

const emptyForm = {
  teacherId: '',
  date: getTodayStr(),
  scheduledTime: '07:30',
  actualTime: '08:00',
  notes: '',
};

export default function Tardiness() {
  const { teachers, tardiness, settings, addTardiness, updateTardiness, deleteTardiness } = useApp();
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAccountability, setShowAccountability] = useState(false);
  const [editing, setEditing] = useState<TardinessType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filtered = tardiness.filter(t => {
    const teacher = teachers.find(x => x.id === t.teacherId);
    if (search && !teacher?.name.includes(search)) return false;
    if (filterFrom && t.date < filterFrom) return false;
    if (filterTo && t.date > filterTo) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, date: getTodayStr(), scheduledTime: settings.defaultScheduledTime });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(t: TardinessType) {
    setEditing(t);
    setForm({ teacherId: t.teacherId, date: t.date, scheduledTime: t.scheduledTime, actualTime: t.actualTime, notes: t.notes });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.teacherId) e.teacherId = 'اختر المعلم';
    if (!form.date) e.date = 'التاريخ مطلوب';
    if (form.actualTime <= form.scheduledTime) e.actualTime = 'وقت الحضور يجب أن يكون بعد الوقت المحدد';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editing) {
      updateTardiness(editing.id, form);
    } else {
      addTardiness(form);
    }
    setShowModal(false);
  }

  function minBadge(mins: number) {
    const cls = mins >= 60 ? 'bg-red-100 text-red-700' : mins >= 30 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>+{mins} دقيقة</span>;
  }

  function handlePrint(t: TardinessType) {
    const teacher = teachers.find(x => x.id === t.teacherId);
    if (!teacher) return;
    const html = buildForm18TardinessHTML(teacher, t, settings.schoolName, settings.principalName, window.location.origin);
    const win = window.open('', '_blank', 'width=860,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  function sendWhatsApp(phone: string, msg: string) {
    const num = phone.replace(/\D/g, '').replace(/^0/, '966');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function whatsAppSingle(teacher: { name: string; phone: string }, t: TardinessType, mins: number, totalMins: number, times: number) {
    const msg = `معلمنا الفاضل ${teacher.name} حفظه الله،\nنود إشعاركم بأنه تم تسجيل تأخيركم بتاريخ ${t.date} لمدة (${mins}) دقيقة.\n\nإجمالي التأخير المسجل عليكم حتى الآن:\n• عدد المرات: ${times} مرة\n• إجمالي الدقائق: ${totalMins} دقيقة\n\nنرجو الالتزام بوقت الحضور المقرر، وفقكم الله.`;
    sendWhatsApp(teacher.phone, msg);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">سجل التأخير</h1>
          <p className="text-slate-500 text-base mt-1">{tardiness.length} حالة تأخير مسجلة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccountability(true)}
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            نموذج المساءلة
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors"
          >
            <FileUp size={16} />
            استيراد
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            تسجيل تأخير
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute top-3 right-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المعلم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <Filter size={15} />
          تصفية
        </button>
      </div>

      {showFilters && (
        <div className="bg-slate-50 rounded-xl p-4 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">من تاريخ</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">إلى تاريخ</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-slate-400">لا توجد سجلات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right p-3 font-semibold text-slate-700">المعلم</th>
                  <th className="text-right p-3 font-semibold text-slate-700">التاريخ</th>
                  <th className="text-right p-3 font-semibold text-slate-700">الوقت المقرر</th>
                  <th className="text-right p-3 font-semibold text-slate-700">وقت الحضور</th>
                  <th className="text-right p-3 font-semibold text-slate-700">مدة التأخير</th>
                  <th className="text-right p-3 font-semibold text-slate-700">ملاحظات</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => {
                  const teacher = teachers.find(x => x.id === t.teacherId);
                  const mins = calcTardinessMinutes(t);
                  const teacherTardiness = tardiness.filter(x => x.teacherId === t.teacherId);
                  const totalMins = teacherTardiness.reduce((s, x) => s + calcTardinessMinutes(x), 0);
                  return (
                    <tr key={t.id} className="odd:bg-white even:bg-blue-50 hover:bg-indigo-100/60 transition-colors">
                      <td className="p-3 font-medium">{teacher?.name || '—'}</td>
                      <td className="p-3 text-slate-600 text-base">{formatDate(t.date)}</td>
                      <td className="p-3 text-slate-600 text-base">
                        <span className="flex items-center gap-1"><Clock size={12} />{formatTime(t.scheduledTime)}</span>
                      </td>
                      <td className="p-3 text-slate-600 text-base">
                        <span className="flex items-center gap-1"><Clock size={12} />{formatTime(t.actualTime)}</span>
                      </td>
                      <td className="p-3">{minBadge(mins)}</td>
                      <td className="p-3 text-slate-500 max-w-40 truncate">{t.notes || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePrint(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="طباعة نموذج المساءلة"
                          >
                            <Printer size={14} />
                          </button>
                          {teacher?.phone && (
                            <button
                              onClick={() => whatsAppSingle(teacher, t, mins, totalMins, teacherTardiness.length)}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="إرسال رسالة واتساب"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'تعديل سجل التأخير' : 'تسجيل تأخير جديد'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">المعلم</label>
              <select
                value={form.teacherId}
                onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.teacherId ? 'border-red-400' : 'border-slate-300'}`}
              >
                <option value="">-- اختر المعلم --</option>
                {[...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ar')).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.teacherId && <p className="text-xs text-red-500 mt-1">{errors.teacherId}</p>}
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">التاريخ</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">الوقت المقرر</label>
                <input type="time" value={form.scheduledTime}
                  onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-1">وقت الحضور الفعلي</label>
                <input type="time" value={form.actualTime}
                  onChange={e => setForm(f => ({ ...f, actualTime: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.actualTime ? 'border-red-400' : 'border-slate-300'}`} />
                {errors.actualTime && <p className="text-xs text-red-500 mt-1">{errors.actualTime}</p>}
              </div>
            </div>

            {form.scheduledTime && form.actualTime && form.actualTime > form.scheduledTime && (
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                مدة التأخير: <strong>
                  {(parseInt(form.actualTime.split(':')[0]) * 60 + parseInt(form.actualTime.split(':')[1])) -
                    (parseInt(form.scheduledTime.split(':')[0]) * 60 + parseInt(form.scheduledTime.split(':')[1]))} دقيقة
                </strong>
              </div>
            )}

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="سبب التأخير..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-blue-700">
                {editing ? 'حفظ التعديلات' : 'تسجيل التأخير'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-slate-600 text-sm mb-4">هل أنت متأكد من حذف هذا السجل؟</p>
          <div className="flex gap-3">
            <button onClick={() => { deleteTardiness(confirmDelete!); setConfirmDelete(null); }}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-red-700">حذف</button>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">إلغاء</button>
          </div>
        </Modal>
      )}

      {showAccountability && (
        <AccountabilityModal onClose={() => setShowAccountability(false)} />
      )}

      {showImport && (
        <BulkImportRecordsModal
          recordType="tardiness"
          teachers={teachers}
          onImportAbsences={() => {}}
          onImportTardiness={rows => rows.forEach(r => addTardiness(r))}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
