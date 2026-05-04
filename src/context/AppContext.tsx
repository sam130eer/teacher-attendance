import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Teacher, Absence, Tardiness, Notification } from '../types';
import { generateId } from '../utils/helpers';
import { supabase } from '../lib/supabase';

export interface AppSettings {
  defaultScheduledTime: string;
  schoolName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultScheduledTime: '07:30',
  schoolName: 'المدرسة',
};

// DB row → app type mappers
function mapTeacher(r: Record<string, unknown>): Teacher {
  return { id: r.id as string, name: r.name as string, nationalId: r.national_id as string, specialty: r.specialty as string, createdAt: r.created_at as string };
}
function mapAbsence(r: Record<string, unknown>): Absence {
  return { id: r.id as string, teacherId: r.teacher_id as string, type: r.type as Absence['type'], startDate: r.start_date as string, endDate: r.end_date as string, notes: (r.notes as string) ?? '', addedInFares: r.added_in_fares as boolean, createdAt: r.created_at as string };
}
function mapTardiness(r: Record<string, unknown>): Tardiness {
  return { id: r.id as string, teacherId: r.teacher_id as string, date: r.date as string, scheduledTime: r.scheduled_time as string, actualTime: r.actual_time as string, notes: (r.notes as string) ?? '', createdAt: r.created_at as string };
}
function mapNotification(r: Record<string, unknown>): Notification {
  return { id: r.id as string, teacherId: r.teacher_id as string, type: r.type as Notification['type'], message: r.message as string, isRead: r.is_read as boolean, createdAt: r.created_at as string };
}

interface AppContextType {
  teachers: Teacher[];
  absences: Absence[];
  tardiness: Tardiness[];
  notifications: Notification[];
  settings: AppSettings;
  loading: boolean;
  addTeacher: (t: Omit<Teacher, 'id' | 'createdAt'>) => void;
  updateTeacher: (id: string, t: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addAbsence: (a: Omit<Absence, 'id' | 'createdAt'>) => void;
  updateAbsence: (id: string, a: Partial<Absence>) => void;
  deleteAbsence: (id: string) => void;
  addTardiness: (t: Omit<Tardiness, 'id' | 'createdAt'>) => void;
  updateTardiness: (id: string, t: Partial<Tardiness>) => void;
  deleteTardiness: (id: string) => void;
  markNotificationRead: (id: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teachers,      setTeachers]      = useState<Teacher[]>([]);
  const [absences,      setAbsences]      = useState<Absence[]>([]);
  const [tardiness,     setTardiness]     = useState<Tardiness[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings,      setSettings]      = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading,       setLoading]       = useState(true);

  // Initial load from Supabase
  useEffect(() => {
    async function loadAll() {
      try {
        const [t, a, tard, n, s] = await Promise.all([
          supabase.from('teachers').select('*'),
          supabase.from('absences').select('*'),
          supabase.from('tardiness').select('*'),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('app_settings').select('*').single(),
        ]);
        if (t.data)    setTeachers(t.data.map(mapTeacher));
        if (a.data)    setAbsences(a.data.map(mapAbsence));
        if (tard.data) setTardiness(tard.data.map(mapTardiness));
        if (n.data)    setNotifications(n.data.map(mapNotification));
        if (s.data)    setSettings({ schoolName: s.data.school_name, defaultScheduledTime: s.data.default_scheduled_time });
      } catch (err) {
        console.error('Supabase load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const pushNotification = useCallback(async (teacherId: string, type: 'absence' | 'tardiness', message: string) => {
    const notif: Notification = { id: generateId(), teacherId, type, message, isRead: false, createdAt: new Date().toISOString() };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
    await supabase.from('notifications').insert({
      id: notif.id, teacher_id: notif.teacherId, type: notif.type,
      message: notif.message, is_read: false, created_at: notif.createdAt,
    });
  }, []);

  // ── Teachers ──────────────────────────────────────────────────────────────
  const addTeacher = useCallback((t: Omit<Teacher, 'id' | 'createdAt'>) => {
    const teacher: Teacher = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setTeachers(prev => [...prev, teacher]);
    supabase.from('teachers').insert({
      id: teacher.id, name: teacher.name, national_id: teacher.nationalId,
      specialty: teacher.specialty, created_at: teacher.createdAt,
    }).then(({ error }) => { if (error) console.error(error); });
  }, []);

  const updateTeacher = useCallback((id: string, t: Partial<Teacher>) => {
    setTeachers(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));
    const u: Record<string, unknown> = {};
    if (t.name      !== undefined) u.name        = t.name;
    if (t.nationalId !== undefined) u.national_id = t.nationalId;
    if (t.specialty  !== undefined) u.specialty   = t.specialty;
    supabase.from('teachers').update(u).eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setTeachers(prev => prev.filter(x => x.id !== id));
    setAbsences(prev => prev.filter(x => x.teacherId !== id));
    setTardiness(prev => prev.filter(x => x.teacherId !== id));
    supabase.from('teachers').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  // ── Absences ──────────────────────────────────────────────────────────────
  const addAbsence = useCallback((a: Omit<Absence, 'id' | 'createdAt'>) => {
    const absence: Absence = { ...a, id: generateId(), createdAt: new Date().toISOString() };
    setAbsences(prev => [...prev, absence]);
    supabase.from('absences').insert({
      id: absence.id, teacher_id: absence.teacherId, type: absence.type,
      start_date: absence.startDate, end_date: absence.endDate,
      notes: absence.notes, added_in_fares: absence.addedInFares, created_at: absence.createdAt,
    }).then(({ error }) => { if (error) console.error(error); });
    const teacher = teachers.find(t => t.id === a.teacherId);
    if (teacher && !a.addedInFares) {
      pushNotification(a.teacherId, 'absence', `إجازة لم تُضف في فارس: ${teacher.name} - ${a.startDate}`);
    }
  }, [teachers, pushNotification]);

  const updateAbsence = useCallback((id: string, a: Partial<Absence>) => {
    setAbsences(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
    const u: Record<string, unknown> = {};
    if (a.teacherId    !== undefined) u.teacher_id    = a.teacherId;
    if (a.type         !== undefined) u.type          = a.type;
    if (a.startDate    !== undefined) u.start_date    = a.startDate;
    if (a.endDate      !== undefined) u.end_date      = a.endDate;
    if (a.notes        !== undefined) u.notes         = a.notes;
    if (a.addedInFares !== undefined) u.added_in_fares = a.addedInFares;
    supabase.from('absences').update(u).eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  const deleteAbsence = useCallback((id: string) => {
    setAbsences(prev => prev.filter(x => x.id !== id));
    supabase.from('absences').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  // ── Tardiness ─────────────────────────────────────────────────────────────
  const addTardiness = useCallback((t: Omit<Tardiness, 'id' | 'createdAt'>) => {
    const record: Tardiness = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setTardiness(prev => [...prev, record]);
    supabase.from('tardiness').insert({
      id: record.id, teacher_id: record.teacherId, date: record.date,
      scheduled_time: record.scheduledTime, actual_time: record.actualTime,
      notes: record.notes, created_at: record.createdAt,
    }).then(({ error }) => { if (error) console.error(error); });
    const teacher = teachers.find(x => x.id === t.teacherId);
    const mins = (parseInt(t.actualTime.split(':')[0]) * 60 + parseInt(t.actualTime.split(':')[1])) -
                 (parseInt(t.scheduledTime.split(':')[0]) * 60 + parseInt(t.scheduledTime.split(':')[1]));
    if (teacher && mins >= 30) {
      pushNotification(t.teacherId, 'tardiness', `تأخير كبير: ${teacher.name} - ${mins} دقيقة`);
    }
  }, [teachers, pushNotification]);

  const updateTardiness = useCallback((id: string, t: Partial<Tardiness>) => {
    setTardiness(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));
    const u: Record<string, unknown> = {};
    if (t.teacherId     !== undefined) u.teacher_id    = t.teacherId;
    if (t.date          !== undefined) u.date          = t.date;
    if (t.scheduledTime !== undefined) u.scheduled_time = t.scheduledTime;
    if (t.actualTime    !== undefined) u.actual_time   = t.actualTime;
    if (t.notes         !== undefined) u.notes         = t.notes;
    supabase.from('tardiness').update(u).eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  const deleteTardiness = useCallback((id: string) => {
    setTardiness(prev => prev.filter(x => x.id !== id));
    supabase.from('tardiness').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(x => x.id === id ? { ...x, isRead: true } : x));
    supabase.from('notifications').update({ is_read: true }).eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
    const u: Record<string, unknown> = {};
    if (s.schoolName           !== undefined) u.school_name           = s.schoolName;
    if (s.defaultScheduledTime !== undefined) u.default_scheduled_time = s.defaultScheduledTime;
    supabase.from('app_settings').update(u).eq('id', 1)
      .then(({ error }) => { if (error) console.error(error); });
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider value={{
      teachers, absences, tardiness, notifications, settings, loading,
      addTeacher, updateTeacher, deleteTeacher,
      addAbsence, updateAbsence, deleteAbsence,
      addTardiness, updateTardiness, deleteTardiness,
      markNotificationRead, updateSettings, unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
