import { Users, CalendarX, Clock, LogIn, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Badge from '../components/UI/Badge';
import { calcAbsenceDays, calcTardinessMinutes, formatDate, getTodayStr, getCurrentMonthRange } from '../utils/helpers';
import type { AbsenceType } from '../types';
import { ABSENCE_COLORS, ABSENCE_TYPES } from '../types';

export default function Dashboard() {
  const { teachers, absences, tardiness, earlyDepartures } = useApp();
  const today = getTodayStr();
  const { from, to } = getCurrentMonthRange();

  const todayAbsences  = absences.filter(a => a.startDate <= today && a.endDate >= today);
  const todayTardiness = tardiness.filter(t => t.date === today);
  const todayEarlyDep  = earlyDepartures.filter(e => e.date === today);

  const monthAbsences  = absences.filter(a => a.startDate >= from && a.startDate <= to);
  const monthTardiness = tardiness.filter(t => t.date >= from && t.date <= to);
  const monthEarlyDep  = earlyDepartures.filter(e => e.date >= from && e.date <= to);

  const totalAbsDays = monthAbsences.reduce((s, a) => s + calcAbsenceDays(a), 0);
  const totalTarMins = monthTardiness.reduce((s, t) => s + calcTardinessMinutes(t), 0);
  const notInFares   = absences.filter(a => !a.addedInFares).length;

  const absenceByType = Object.entries(ABSENCE_TYPES).map(([type, name]) => {
    const list = absences.filter(a => a.type === type);
    return {
      type: type as AbsenceType,
      name,
      count: list.length,
      days: list.reduce((s, a) => s + calcAbsenceDays(a), 0),
      color: ABSENCE_COLORS[type as AbsenceType],
    };
  }).filter(x => x.count > 0).sort((a, b) => b.days - a.days);

  const maxDays = absenceByType[0]?.days || 1;

  // latest 6 events merged & sorted
  const recentEvents = [
    ...[...absences].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 6).map(a => ({ kind: 'absence' as const, id: a.id, teacherId: a.teacherId, date: a.startDate, type: a.type, mins: 0 })),
    ...[...tardiness].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(t => ({ kind: 'tardiness' as const, id: t.id, teacherId: t.teacherId, date: t.date, type: '' as AbsenceType, mins: calcTardinessMinutes(t) })),
    ...[...earlyDepartures].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(e => ({ kind: 'early' as const, id: e.id, teacherId: e.teacherId, date: e.date, type: '' as AbsenceType, mins: 0 })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const todayDateLabel = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">{todayDateLabel}</p>
        <h1 className="text-2xl font-bold">لوحة متابعة الانضباط</h1>
        <p className="text-indigo-200 text-sm mt-1">{teachers.length} معلم مسجل في النظام</p>

        {/* today quick pills */}
        <div className="flex flex-wrap gap-3 mt-5">
          <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <CalendarX size={16} className="text-red-300" />
            <div>
              <p className="text-xs text-indigo-200">غياب اليوم</p>
              <p className="font-bold text-lg leading-none">{todayAbsences.length}</p>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Clock size={16} className="text-amber-300" />
            <div>
              <p className="text-xs text-indigo-200">تأخير اليوم</p>
              <p className="font-bold text-lg leading-none">{todayTardiness.length}</p>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <LogIn size={16} className="text-rose-300" />
            <div>
              <p className="text-xs text-indigo-200">انصراف مبكر اليوم</p>
              <p className="font-bold text-lg leading-none">{todayEarlyDep.length}</p>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Users size={16} className="text-green-300" />
            <div>
              <p className="text-xs text-indigo-200">حاضرون اليوم</p>
              <p className="font-bold text-lg leading-none">
                {Math.max(0, teachers.length - todayAbsences.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fares alert ─────────────────────────────────────────────────── */}
      {notInFares > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            يوجد <strong>{notInFares}</strong> سجل غياب لم يُضف في نظام فارس بعد
          </p>
        </div>
      )}

      {/* ── Monthly summary cards ────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">ملخص الشهر الحالي</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Absences */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">الغياب</span>
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <CalendarX size={17} className="text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800">{totalAbsDays}</p>
              <p className="text-xs text-slate-400 mt-0.5">يوم غياب · {monthAbsences.length} سجل</p>
            </div>
            <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (totalAbsDays / Math.max(teachers.length * 2, 1)) * 100)}%` }} />
            </div>
          </div>

          {/* Tardiness */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">التأخير</span>
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock size={17} className="text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800">{monthTardiness.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">حالة · {totalTarMins} دقيقة إجمالاً</p>
            </div>
            <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (monthTardiness.length / Math.max(teachers.length, 1)) * 100)}%` }} />
            </div>
          </div>

          {/* Early departure */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">الانصراف المبكر</span>
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
                <LogIn size={17} className="text-rose-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800">{monthEarlyDep.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">حالة انصراف مبكر هذا الشهر</p>
            </div>
            <div className="h-1.5 rounded-full bg-rose-100 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (monthEarlyDep.length / Math.max(teachers.length, 1)) * 100)}%` }} />
            </div>
          </div>

          {/* Compliance rate */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">نسبة الانتظام</span>
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Users size={17} className="text-green-600" />
              </div>
            </div>
            <div>
              {(() => {
                const pct = teachers.length === 0 ? 100 : Math.max(0, Math.round(100 - (monthAbsences.length / (teachers.length * 22)) * 100));
                return <>
                  <p className="text-3xl font-extrabold text-slate-800">{pct}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">من {teachers.length} معلم</p>
                  <div className="h-1.5 rounded-full bg-green-100 overflow-hidden mt-3">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </>;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Absence types breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4">أنواع الغياب</h2>
          {absenceByType.length > 0 ? (
            <div className="space-y-3">
              {absenceByType.map(item => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{item.count} سجل</span>
                      <span className="text-sm font-bold text-slate-800 w-14 text-left">{item.days} يوم</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(item.days / maxDays) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <CalendarX size={40} />
              <p className="text-sm mt-2">لا توجد بيانات غياب</p>
            </div>
          )}
        </div>

        {/* Recent activity feed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">آخر الأحداث</h2>
            <p className="text-xs text-slate-400 mt-0.5">غياب · تأخير · انصراف مبكر</p>
          </div>
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <Users size={36} />
              <p className="text-sm mt-2">لا توجد سجلات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentEvents.map(ev => {
                const teacher = teachers.find(t => t.id === ev.teacherId);
                const isAbsence  = ev.kind === 'absence';
                const isTardiness = ev.kind === 'tardiness';
                const isEarly    = ev.kind === 'early';
                return (
                  <div key={ev.kind + ev.id} className="px-5 py-3 flex items-center gap-3">
                    {/* icon dot */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAbsence ? 'bg-red-100' : isTardiness ? 'bg-amber-100' : 'bg-rose-100'}`}>
                      {isAbsence  && <CalendarX size={14} className="text-red-600" />}
                      {isTardiness && <Clock     size={14} className="text-amber-600" />}
                      {isEarly    && <LogIn     size={14} className="text-rose-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{teacher?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{formatDate(ev.date)}</p>
                    </div>
                    <div className="shrink-0">
                      {isAbsence  && <Badge type={ev.type} />}
                      {isTardiness && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ev.mins >= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>+{ev.mins} د</span>}
                      {isEarly    && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">انصراف مبكر</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
