import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Badge from '../components/UI/Badge';
import type { AbsenceType } from '../types';
import { ABSENCE_TYPES } from '../types';
import { calcAbsenceDays, calcTardinessMinutes, formatDate, formatTime, getCurrentMonthRange } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ReportType = 'absence' | 'tardiness' | 'summary';

export default function Reports() {
  const { teachers, absences, tardiness } = useApp();
  const { from: mFrom, to: mTo } = getCurrentMonthRange();

  const [reportType, setReportType] = useState<ReportType>('absence');
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const [teacherId, setTeacherId] = useState('');
  const [absenceType, setAbsenceType] = useState<AbsenceType | ''>('');

  const filteredAbsences = absences.filter(a => {
    if (teacherId && a.teacherId !== teacherId) return false;
    if (absenceType && a.type !== absenceType) return false;
    if (dateFrom && a.startDate < dateFrom) return false;
    if (dateTo && a.startDate > dateTo) return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const filteredTardiness = tardiness.filter(t => {
    if (teacherId && t.teacherId !== teacherId) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const summaryData = teachers.map(t => {
    const tAbs = filteredAbsences.filter(a => a.teacherId === t.id);
    const tTar = filteredTardiness.filter(x => x.teacherId === t.id);
    const totalDays = tAbs.reduce((s, a) => s + calcAbsenceDays(a), 0);
    const notInFares = tAbs.filter(a => !a.addedInFares).length;
    const totalMins = tTar.reduce((s, x) => s + calcTardinessMinutes(x), 0);
    return { teacher: t, absDays: totalDays, absTimes: tAbs.length, tarTimes: tTar.length, notInFares, totalMins };
  });

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica');

    const title = reportType === 'absence' ? 'تقرير الغياب' : reportType === 'tardiness' ? 'تقرير التأخير' : 'التقرير الشامل';
    doc.text(`${title} - من ${dateFrom} إلى ${dateTo}`, 14, 15);

    if (reportType === 'absence') {
      autoTable(doc, {
        startY: 25,
        head: [['المعلم', 'نوع الغياب', 'من', 'إلى', 'الأيام', 'ملاحظات']],
        body: filteredAbsences.map(a => [
          teachers.find(t => t.id === a.teacherId)?.name || '',
          ABSENCE_TYPES[a.type],
          a.startDate,
          a.endDate,
          calcAbsenceDays(a),
          a.notes,
        ]),
      });
    } else if (reportType === 'tardiness') {
      autoTable(doc, {
        startY: 25,
        head: [['المعلم', 'التاريخ', 'الوقت المقرر', 'وقت الحضور', 'الدقائق', 'ملاحظات']],
        body: filteredTardiness.map(t => [
          teachers.find(x => x.id === t.teacherId)?.name || '',
          t.date,
          t.scheduledTime,
          t.actualTime,
          calcTardinessMinutes(t),
          t.notes,
        ]),
      });
    } else {
      autoTable(doc, {
        startY: 25,
        head: [['المعلم', 'التخصص', 'أيام الغياب', 'مرات الغياب', 'لم يُضف في فارس', 'مرات التأخير', 'إجمالي دقائق التأخير']],
        body: summaryData.map(s => [
          s.teacher.name, s.teacher.specialty, s.absDays, s.absTimes, s.notInFares, s.tarTimes, s.totalMins,
        ]),
      });
    }

    doc.save(`report-${reportType}-${dateFrom}-${dateTo}.pdf`);
  }

  function exportExcel() {
    let data: (string | number)[][] = [];
    let headers: string[] = [];

    if (reportType === 'absence') {
      headers = ['المعلم', 'نوع الغياب', 'من', 'إلى', 'الأيام', 'ملاحظات'];
      data = filteredAbsences.map(a => [
        teachers.find(t => t.id === a.teacherId)?.name || '',
        ABSENCE_TYPES[a.type],
        a.startDate,
        a.endDate,
        calcAbsenceDays(a),
        a.notes,
      ]);
    } else if (reportType === 'tardiness') {
      headers = ['المعلم', 'التاريخ', 'الوقت المقرر', 'وقت الحضور', 'الدقائق', 'ملاحظات'];
      data = filteredTardiness.map(t => [
        teachers.find(x => x.id === t.teacherId)?.name || '',
        t.date, t.scheduledTime, t.actualTime, calcTardinessMinutes(t), t.notes,
      ]);
    } else {
      headers = ['المعلم', 'التخصص', 'أيام الغياب', 'مرات الغياب', 'لم يُضف في فارس', 'مرات التأخير', 'إجمالي دقائق التأخير'];
      data = summaryData.map(s => [
        s.teacher.name, s.teacher.specialty, s.absDays, s.absTimes, s.notInFares, s.tarTimes, s.totalMins,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير');
    XLSX.writeFile(wb, `report-${reportType}-${dateFrom}-${dateTo}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">التقارير</h1>
        <p className="text-slate-500 text-base mt-1">إنشاء وتصدير تقارير مخصصة</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-700">إعدادات التقرير</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-medium text-slate-600 mb-1">نوع التقرير</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="absence">تقرير الغياب</option>
              <option value="tardiness">تقرير التأخير</option>
              <option value="summary">التقرير الشامل</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-slate-600 mb-1">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-base font-medium text-slate-600 mb-1">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-base font-medium text-slate-600 mb-1">المعلم (اختياري)</label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المعلمين</option>
              {[...teachers].sort((a, b) => a.name.localeCompare(b.name, 'ar')).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {reportType === 'absence' && (
            <div>
              <label className="block text-base font-medium text-slate-600 mb-1">نوع الغياب (اختياري)</label>
              <select
                value={absenceType}
                onChange={e => setAbsenceType(e.target.value as AbsenceType | '')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">الكل</option>
                {Object.entries(ABSENCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-red-700"
          >
            <Download size={15} />
            تصدير PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-base font-medium hover:bg-green-700"
          >
            <Download size={15} />
            تصدير Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-200 px-4 py-2.5 rounded-xl text-base font-medium hover:bg-slate-50"
          >
            <Printer size={15} />
            طباعة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            {reportType === 'absence' ? `تقرير الغياب (${filteredAbsences.length} سجل)` :
              reportType === 'tardiness' ? `تقرير التأخير (${filteredTardiness.length} سجل)` :
                'التقرير الشامل'}
          </h2>
          <span className="text-xs text-slate-400">{dateFrom} - {dateTo}</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'absence' && (
            filteredAbsences.length === 0 ? (
              <p className="p-8 text-center text-slate-400">لا توجد بيانات</p>
            ) : (
              <table className="w-full text-base">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-right p-3 font-semibold text-slate-700">#</th>
                    <th className="text-right p-3 font-semibold text-slate-700">المعلم</th>
                    <th className="text-right p-3 font-semibold text-slate-700">النوع</th>
                    <th className="text-right p-3 font-semibold text-slate-700">من</th>
                    <th className="text-right p-3 font-semibold text-slate-700">إلى</th>
                    <th className="text-right p-3 font-semibold text-slate-700">الأيام</th>
                    <th className="text-right p-3 font-semibold text-slate-700">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAbsences.map((a, i) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3 font-medium">{teachers.find(t => t.id === a.teacherId)?.name || '—'}</td>
                      <td className="p-3"><Badge type={a.type} /></td>
                      <td className="p-3 text-slate-600 text-base">{formatDate(a.startDate)}</td>
                      <td className="p-3 text-slate-600 text-base">{formatDate(a.endDate)}</td>
                      <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{calcAbsenceDays(a)} يوم</span></td>
                      <td className="p-3 text-slate-500">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="p-3 font-semibold text-slate-700 text-left">الإجمالي</td>
                    <td className="p-3 font-bold text-blue-700">
                      {filteredAbsences.reduce((s, a) => s + calcAbsenceDays(a), 0)} يوم
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {reportType === 'tardiness' && (
            filteredTardiness.length === 0 ? (
              <p className="p-8 text-center text-slate-400">لا توجد بيانات</p>
            ) : (
              <table className="w-full text-base">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-right p-3 font-semibold text-slate-700">#</th>
                    <th className="text-right p-3 font-semibold text-slate-700">المعلم</th>
                    <th className="text-right p-3 font-semibold text-slate-700">التاريخ</th>
                    <th className="text-right p-3 font-semibold text-slate-700">الوقت المقرر</th>
                    <th className="text-right p-3 font-semibold text-slate-700">وقت الحضور</th>
                    <th className="text-right p-3 font-semibold text-slate-700">التأخير</th>
                    <th className="text-right p-3 font-semibold text-slate-700">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTardiness.map((t, i) => {
                    const mins = calcTardinessMinutes(t);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400">{i + 1}</td>
                        <td className="p-3 font-medium">{teachers.find(x => x.id === t.teacherId)?.name || '—'}</td>
                        <td className="p-3 text-slate-600 text-base">{formatDate(t.date)}</td>
                        <td className="p-3 text-slate-600 text-base">{formatTime(t.scheduledTime)}</td>
                        <td className="p-3 text-slate-600 text-base">{formatTime(t.actualTime)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mins >= 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            +{mins} دقيقة
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{t.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="p-3 font-semibold text-slate-700 text-left">إجمالي الدقائق</td>
                    <td className="p-3 font-bold text-yellow-700">
                      {filteredTardiness.reduce((s, t) => s + calcTardinessMinutes(t), 0)} دقيقة
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {reportType === 'summary' && (
            <table className="w-full text-base">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right p-3 font-semibold text-slate-700">المعلم</th>
                  <th className="text-right p-3 font-semibold text-slate-700">التخصص</th>
                  <th className="text-right p-3 font-semibold text-slate-700">أيام الغياب</th>
                  <th className="text-right p-3 font-semibold text-slate-700">مرات الغياب</th>
                  <th className="text-right p-3 font-semibold text-slate-700">بدون عذر</th>
                  <th className="text-right p-3 font-semibold text-slate-700">مرات التأخير</th>
                  <th className="text-right p-3 font-semibold text-slate-700">دقائق التأخير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData.map(s => (
                  <tr key={s.teacher.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{s.teacher.name}</td>
                    <td className="p-3 text-slate-600 text-base">{s.teacher.specialty}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.absDays > 5 ? 'bg-red-100 text-red-700' : s.absDays > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {s.absDays} يوم
                      </span>
                    </td>
                    <td className="p-3 text-center">{s.absTimes}</td>
                    <td className="p-3 text-center">
                      {s.notInFares > 0 ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{s.notInFares}</span> : '—'}
                    </td>
                    <td className="p-3 text-center">{s.tarTimes}</td>
                    <td className="p-3 text-center text-slate-600">{s.totalMins > 0 ? `${s.totalMins} د` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
