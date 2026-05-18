import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, CreditCard, Users, ClipboardList, CalendarX, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import BulkImportModal from '../components/UI/BulkImportModal';
import type { Teacher } from '../types';

const empty = { name: '', nationalId: '', specialty: '' };

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export default function Teachers() {
  const { teachers, absences, tardiness, addTeacher, updateTeacher, deleteTeacher } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = teachers
    .filter(t => t.name.includes(search) || t.nationalId.includes(search) || t.specialty.includes(search))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({ name: t.name, nationalId: t.nationalId, specialty: t.specialty });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.nationalId.trim()) e.nationalId = 'السجل المدني مطلوب';
    else if (!/^\d{10}$/.test(form.nationalId)) e.nationalId = 'يجب أن يكون 10 أرقام';
    if (!form.specialty.trim()) e.specialty = 'التخصص مطلوب';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editing) updateTeacher(editing.id, form);
    else addTeacher(form);
    setShowModal(false);
  }

  function handleBulkImport(rows: Omit<Teacher, 'id' | 'createdAt'>[]) {
    rows.forEach(r => addTeacher(r));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">المعلمون</h1>
          <p className="text-slate-500 text-base mt-1">{teachers.length} معلم مسجل</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ClipboardList size={16} />
            إضافة جماعية
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            إضافة معلم
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute top-3 right-3 text-slate-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو السجل المدني أو التخصص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-400" size={32} />
          </div>
          <p className="text-slate-500 font-medium mb-1">{search ? 'لا توجد نتائج للبحث' : 'لا يوجد معلمون مسجلون'}</p>
          <p className="text-slate-400 text-sm mb-4">{search ? 'جرب كلمة بحث مختلفة' : 'ابدأ بإضافة معلمين للنظام'}</p>
          {!search && (
            <button
              onClick={() => setShowBulk(true)}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline"
            >
              <ClipboardList size={14} />
              إضافة جماعية من Excel
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t, idx) => {
            const absCount = absences.filter(a => a.teacherId === t.id).length;
            const tarCount = tardiness.filter(x => x.teacherId === t.id).length;
            const color = avatarColor(t.name);
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                {/* Top color strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />

                <div className="p-5">
                  {/* Avatar + actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                      {t.name[0]}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-slate-800 text-base leading-tight mb-3">{t.name}</h3>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <BookOpen size={13} className="text-slate-400 shrink-0" />
                      <span>{t.specialty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CreditCard size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono tracking-wide">{t.nationalId}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <div className="flex-1 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                      <CalendarX size={13} className="text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs text-red-400">غياب</p>
                        <p className="text-sm font-bold text-red-600">{absCount}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                      <Clock size={13} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs text-amber-400">تأخير</p>
                        <p className="text-sm font-bold text-amber-600">{tarCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">الاسم الكامل</label>
              <input type="text" value={form.name} placeholder="أحمد محمد العمري"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">رقم السجل المدني</label>
              <input type="text" value={form.nationalId} placeholder="1234567890"
                onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.nationalId ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.nationalId && <p className="text-xs text-red-500 mt-1">{errors.nationalId}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">التخصص</label>
              <input type="text" value={form.specialty} placeholder="رياضيات"
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.specialty ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-indigo-700">
                {editing ? 'حفظ التعديلات' : 'إضافة المعلم'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBulk && (
        <BulkImportModal
          existingTeachers={teachers}
          onImport={handleBulkImport}
          onClose={() => setShowBulk(false)}
        />
      )}

      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)} size="sm">
          <p className="text-slate-600 text-sm mb-4">
            هل أنت متأكد من حذف هذا المعلم؟ سيتم حذف جميع سجلات الغياب والتأخير المرتبطة به.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { deleteTeacher(confirmDelete!); setConfirmDelete(null); }}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-red-700"
            >
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
