import { useState, useCallback } from 'react';
import { ClipboardPaste, CheckCircle, XCircle, AlertCircle, Info, Upload } from 'lucide-react';
import Modal from './Modal';
import type { Teacher } from '../../types';

interface ParsedRow {
  rowNum: number;
  name: string;
  nationalId: string;
  specialty: string;
  errors: string[];
  isDuplicate: boolean;
}

interface Props {
  existingTeachers: Teacher[];
  onImport: (rows: Omit<Teacher, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}

const HEADER_KEYWORDS = ['اسم', 'سجل', 'تخصص', 'name', 'id', 'spec'];

function looksLikeHeader(cells: string[]): boolean {
  return cells.some(c => HEADER_KEYWORDS.some(k => c.toLowerCase().includes(k)));
}

function parseSeparator(line: string): string[] {
  // prefer tab (Excel/Sheets default), fall back to comma
  const tabParts = line.split('\t');
  if (tabParts.length >= 2) return tabParts.map(s => s.trim());
  return line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
}

function validateRow(
  cells: string[],
  rowNum: number,
  existingIds: Set<string>,
  seenIds: Set<string>,
): ParsedRow {
  const [name = '', nationalId = '', specialty = ''] = cells;
  const errors: string[] = [];

  if (!name.trim()) errors.push('الاسم مطلوب');
  if (!nationalId.trim()) errors.push('السجل المدني مطلوب');
  else if (!/^\d{10}$/.test(nationalId.trim())) errors.push('السجل المدني يجب أن يكون 10 أرقام');
  if (!specialty.trim()) errors.push('التخصص مطلوب');

  const isDuplicate = existingIds.has(nationalId.trim()) || seenIds.has(nationalId.trim());
  if (isDuplicate && nationalId.trim()) errors.push('السجل المدني مسجل مسبقاً');

  if (nationalId.trim()) seenIds.add(nationalId.trim());

  return { rowNum, name: name.trim(), nationalId: nationalId.trim(), specialty: specialty.trim(), errors, isDuplicate };
}

export default function BulkImportModal({ existingTeachers, onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const existingIds = new Set(existingTeachers.map(t => t.nationalId));

  const parse = useCallback(() => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const seenIds = new Set<string>();
    let startIndex = 0;
    const firstCells = parseSeparator(lines[0]);
    if (looksLikeHeader(firstCells)) startIndex = 1;

    const result: ParsedRow[] = lines.slice(startIndex).map((line, i) => {
      const cells = parseSeparator(line);
      return validateRow(cells, i + startIndex + 1, existingIds, seenIds);
    });

    setRows(result);
    setParsed(true);
  }, [text, existingIds]);

  const validRows = rows.filter(r => r.errors.length === 0);
  const errorRows = rows.filter(r => r.errors.length > 0);

  function handleImport() {
    onImport(validRows.map(r => ({
      name: r.name,
      nationalId: r.nationalId,
      specialty: r.specialty,
    })));
    setImportedCount(validRows.length);
    setImportDone(true);
  }

  if (importDone) {
    return (
      <Modal title="تم الاستيراد" onClose={onClose} size="sm">
        <div className="text-center py-4">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-800">تم إضافة {importedCount} معلم بنجاح</p>
          {errorRows.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">تم تخطي {errorRows.length} صف يحتوي على أخطاء</p>
          )}
          <button onClick={onClose} className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
            إغلاق
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="إضافة معلمين بالجملة" onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Guide */}
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <Info size={15} />
            تعليمات الاستخدام
          </div>
          <p className="mb-2">انسخ البيانات من Excel أو Google Sheets والصقها هنا. ترتيب الأعمدة:</p>
          <div className="grid grid-cols-3 gap-1 text-xs font-mono bg-white rounded-lg p-2 border border-blue-100">
            <span className="text-center font-bold">الاسم</span>
            <span className="text-center font-bold">السجل المدني</span>
            <span className="text-center font-bold">التخصص</span>
            <span className="text-center text-slate-500">أحمد العمري</span>
            <span className="text-center text-slate-500">1234567890</span>
            <span className="text-center text-slate-500">رياضيات</span>
          </div>
          <p className="mt-2 text-xs text-blue-600">✓ يدعم الفصل بالتبويب (Excel) أو الفاصلة · يتجاهل صف العناوين تلقائياً</p>
        </div>

        {/* Paste area */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الصق البيانات هنا</label>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setParsed(false); setRows([]); }}
            placeholder={`أحمد محمد العمري\t1234567890\tرياضيات\nفاطمة علي الزهراني\t2234567890\tعلوم`}
            rows={6}
            dir="ltr"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            {text ? `${text.split('\n').filter(Boolean).length} سطر` : 'في انتظار البيانات...'}
          </p>
        </div>

        {!parsed ? (
          <button
            onClick={parse}
            disabled={!text.trim()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ClipboardPaste size={16} />
            تحليل البيانات
          </button>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-slate-700">{rows.length}</p>
                <p className="text-slate-500 text-xs mt-0.5">إجمالي الصفوف</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
                <p className="text-slate-500 text-xs mt-0.5">صالح للاستيراد</p>
              </div>
              <div className={`rounded-xl p-3 ${errorRows.length ? 'bg-red-50' : 'bg-slate-50'}`}>
                <p className={`text-2xl font-bold ${errorRows.length ? 'text-red-500' : 'text-slate-400'}`}>{errorRows.length}</p>
                <p className="text-slate-500 text-xs mt-0.5">يحتوي على أخطاء</p>
              </div>
            </div>

            {/* Preview table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">معاينة البيانات</span>
                <button onClick={() => { setParsed(false); setRows([]); }} className="text-xs text-slate-400 hover:text-slate-600">
                  تعديل
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-slate-100">
                    <tr>
                      <th className="p-2 text-right text-slate-500 font-medium w-8">#</th>
                      <th className="p-2 text-right text-slate-500 font-medium">الاسم</th>
                      <th className="p-2 text-right text-slate-500 font-medium">السجل المدني</th>
                      <th className="p-2 text-right text-slate-500 font-medium">التخصص</th>
                      <th className="p-2 text-right text-slate-500 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(row => (
                      <tr key={row.rowNum} className={row.errors.length ? 'bg-red-50' : 'hover:bg-green-50/50'}>
                        <td className="p-2 text-slate-400">{row.rowNum}</td>
                        <td className="p-2 font-medium">{row.name || <span className="text-red-400 italic">فارغ</span>}</td>
                        <td className="p-2 font-mono">{row.nationalId || <span className="text-red-400 italic">فارغ</span>}</td>
                        <td className="p-2">{row.specialty || <span className="text-red-400 italic">فارغ</span>}</td>
                        <td className="p-2">
                          {row.errors.length === 0 ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={13} /> صالح
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1 text-red-500 cursor-help"
                              title={row.errors.join(' | ')}
                            >
                              <XCircle size={13} />
                              <span className="truncate max-w-28">{row.errors[0]}{row.errors.length > 1 ? ` +${row.errors.length - 1}` : ''}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {errorRows.length > 0 && validRows.length > 0 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                سيتم استيراد {validRows.length} صف صالح فقط وتخطي {errorRows.length} صف يحتوي على أخطاء.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={15} />
                استيراد {validRows.length > 0 ? `(${validRows.length} معلم)` : ''}
              </button>
              <button onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
