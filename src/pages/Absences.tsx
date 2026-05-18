import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, CheckCircle, Circle, FileUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import Badge from '../components/UI/Badge';
import DateInput from '../components/UI/DateInput';
import BulkImportRecordsModal from '../components/UI/BulkImportRecordsModal';
import type { Absence, AbsenceType } from '../types';
import { ABSENCE_TYPES } from '../types';
import { formatDate, calcAbsenceDays, getTodayStr } from '../utils/helpers';
import { formatHijri } from '../utils/hijri';

const emptyForm = {
  teacherId:    '',
  type:         'sick' as AbsenceType,
  startDate:    getTodayStr(),
  endDate:      getTodayStr(),
  notes:        '',
  addedInFares: false,
};

export default function Absences() {
  const { teachers, absences, addAbsence, updateAbsence, deleteAbsence } = useApp();
  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState<AbsenceType | ''>('');
  const [filterFrom,    setFilterFrom]    = useState('');
  const [filterTo,      setFilterTo]      = useState('');
  const [filterFares,   setFilterFares]   = useState<'' | 'yes' | 'no'>('');
  const [showModal,     setShowModal]     = useState(false);
  const [showImport,    setShowImport]    = useState(false);
  const [editing,       setEditing]       = useState<Absence | null>(null);
  const [form,          setForm]          = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [showFilters,   setShowFilters]   = useState(false);

  const filtered = absences.filter(a => {
    const teacher = teachers.find(t => t.id === a.teacherId);
    if (search      && !teacher?.name.includes(search))   return false;
    if (filterType  && a.type !== filterType)              return false;
    if (filterFrom  && a.startDate < filterFrom)           return false;
    if (filterTo    && a.startDate > filterTo)             return false;
    if (filterFares === 'yes' && !a.addedInFares)          return false;
    if (filterFares === 'no'  &&  a.addedInFares)          return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, startDate: getTodayStr(), endDate: getTodayStr() });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(a: Absence) {
    setEditing(a);
    setForm({
      teacherId:    a.teacherId,
      type:         a.type,
      startDate:    a.startDate,
      endDate:      a.endDate,
      notes:        a.notes,
      addedInFares: a.addedInFares ?? false,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.teacherId)                    e.teacherId = 'اختر المعلم';
    if (!form.startDate)                    e.startDate = 'تاريخ البداية مطلوب';
    if (!form.endDate)                      e.endDate   = 'تاريخ النهاية مطلوب';
    if (form.endDate < form.startDate)      e.endDate   = 'تاريخ النهاية يجب أن يكون بعد البداية';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    editing ? updateAbsence(editing.id, form) : addAbsence(form);
    setShowModal(false);
  }

  const notInFaresCount = absences.filter(a => !a.addedInFares).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">سجل الغياب</h1>
          <p className="text-slate-500 text-base mt-1">{absences.length} حالة غياب مسجلة</p>
        </div>
        <div className="flex gap-2">
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
            تسجيل غياب
          </button>
        </div>
      </div>

      {notInFaresCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
          <Circle size={16} className="shrink-0 text-amber-500" />
          <span>يوجد <strong>{notInFaresCount}</strong> سجل لم يُضف في نظام فارس بعد</span>
          <button
            onClick={() => { setShowFilters(true); setFilterFares('no'); }}
            className="mr-auto text-xs underline hover:no-underline"
          >
            عرضها
          </button>
        </div>
      )}

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
        <div className="bg-slate-50 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">نوع الإجازة</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value as AbsenceType | '')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">الكل</option>
              {Object.entries(ABSENCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">حالة فارس</label>
            <select value={filterFares} onChange={e => setFilterFares(e.target.value as '' | 'yes' | 'no')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">الكل</option>
              <option value="yes">تم الإضافة في فارس</option>
              <option value="no">لم يُضف في فارس</option>
            </select>
          </div>
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
                  <th className="text-right p-3 font-semibold text-slate-700">النوع</th>
                  <th className="text-right p-3 font-semibold text-slate-700">من</th>
                  <th className="text-right p-3 font-semibold text-slate-700">إلى</th>
                  <th className="text-right p-3 font-semibold text-slate-700">الأيام</th>
                  <th className="text-center p-3 font-semibold text-slate-700">فارس</th>
                  <th className="text-right p-3 font-semibold text-slate-700">ملاحظات</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => {
                  const teacher = teachers.find(t => t.id === a.teacherId);
                  return (
                    <tr key={a.id} className="odd:bg-white even:bg-blue-50 hover:bg-indigo-100/60 transition-colors">
                      <td className="p-3 font-medium">{teacher?.name || '—'}</td>
                      <td className="p-3"><Badge type={a.type} /></td>
                      <td className="p-3">
                        <p className="text-slate-700">{formatDate(a.startDate)}</p>
                        <p className="text-xs text-slate-400">{formatHijri(a.startDate)}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-slate-700">{formatDate(a.endDate)}</p>
                        <p className="text-xs text-slate-400">{formatHijri(a.endDate)}</p>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {calcAbsenceDays(a)} يوم
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {a.addedInFares
                          ? <CheckCircle size={16} className="text-green-500 mx-auto" />
                          : <Circle     size={16} className="text-slate-300 mx-auto" />
                        }
                      </td>
                      <td className="p-3 text-slate-500 max-w-36 truncate">{a.notes || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
        <Modal title={editing ? 'تعديل سجل الغياب' : 'تسجيل غياب جديد'} onClose={() => setShowModal(false)}>
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
              <label className="block text-base font-medium text-slate-700 mb-1">نوع الإجازة</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as AbsenceType }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ABSENCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <DateInput
              label="تاريخ البداية"
              value={form.startDate}
              onChange={v => setForm(f => ({ ...f, startDate: v }))}
              error={errors.startDate}
            />
            <DateInput
              label="تاريخ النهاية"
              value={form.endDate}
              onChange={v => setForm(f => ({ ...f, endDate: v }))}
              error={errors.endDate}
            />

            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            {/* Fares checkbox */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors select-none ${
              form.addedInFares ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={form.addedInFares}
                onChange={e => setForm(f => ({ ...f, addedInFares: e.target.checked }))}
                className="w-4 h-4 accent-green-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">تم إضافتها في فارس</p>
                <p className="text-xs text-slate-500">ضع علامة إذا تمت إضافة هذه الإجازة في نظام فارس</p>
              </div>
              {form.addedInFares && <CheckCircle size={18} className="text-green-500 mr-auto shrink-0" />}
            </label>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-blue-700">
                {editing ? 'حفظ التعديلات' : 'تسجيل الغياب'}
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
            <button onClick={() => { deleteAbsence(confirmDelete!); setConfirmDelete(null); }}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-red-700">حذف</button>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">إلغاء</button>
          </div>
        </Modal>
      )}

      {showImport && (
        <BulkImportRecordsModal
          recordType="absence"
          teachers={teachers}
          onImportAbsences={rows => rows.forEach(r => addAbsence(r))}
          onImportTardiness={() => {}}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
