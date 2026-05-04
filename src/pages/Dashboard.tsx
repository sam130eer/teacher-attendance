import { Users, CalendarX, Clock, TrendingUp, Circle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import { calcAbsenceDays, calcTardinessMinutes, formatDate, getTodayStr, getCurrentMonthRange } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { AbsenceType } from '../types';
import { ABSENCE_COLORS, ABSENCE_TYPES } from '../types';

export default function Dashboard() {
  const { teachers, absences, tardiness } = useApp();
  const today = getTodayStr();
  const { from, to } = getCurrentMonthRange();

  const todayAbsences = absences.filter(a => a.startDate <= today && a.endDate >= today);
  const todayTardiness = tardiness.filter(t => t.date === today);

  const monthAbsences = absences.filter(a => a.startDate >= from && a.startDate <= to);
  const monthTardiness = tardiness.filter(t => t.date >= from && t.date <= to);

  const totalAbsenceDays = monthAbsences.reduce((s, a) => s + calcAbsenceDays(a), 0);
  const notInFaresCount = absences.filter(a => !a.addedInFares).length;

  const absenceByType = Object.entries(ABSENCE_TYPES).map(([type, name]) => ({
    name,
    value: absences.filter(a => a.type === type).length,
    color: ABSENCE_COLORS[type as AbsenceType],
  })).filter(x => x.value > 0);

  const topAbsent = teachers.map(t => ({
    name: t.name.split(' ').slice(0, 2).join(' '),
    days: absences.filter(a => a.teacherId === t.id).reduce((s, a) => s + calcAbsenceDays(a), 0),
  })).sort((a, b) => b.days - a.days).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">الشاشة الرئيسية</h1>
        <p className="text-slate-500 text-base mt-1">ملخص سريع لحالة الانضباط</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المعلمين"
          value={teachers.length}
          icon={<Users size={22} className="text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="غياب اليوم"
          value={todayAbsences.length}
          icon={<CalendarX size={22} className="text-red-600" />}
          color="bg-red-100"
          sub={`${((todayAbsences.length / Math.max(teachers.length, 1)) * 100).toFixed(0)}% من المعلمين`}
        />
        <StatCard
          title="تأخير اليوم"
          value={todayTardiness.length}
          icon={<Clock size={22} className="text-yellow-600" />}
          color="bg-yellow-100"
        />
        <StatCard
          title="غياب هذا الشهر"
          value={`${totalAbsenceDays} يوم`}
          icon={<TrendingUp size={22} className="text-purple-600" />}
          color="bg-purple-100"
          sub={`${monthTardiness.length} حالة تأخير`}
        />
      </div>

      {notInFaresCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Circle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            يوجد <strong>{notInFaresCount}</strong> سجل غياب لم يُضف في نظام فارس بعد
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">أنواع الغياب</h2>
          {absenceByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={absenceByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {absenceByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-8">لا توجد بيانات</p>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">أكثر المعلمين غياباً (أيام)</h2>
          {topAbsent.some(x => x.days > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAbsent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="days" fill="#3b82f6" name="أيام" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-8">لا توجد بيانات</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">آخر حالات الغياب</h2>
          </div>
          {absences.length === 0 ? (
            <p className="p-4 text-sm text-slate-400 text-center">لا توجد سجلات</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...absences].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5).map(a => {
                const teacher = teachers.find(t => t.id === a.teacherId);
                return (
                  <div key={a.id} className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{teacher?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{formatDate(a.startDate)}</p>
                    </div>
                    <Badge type={a.type} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">آخر حالات التأخير</h2>
          </div>
          {tardiness.length === 0 ? (
            <p className="p-4 text-sm text-slate-400 text-center">لا توجد سجلات</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...tardiness].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(t => {
                const teacher = teachers.find(x => x.id === t.teacherId);
                const mins = calcTardinessMinutes(t);
                return (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{teacher?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${mins >= 30 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      +{mins} دقيقة
                    </span>
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
