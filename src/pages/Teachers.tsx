import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, CreditCard, Users, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import BulkImportModal from '../components/UI/BulkImportModal';
import type { Teacher } from '../types';

const empty = { name: '', nationalId: '', specialty: '' };

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
    if (editing) {
      updateTeacher(editing.id, form);
    } else {
      addTeacher(form);
    }
    setShowModal(false);
  }

  function handleBulkImport(rows: Omit<Teacher, 'id' | 'createdAt'>[]) {
    rows.forEach(r => addTeacher(r));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">المعلمون</h1>
          <p className="text-slate-500 text-base mt-1">{teachers.length} معلم مسجل</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50 transition-colors"
          >
            <ClipboardList size={16} />
            إضافة جماعية
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            إضافة معلم
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute top-3 right-3 text-slate-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو السجل المدني أو التخصص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 mb-3">{search ? 'لا توجد نتائج' : 'لا يوجد معلمون مسجلون'}</p>
          {!search && (
            <button
              onClick={() => setShowBulk(true)}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ClipboardList size={14} />
              إضافة جماعية من Excel
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => {
            const absCount = absences.filter(a => a.teacherId === t.id).length;
            const tarCount = tardiness.filter(x => x.teacherId === t.id).length;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {t.name[0]}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{t.name}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen size={12} />
                    {t.specialty}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CreditCard size={12} />
                    {t.nationalId}
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-500"><strong className="text-slate-700">{absCount}</strong> غياب</span>
                  <span className="text-xs text-slate-500"><strong className="text-slate-700">{tarCount}</strong> تأخير</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">الاسم الكامل</label>
              <input type="text" value={form.name} placeholder="أحمد محمد العمري"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">رقم السجل المدني</label>
              <input type="text" value={form.nationalId} placeholder="1234567890"
                onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nationalId ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.nationalId && <p className="text-xs text-red-500 mt-1">{errors.nationalId}</p>}
            </div>
            <div>
              <label className="block text-base font-medium text-slate-700 mb-1">التخصص</label>
              <input type="text" value={form.specialty} placeholder="رياضيات"
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.specialty ? 'border-red-400' : 'border-slate-300'}`} />
              {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-blue-700">
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
