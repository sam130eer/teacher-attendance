import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal from './Modal';
import { calcTardinessMinutes } from '../../utils/helpers';
import type { Tardiness } from '../../types';

const STAGES = [
  { n: 1, threshold: 120,  label: '120',  days: '',                        type: 'تنبيه شفوي',                                          action: 'نظراً لتأخرك لذا وجب تنبيهك شفوياً' },
  { n: 2, threshold: 180,  label: '180',  days: '',                        type: 'تنبيه خطي (1)',                                        action: 'نظراً لتأخرك لذا وجب تنبيهك خطياً' },
  { n: 3, threshold: 240,  label: '240',  days: '',                        type: 'تنبيه خطي (2)',                                        action: 'أتعهد بعدم التأخر وإذا تكرر أتحمل ما يترتب على تأخري من إجراءات' },
  { n: 4, threshold: 300,  label: '300',  days: '',                        type: 'تنبيه خطي (3)',                                        action: 'أتعهد للمرة الثانية بعدم التأخر وأتحمل ما يترتب على ذلك من إجراءات' },
  { n: 5, threshold: 360,  label: '360',  days: '',                        type: 'مساءلة',                                              action: 'مساءلة الموظف خطياً من قبل المدير' },
  { n: 6, threshold: 420,  label: '420',  days: 'بما يعادل يوم',           type: 'مساءلة ولفت نظر',                                     action: 'نلفت نظرك لتكرار تأخرك علماً بأنه سبق تنبيهك وأخذ التعهد على ذلك مع الرفع بالحسم.' },
  { n: 7, threshold: 840,  label: '840',  days: 'بما يعادل يومان',         type: 'مساءلة ولفت نظر (2)',                                  action: 'مساءلة الموظف خطياً من قبل مدير المدرسة والرفع لمكتب التعليم مع الرفع بالحسم' },
  { n: 8, threshold: 1680, label: '1680', days: 'بما يعادل أربعة أيام',    type: 'الرفع للموارد البشرية\n(وحدة متابعة دوام الموظفين)',    action: 'الرفع لإدارة الموارد البشرية (وحدة متابعة دوام الموظفين) مع إرفاق صورة من كافة الإجراءات السابقة التي اتخذت مع الموظف وإرفاق صور من هذا النموذج.' },
  { n: 9, threshold: 2100, label: '2100', days: 'بما يعادل خمسة أيام وأكثر', type: 'الرفع للموارد البشرية\n(وحدة متابعة دوام الموظفين)', action: 'الرفع لإدارة الموارد البشرية (وحدة متابعة دوام الموظفين) مع إرفاق صورة من كافة الإجراءات السابقة التي اتخذت مع الموظف وصورة من مساءلات التأخير والرفع بالحسم' },
];

function getStageDates(list: Tardiness[]): Map<number, string> {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  const map = new Map<number, string>();
  for (const r of sorted) {
    const prev = cum;
    cum += calcTardinessMinutes(r);
    for (const s of STAGES) {
      if (!map.has(s.threshold) && prev < s.threshold && cum >= s.threshold) {
        map.set(s.threshold, r.date);
      }
    }
  }
  return map;
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('ar-SA'); } catch { return d; }
}

function buildHTML(
  name: string, nationalId: string, specialty: string,
  stageDates: Map<number, string>,
  schoolName: string, principalName: string, year: number,
  origin: string
) {
  const rows = STAGES.map(s => {
    const date = stageDates.get(s.threshold);
    const bg = '';
    const typeHtml = s.type.replace('\n', '<br>');
    const minCell = s.days
      ? `<span style="font-weight:bold">(${s.label})</span> دقيقة<br><small style="color:#555">${s.days}</small>`
      : `<span style="font-weight:bold">(${s.label})</span> دقيقة`;
    return `<tr style="${bg}">
      <td>${s.n}</td>
      <td>${minCell}</td>
      <td style="font-size:8.5pt">${typeHtml}</td>
      <td style="text-align:right;font-size:8pt;padding:4px 8px;line-height:1.5">${s.action}</td>
      <td></td>
      <td style="font-size:8.5pt">${date ? fmtDate(date) : ''}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>نموذج حصر دقائق التأخر - ${name}</title>
<style>
  @page { size: A4 portrait; margin: 1.5cm 2cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Tahoma, sans-serif; font-size: 10pt; direction: rtl; color: #000; }
  .page-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 8px; }
  .page-header img { height: 88px; }
  .gov { font-size: 9pt; line-height: 1.8; text-align: right; }
  .gov b { font-size: 10.5pt; }
  .title { text-align: center; font-size: 11pt; font-weight: bold; border: 1.5px solid #000; padding: 6px; margin: 6px 0; }
  .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .info-tbl td, .info-tbl th { border: 1px solid #000; padding: 5px 8px; text-align: center; }
  .info-tbl th { background: #e8e8e8; font-weight: bold; }
  .total { font-size: 9.5pt; margin: 4px 0 6px; }
  .main-tbl { width: 100%; border-collapse: collapse; }
  .main-tbl th, .main-tbl td { border: 1px solid #000; padding: 4px 5px; text-align: center; vertical-align: middle; }
  .main-tbl th { background: #d4d4d4; font-size: 9.5pt; font-weight: bold; }
  .foot { margin-top: 18px; display: flex; justify-content: flex-left; }
  .stamp { border: 1px solid #000; padding: 8px 24px; text-align: center; min-width: 220px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="page-header">
  <div class="gov">
    <div>المملكة العربية السعودية</div>
    <div>وزارة التعليم</div>
    <div>الإدارة العامة للتعليم بالمنطقة الشرقية</div>
    <div><b>${schoolName}</b></div>
  </div>
  <img src="${origin}/ministry-logo.png" alt="شعار وزارة التعليم" onerror="this.style.display='none'" />
</div>

<div class="title">
  آلية حصر دقائق التأخر التي تم رصدها على الموظف والإجراءات المتخذة بشأنه خلال العام ${year}م
</div>

<table class="info-tbl">
  <tr>
    <th>اسم المعلم</th>
    <th>السجل المدني</th>
    <th>التخصص</th>
  </tr>
  <tr>
    <td><b>${name}</b></td>
    <td>${nationalId}</td>
    <td>${specialty}</td>
  </tr>
</table>

<table class="main-tbl">
  <thead>
    <tr>
      <th style="width:4%">م</th>
      <th style="width:19%">عدد دقائق التأخر</th>
      <th style="width:17%">نوع التأخر</th>
      <th style="width:38%">الإجراء المتخذ</th>
      <th style="width:10%">التوقيع</th>
      <th style="width:12%">التاريخ</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="foot">
  <div class="stamp">
    <div style="font-weight:bold;margin-bottom:6px">يعتمد / مدير المدرسة</div>
    <div>${principalName || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</div>
  </div>
</div>

</body>
</html>`;
}

interface Props { onClose: () => void }

export default function AccountabilityModal({ onClose }: Props) {
  const { teachers, tardiness, settings } = useApp();
  const [teacherId, setTeacherId]       = useState('');
  const [principalName, setPrincipalName] = useState(
    () => localStorage.getItem('principal_name') || ''
  );

  const sorted  = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const teacher = teachers.find(t => t.id === teacherId);
  const list    = tardiness.filter(t => t.teacherId === teacherId);
  const total   = list.reduce((s, t) => s + calcTardinessMinutes(t), 0);
  const dates   = teacher ? getStageDates(list) : new Map<number, string>();
  const reached = STAGES.filter(s => dates.has(s.threshold));
  const current = reached[reached.length - 1];

  function savePrincipal(v: string) {
    setPrincipalName(v);
    localStorage.setItem('principal_name', v);
  }

  function handlePrint() {
    if (!teacher) return;
    const html = buildHTML(
      teacher.name, teacher.nationalId, teacher.specialty,
      dates, settings.schoolName, principalName, new Date().getFullYear(),
      window.location.origin
    );
    const win = window.open('', '_blank', 'width=860,height=680');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  return (
    <Modal title="طباعة نموذج حصر التأخر" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">اختر المعلم</label>
          <select
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر المعلم --</option>
            {sorted.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {teacher && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">إجمالي دقائق التأخر</span>
              <strong className="text-slate-800">{total} دقيقة</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">المراحل المكتملة</span>
              <strong className="text-slate-800">{reached.length} من {STAGES.length}</strong>
            </div>
            {current && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">الإجراء الحالي</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  {current.type.split('\n')[0]}
                </span>
              </div>
            )}
            {!current && total > 0 && (
              <p className="text-xs text-green-600">لم يصل إلى أي مرحلة إجراء بعد</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">اسم مدير المدرسة</label>
          <input
            type="text"
            value={principalName}
            onChange={e => savePrincipal(e.target.value)}
            placeholder="أدخل اسم المدير"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handlePrint}
            disabled={!teacherId}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-base font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Printer size={16} />
            طباعة النموذج
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">
            إلغاء
          </button>
        </div>
      </div>
    </Modal>
  );
}
