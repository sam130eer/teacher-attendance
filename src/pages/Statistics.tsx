import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calcAbsenceDays, calcTardinessMinutes, getMonthName } from '../utils/helpers';
import type { AbsenceType } from '../types';
import { ABSENCE_COLORS, ABSENCE_TYPES } from '../types';

const ABSENCE_TYPE_KEYS = Object.keys(ABSENCE_TYPES) as AbsenceType[];

const TYPE_BADGE: Record<AbsenceType, string> = {
  sick:           'bg-blue-100 text-blue-700',
  emergency:      'bg-orange-100 text-orange-700',
  newborn:        'bg-green-100 text-green-700',
  bereavement:    'bg-slate-200 text-slate-600',
  patient_escort: 'bg-purple-100 text-purple-700',
  marriage:       'bg-pink-100 text-pink-700',
  sports:         'bg-emerald-100 text-emerald-700',
  unspecified:    'bg-slate-100 text-slate-500',
};
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Period = 'monthly' | 'quarterly' | 'yearly';



export default function Statistics() {
  const { teachers, absences, tardiness } = useApp();
  const [period, setPeriod] = useState<Period>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from(new Set([
    ...absences.map(a => new Date(a.startDate).getFullYear()),
    ...tardiness.map(t => new Date(t.date).getFullYear()),
    new Date().getFullYear(),
  ])).sort((a, b) => b - a);

  function getAbsencesByPeriod() {
    if (period === 'monthly') {
      return Array.from({ length: 12 }, (_, i) => {
        const monthAbs = absences.filter(a => {
          const d = new Date(a.startDate);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        });
        const monthTar = tardiness.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        });
        return {
          name: getMonthName(i),
          غياب: monthAbs.reduce((s, a) => s + calcAbsenceDays(a), 0),
          تأخير: monthTar.length,
        };
      });
    }
    if (period === 'quarterly') {
      return Array.from({ length: 4 }, (_, q) => {
        const qAbs = absences.filter(a => {
          const d = new Date(a.startDate);
          return d.getFullYear() === selectedYear && Math.floor(d.getMonth() / 3) === q;
        });
        const qTar = tardiness.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === selectedYear && Math.floor(d.getMonth() / 3) === q;
        });
        return {
          name: `الفصل ${q + 1}`,
          غياب: qAbs.reduce((s, a) => s + calcAbsenceDays(a), 0),
          تأخير: qTar.length,
        };
      });
    }
    return years.map(y => ({
      name: y.toString(),
      غياب: absences.filter(a => new Date(a.startDate).getFullYear() === y).reduce((s, a) => s + calcAbsenceDays(a), 0),
      تأخير: tardiness.filter(t => new Date(t.date).getFullYear() === y).length,
    }));
  }

  const absenceByType = Object.entries(ABSENCE_TYPES).map(([type, name]) => ({
    name,
    value: absences.filter(a => a.type === type && new Date(a.startDate).getFullYear() === selectedYear).reduce((s, a) => s + calcAbsenceDays(a), 0),
    color: ABSENCE_COLORS[type as AbsenceType],
  })).filter(x => x.value > 0);

  // ── Teacher stats ──────────────────────────────────────────────────────────

  const teacherStatsBase = teachers.map(t => {
    const tAbs = absences.filter(a => a.teacherId === t.id && new Date(a.startDate).getFullYear() === selectedYear);
    const tTar = tardiness.filter(x => x.teacherId === t.id && new Date(x.date).getFullYear() === selectedYear);
    const totalMins = tTar.reduce((s, x) => s + calcTardinessMinutes(x), 0);
    const absDays = tAbs.reduce((s, a) => s + calcAbsenceDays(a), 0);
    const typeCounts = Object.fromEntries(
      ABSENCE_TYPE_KEYS.map(type => [
        type,
        tAbs.filter(a => a.type === type).reduce((s, a) => s + calcAbsenceDays(a), 0),
      ])
    ) as Record<AbsenceType, number>;
    return {
      name: t.name,
      absDays,
      tarCount: tTar.length,
      totalMins,
      avgMins: tTar.length ? Math.round(totalMins / tTar.length) : 0,
      typeCounts,
    };
  });

  const activeTypes = ABSENCE_TYPE_KEYS.filter(type =>
    teacherStatsBase.some(t => t.typeCounts[type] > 0)
  );

  const byAbsenceDays   = [...teacherStatsBase].sort((a, b) => b.absDays   - a.absDays  ).filter(x => x.absDays   > 0);
  const byTardinessCount = [...teacherStatsBase].sort((a, b) => b.tarCount  - a.tarCount ).filter(x => x.tarCount  > 0);
  const byTardinessMins  = [...teacherStatsBase].sort((a, b) => b.totalMins - a.totalMins).filter(x => x.totalMins > 0);

  // ── Summary numbers ────────────────────────────────────────────────────────

  const periodData = getAbsencesByPeriod();
  const totalAbsDays = teacherStatsBase.reduce((s, t) => s + t.absDays, 0);
  const totalTarCount = teacherStatsBase.reduce((s, t) => s + t.tarCount, 0);
  const avgAbsPerTeacher = teachers.length ? (totalAbsDays / teachers.length).toFixed(1) : '0';
  const allMins = teacherStatsBase.map(t => t.totalMins).filter(m => m > 0);
  const avgMins = allMins.length ? Math.round(allMins.reduce((s, m) => s + m, 0) / teacherStatsBase.filter(t => t.tarCount > 0).length) : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">الإحصائيات والتحليلات</h1>
          <p className="text-slate-500 text-base mt-1">تحليل شامل لبيانات الغياب والتأخير</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-sm transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}
              >
                {p === 'monthly' ? 'شهري' : p === 'quarterly' ? 'فصلي' : 'سنوي'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي أيام الغياب', value: `${totalAbsDays} يوم`,     color: 'bg-indigo-50 text-indigo-700' },
          { label: 'متوسط الغياب/معلم',  value: `${avgAbsPerTeacher} يوم`, color: 'bg-violet-50 text-violet-700' },
          { label: 'حالات التأخير',       value: totalTarCount,             color: 'bg-amber-50  text-amber-700'  },
          { label: 'متوسط التأخير',       value: `${avgMins} دقيقة`,        color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-sm opacity-70">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Period chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4">أيام الغياب وحالات التأخير</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={periodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="غياب"  fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="تأخير" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie + bar */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">توزيع أنواع الغياب (أيام)</h2>
          {absenceByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={absenceByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {absenceByType.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-12">لا توجد بيانات لهذا العام</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">أكثر المعلمين تأخيراً (مرات)</h2>
          {byTardinessCount.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byTardinessCount.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} مرة`, 'عدد التأخيرات']} />
                <Bar dataKey="tarCount" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-12">لا توجد بيانات لهذا العام</p>}
        </div>
      </div>

      {/* Absence days bar chart */}
      {byAbsenceDays.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">أيام غياب المعلمين ({selectedYear})</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAbsenceDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} يوم`, 'الغياب']} />
              <Bar dataKey="absDays" radius={[4, 4, 0, 0]}>
                {byAbsenceDays.map((_, i) => (
                  <Cell key={i} fill={`hsl(${245 + i * 12}, 70%, ${55 - i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Ranking tables ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">ترتيب المعلمين</h2>

        {/* Merged tardiness table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 bg-gradient-to-l from-amber-500 to-orange-600">
            <h3 className="font-bold text-white text-base">إجمالي مدة وعدد أيام التأخير</h3>
            <p className="text-white/70 text-xs mt-0.5">مرتب تنازلياً حسب الدقائق — {selectedYear}</p>
          </div>
          {byTardinessMins.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">لا توجد سجلات تأخير</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-center p-3 font-semibold text-slate-500 w-12">#</th>
                    <th className="text-right p-3 font-semibold text-slate-700">الاسم</th>
                    <th className="text-center p-3 font-semibold text-slate-700">عدد المرات</th>
                    <th className="text-center p-3 font-semibold text-slate-700">الساعات والدقائق</th>
                    <th className="text-center p-3 font-semibold text-slate-700">إجمالي الدقائق</th>
                    <th className="text-center p-3 font-semibold text-slate-700">الأيام المحتسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {byTardinessMins.map((t, i) => {
                    const days  = Math.floor(t.totalMins / 420);
                    const hours = Math.floor(t.totalMins / 60);
                    const mins  = t.totalMins % 60;
                    const timeLabel = hours > 0 && mins > 0
                      ? `${hours} س ${mins} د`
                      : hours > 0 ? `${hours} ساعة` : `${mins} دقيقة`;
                    const stripe = i % 2 === 1 ? 'bg-amber-50/60' : 'bg-white';
                    return (
                      <tr key={t.name} className={`border-b border-slate-100 ${stripe} hover:bg-orange-50/60 transition-colors`}>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold bg-slate-100 text-slate-500">
                            {i + 1}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{t.name}</td>
                        <td className="p-3 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {t.tarCount} مرة
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {timeLabel}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-slate-500 text-xs">{t.totalMins} د</span>
                        </td>
                        <td className="p-3 text-center">
                          {days > 0
                            ? <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{days} يوم</span>
                            : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Absence table — full width below */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-l from-rose-500 to-red-600">
            <h3 className="font-bold text-white text-base">أيام الغياب وأنواع الإجازات</h3>
            <p className="text-white/70 text-xs mt-0.5">مرتب تنازلياً حسب الأيام — {selectedYear}</p>
          </div>
          {byAbsenceDays.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">لا توجد سجلات غياب</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-center p-3 font-semibold text-slate-500 w-12">#</th>
                    <th className="text-right p-3 font-semibold text-slate-700">الاسم</th>
                    <th className="text-right p-3 font-semibold text-slate-700">الأيام والأنواع</th>
                  </tr>
                </thead>
                <tbody>
                  {byAbsenceDays.map((t, i) => {
                    const stripe = i % 2 === 1 ? 'bg-rose-50/50' : 'bg-white';
                    return (
                      <tr key={t.name} className={`border-b border-slate-100 ${stripe} hover:bg-rose-50/70 transition-colors`}>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold bg-slate-100 text-slate-500">
                            {i + 1}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{t.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                              {t.absDays} يوم
                            </span>
                            {activeTypes.filter(type => t.typeCounts[type] > 0).map(type => (
                              <span key={type} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[type]}`}>
                                {ABSENCE_TYPES[type]}: {t.typeCounts[type]} يوم
                              </span>
                            ))}
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
      </div>

    </div>
  );
}
