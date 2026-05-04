import { useState, useRef, useCallback } from 'react';
import {
  ClipboardPaste, Upload, CheckCircle, XCircle, Info,
  FileSpreadsheet, ChevronDown, ChevronUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import type { Teacher, Absence, Tardiness, AbsenceType } from '../../types';
import { ABSENCE_TYPES } from '../../types';
import {
  parseDate, parseAbsenceType, parseFares, findTeacher, splitCells,
} from '../../utils/importParsers';
import { useApp } from '../../context/AppContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type RecordType = 'absence' | 'tardiness';

interface AbsenceRow {
  kind: 'absence';
  rowNum: number;
  teacher: Teacher | null;
  teacherQuery: string;
  type: AbsenceType;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  addedInFares: boolean;
  errors: string[];
}

interface TardinessRow {
  kind: 'tardiness';
  rowNum: number;
  teacher: Teacher | null;
  teacherQuery: string;
  date: string | null;
  durationMins: number | null;
  notes: string;
  errors: string[];
}

type ParsedRow = AbsenceRow | TardinessRow;

interface Props {
  recordType: RecordType;
  teachers: Teacher[];
  onImportAbsences: (rows: Omit<Absence, 'id' | 'createdAt'>[]) => void;
  onImportTardiness: (rows: Omit<Tardiness, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HEADER_KW = ['اسم', 'معلم', 'نوع', 'تاريخ', 'وقت', 'مدة', 'name', 'type', 'date', 'time', 'teacher'];
function looksLikeHeader(cells: string[]) {
  return cells.some(c => HEADER_KW.some(k => c.toLowerCase().includes(k)));
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function parseDurationMins(raw: string): number | null {
  const cleaned = raw.trim().replace(/[^\d]/g, '');
  const n = parseInt(cleaned);
  if (isNaN(n) || n <= 0 || n > 420) return null;
  return n;
}

// ─── Row parsers ─────────────────────────────────────────────────────────────

function parseAbsenceRow(cells: string[], rowNum: number, teachers: Teacher[]): AbsenceRow {
  const [col0 = '', col1 = '', col2 = '', col3 = '', col4 = '', col5 = ''] = cells;
  const errors: string[] = [];

  const teacher = findTeacher(col0, teachers);
  if (!col0.trim()) errors.push('اسم/رقم المعلم مطلوب');
  else if (!teacher) errors.push(`لم يُعثر على معلم: "${col0}"`);

  const type = parseAbsenceType(col1) ?? 'sick';

  const startDate = parseDate(col2);
  if (!col2.trim()) errors.push('تاريخ البداية مطلوب');
  else if (!startDate) errors.push(`تاريخ غير صحيح: "${col2}"`);

  const endDate = col3.trim() ? parseDate(col3) : startDate;
  if (col3.trim() && !endDate) errors.push(`تاريخ النهاية غير صحيح: "${col3}"`);
  if (startDate && endDate && endDate < startDate) errors.push('تاريخ النهاية قبل البداية');

  return {
    kind: 'absence', rowNum, teacher, teacherQuery: col0,
    type, startDate, endDate,
    notes: col4.trim(),
    addedInFares: parseFares(col5),
    errors,
  };
}

function parseTardinessRow(cells: string[], rowNum: number, teachers: Teacher[]): TardinessRow {
  const [col0 = '', col1 = '', col2 = '', col3 = ''] = cells;
  const errors: string[] = [];

  const teacher = findTeacher(col0, teachers);
  if (!col0.trim()) errors.push('اسم/رقم المعلم مطلوب');
  else if (!teacher) errors.push(`لم يُعثر على معلم: "${col0}"`);

  const date = parseDate(col1);
  if (!col1.trim()) errors.push('التاريخ مطلوب');
  else if (!date) errors.push(`تاريخ غير صحيح: "${col1}"`);

  const durationMins = parseDurationMins(col2);
  if (!col2.trim()) errors.push('مدة التأخير مطلوبة');
  else if (!durationMins) errors.push(`مدة غير صحيحة: "${col2}" — أدخل عدد الدقائق`);

  return {
    kind: 'tardiness', rowNum, teacher, teacherQuery: col0,
    date, durationMins,
    notes: col3.trim(),
    errors,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BulkImportRecordsModal({
  recordType, teachers, onImportAbsences, onImportTardiness, onClose,
}: Props) {
  const { settings } = useApp();
  const [inputMode, setInputMode] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAbsence = recordType === 'absence';
  const title = isAbsence ? 'استيراد غياب' : 'استيراد تأخير';
  const scheduledTime = settings.defaultScheduledTime;

  // ── Parse raw text ──
  const parseText = useCallback((raw: string) => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    let start = 0;
    if (looksLikeHeader(splitCells(lines[0]))) start = 1;
    const result: ParsedRow[] = lines.slice(start).map((line, i) => {
      const cells = splitCells(line);
      return isAbsence
        ? parseAbsenceRow(cells, i + start + 1, teachers)
        : parseTardinessRow(cells, i + start + 1, teachers);
    });
    setRows(result);
    setParsed(true);
  }, [isAbsence, teachers]);

  // ── Handle file upload ──
  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows2d: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
      const tsv = rows2d.map(row => row.map(String).join('\t')).join('\n');
      setText(tsv);
      setParsed(false);
      setRows([]);
      parseText(tsv);
    };
    reader.readAsArrayBuffer(file);
  }

  function onFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Import ──
  const validRows = rows.filter(r => r.errors.length === 0);
  const errorRows = rows.filter(r => r.errors.length > 0);

  function handleImport() {
    if (isAbsence) {
      onImportAbsences(
        (validRows as AbsenceRow[]).map(r => ({
          teacherId: r.teacher!.id,
          type: r.type,
          startDate: r.startDate!,
          endDate: r.endDate!,
          notes: r.notes,
          addedInFares: r.addedInFares,
        }))
      );
    } else {
      onImportTardiness(
        (validRows as TardinessRow[]).map(r => ({
          teacherId: r.teacher!.id,
          date: r.date!,
          scheduledTime,
          actualTime: addMinutes(scheduledTime, r.durationMins!),
          notes: r.notes,
        }))
      );
    }
    setImportedCount(validRows.length);
    setImportDone(true);
  }

  // ── Success screen ──
  if (importDone) {
    return (
      <Modal title={title} onClose={onClose} size="sm">
        <div className="text-center py-4">
          <CheckCircle size={52} className="text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-800">تم الاستيراد بنجاح</p>
          <p className="text-slate-500 text-sm mt-1">تم إضافة <strong>{importedCount}</strong> سجل</p>
          {errorRows.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">تم تخطي {errorRows.length} صف يحتوي على أخطاء</p>
          )}
          <button onClick={onClose} className="mt-5 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
            إغلاق
          </button>
        </div>
      </Modal>
    );
  }

  // ── Column guide ──
  const absenceGuide = [
    { col: '1', name: 'المعلم', desc: 'الاسم الكامل أو رقم السجل المدني', req: true },
    { col: '2', name: 'نوع الإجازة', desc: 'مرضية / اضطرارية / مولود / وفاة قريب / مرافقة مريض', req: false },
    { col: '3', name: 'تاريخ البداية', desc: 'ميلادي (2025/04/10) أو هجري (1446/10/12)', req: true },
    { col: '4', name: 'تاريخ النهاية', desc: 'مثل البداية — إذا فارغ يُعامَل ليوم واحد', req: false },
    { col: '5', name: 'ملاحظات', desc: 'أي ملاحظات اختيارية', req: false },
    { col: '6', name: 'فارس', desc: 'نعم / لا', req: false },
  ];

  const tardinessGuide = [
    { col: '1', name: 'الاسم', desc: 'الاسم الكامل أو رقم السجل المدني', req: true },
    { col: '2', name: 'التاريخ', desc: 'ميلادي (2025/04/10) أو هجري (1446/10/12)', req: true },
    { col: '3', name: 'مدة التأخير', desc: 'عدد الدقائق — مثال: 45 أو 30', req: true },
    { col: '4', name: 'السبب', desc: 'سبب التأخير (اختياري)', req: false },
  ];

  const guide = isAbsence ? absenceGuide : tardinessGuide;
  const sampleAbsence = `أحمد محمد العمري\tمرضية\t1446/10/01\t1446/10/03\tمراجعة طبية\tنعم\nفاطمة علي الزهراني\tاضطرارية\t2025/04/15\t2025/04/15`;
  const sampleTardiness = `أحمد محمد العمري\t2025/04/15\t40\tازدحام مروري\nفاطمة علي الزهراني\t1446/10/05\t25\t`;

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <div className="space-y-4">

        {/* Method tabs */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden text-sm">
          {(['paste', 'file'] as const).map(m => (
            <button key={m} type="button"
              onClick={() => { setInputMode(m); setParsed(false); setRows([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${inputMode === m ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              {m === 'paste' ? <><ClipboardPaste size={15} /> لصق من Excel</> : <><FileSpreadsheet size={15} /> رفع ملف Excel / CSV</>}
            </button>
          ))}
        </div>

        {/* Scheduled time notice (tardiness only) */}
        {!isAbsence && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-indigo-700">
            <Info size={15} className="shrink-0" />
            وقت الحضور المقرر المُستخدم: <strong>{scheduledTime}</strong>
            <span className="text-indigo-400 text-xs">(يمكن تعديله من الإعدادات)</span>
          </div>
        )}

        {/* Guide */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setShowGuide(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <span className="flex items-center gap-2"><Info size={14} className="text-indigo-500" />ترتيب الأعمدة المطلوب</span>
            {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showGuide && (
            <div className="border-t border-slate-100 p-4 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="border border-slate-200 px-2 py-1 text-right font-semibold">العمود</th>
                      <th className="border border-slate-200 px-2 py-1 text-right font-semibold">الحقل</th>
                      <th className="border border-slate-200 px-2 py-1 text-right font-semibold">القيم المقبولة</th>
                      <th className="border border-slate-200 px-2 py-1 text-center font-semibold">إلزامي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.map(g => (
                      <tr key={g.col}>
                        <td className="border border-slate-200 px-2 py-1 text-center font-mono text-slate-500">{g.col}</td>
                        <td className="border border-slate-200 px-2 py-1 font-medium">{g.name}</td>
                        <td className="border border-slate-200 px-2 py-1 text-slate-500">{g.desc}</td>
                        <td className="border border-slate-200 px-2 py-1 text-center">
                          {g.req ? <span className="text-red-500 font-bold">✱</span> : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">مثال:</p>
                <pre dir="ltr" className="text-xs bg-slate-50 rounded-lg p-2 border border-slate-200 overflow-x-auto text-slate-600 leading-5">
                  {isAbsence ? sampleAbsence : sampleTardiness}
                </pre>
              </div>
              {isAbsence && (
                <p className="text-xs text-slate-400">أنواع الإجازة: {Object.values(ABSENCE_TYPES).join(' / ')}</p>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        {inputMode === 'paste' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الصق البيانات هنا</label>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setParsed(false); setRows([]); }}
              rows={7}
              dir="ltr"
              placeholder={isAbsence ? sampleAbsence : sampleTardiness}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{text ? `${text.split('\n').filter(Boolean).length} سطر` : 'في انتظار البيانات…'}</p>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onFileDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <FileSpreadsheet size={32} className={`mx-auto mb-2 ${dragging ? 'text-indigo-500' : 'text-slate-300'}`} />
            {fileName ? (
              <p className="text-sm font-medium text-indigo-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-600">اسحب الملف هنا أو انقر للاختيار</p>
                <p className="text-xs text-slate-400 mt-1">يدعم ملفات Excel (.xlsx, .xls) و CSV</p>
              </>
            )}
          </div>
        )}

        {/* Parse button */}
        {!parsed && (
          <button
            type="button"
            onClick={() => parseText(text)}
            disabled={!text.trim()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ClipboardPaste size={16} />
            تحليل البيانات
          </button>
        )}

        {/* Results */}
        {parsed && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              {[
                { label: 'إجمالي الصفوف', value: rows.length, cls: 'bg-slate-50 text-slate-700' },
                { label: 'صالح للاستيراد', value: validRows.length, cls: 'bg-green-50 text-green-600' },
                { label: 'يحتوي أخطاء', value: errorRows.length, cls: errorRows.length ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">معاينة البيانات</span>
                <button type="button" onClick={() => { setParsed(false); setRows([]); setText(''); setFileName(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600">تعديل</button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-slate-100">
                    <tr>
                      <th className="p-2 text-right text-slate-500 font-medium">#</th>
                      <th className="p-2 text-right text-slate-500 font-medium">المعلم</th>
                      {isAbsence ? (
                        <>
                          <th className="p-2 text-right text-slate-500 font-medium">النوع</th>
                          <th className="p-2 text-right text-slate-500 font-medium">البداية</th>
                          <th className="p-2 text-right text-slate-500 font-medium">النهاية</th>
                          <th className="p-2 text-center text-slate-500 font-medium">فارس</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 text-right text-slate-500 font-medium">التاريخ</th>
                          <th className="p-2 text-right text-slate-500 font-medium">المدة</th>
                          <th className="p-2 text-right text-slate-500 font-medium">وقت الحضور</th>
                          <th className="p-2 text-right text-slate-500 font-medium">السبب</th>
                        </>
                      )}
                      <th className="p-2 text-right text-slate-500 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(row => (
                      <tr key={row.rowNum} className={row.errors.length ? 'bg-red-50' : 'hover:bg-green-50/40'}>
                        <td className="p-2 text-slate-400">{row.rowNum}</td>
                        <td className="p-2 font-medium max-w-28 truncate">
                          {row.teacher?.name ?? <span className="text-red-400 italic">{row.teacherQuery || 'فارغ'}</span>}
                        </td>
                        {isAbsence ? (() => {
                          const r = row as AbsenceRow;
                          return (
                            <>
                              <td className="p-2">{ABSENCE_TYPES[r.type]}</td>
                              <td className="p-2 font-mono">{r.startDate ?? <span className="text-red-400">!</span>}</td>
                              <td className="p-2 font-mono">{r.endDate ?? <span className="text-red-400">!</span>}</td>
                              <td className="p-2 text-center">{r.addedInFares ? '✓' : '—'}</td>
                            </>
                          );
                        })() : (() => {
                          const r = row as TardinessRow;
                          return (
                            <>
                              <td className="p-2 font-mono">{r.date ?? <span className="text-red-400">!</span>}</td>
                              <td className="p-2">
                                {r.durationMins != null
                                  ? <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">{r.durationMins} د</span>
                                  : <span className="text-red-400">!</span>}
                              </td>
                              <td className="p-2 font-mono text-indigo-600">
                                {r.durationMins != null ? addMinutes(scheduledTime, r.durationMins) : '—'}
                              </td>
                              <td className="p-2 text-slate-500 max-w-24 truncate">{r.notes || '—'}</td>
                            </>
                          );
                        })()}
                        <td className="p-2">
                          {row.errors.length === 0
                            ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={13} /> صالح</span>
                            : (
                              <span className="flex items-center gap-1 text-red-500 cursor-help" title={row.errors.join(' | ')}>
                                <XCircle size={13} />
                                <span className="truncate max-w-32">{row.errors[0]}{row.errors.length > 1 ? ` +${row.errors.length - 1}` : ''}</span>
                              </span>
                            )
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={15} />
                استيراد {validRows.length > 0 ? `(${validRows.length} سجل)` : ''}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
