import type { Absence, Tardiness } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function calcAbsenceDays(absence: Absence): number {
  const start = new Date(absence.startDate);
  const end = new Date(absence.endDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function calcTardinessMinutes(tardiness: Tardiness): number {
  const [sh, sm] = tardiness.scheduledTime.split(':').map(Number);
  const [ah, am] = tardiness.actualTime.split(':').map(Number);
  return (ah * 60 + am) - (sh * 60 + sm);
}

export function getMonthName(month: number): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  return months[month];
}

export function isInDateRange(dateStr: string, from: string, to: string): boolean {
  const date = new Date(dateStr);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}
