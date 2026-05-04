import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Clock, FileUp, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import BulkImportRecordsModal from '../components/UI/BulkImportRecordsModal';
import AccountabilityModal from '../components/UI/AccountabilityModal';
import type { Tardiness as TardinessType } from '../types';
import { formatDate, formatTime, calcTardinessMinutes, getTodayStr } from '../utils/helpers';

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
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
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
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
