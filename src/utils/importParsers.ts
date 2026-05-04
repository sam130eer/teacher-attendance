import type { Teacher, AbsenceType } from '../types';
import { hijriToGregorian } from './hijri';

// ────────────────────────────────────────────────────────────────────────────
// Date parsing – supports ISO (YYYY-MM-DD), Saudi (DD/MM/YYYY) and Hijri year
// ────────────────────────────────────────────────────────────────────────────
export function parseDate(raw: string): string | null {
  const s = raw.trim().replace(/[‎‏‪-‮]/g, '').replace(/،/g, '');
  if (!s) return null;

  let y = 0, m = 0, d = 0;

  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }

  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) { d = +dmy[1]; m = +dmy[2]; y = +dmy[3]; }

  if (!y || !m || !d) return null;

  // Hijri year range → convert to Gregorian
  if (y >= 1300 && y <= 1500) return hijriToGregorian(y, m, d);

  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Time parsing – 24h (HH:MM) or 12h with AM/PM
// ────────────────────────────────────────────────────────────────────────────
export function parseTime(raw: string): string | null {
  const s = raw.trim();
  const m24 = s.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|ص|م))?$/i);
  if (m24) {
    let h = +m24[1], min = +m24[2];
    const ampm = m24[3]?.toLowerCase();
    if (ampm === 'pm' || ampm === 'م') { if (h < 12) h += 12; }
    if (ampm === 'am' || ampm === 'ص') { if (h === 12) h = 0; }
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59)
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Absence type mapping (Arabic + English)
// ────────────────────────────────────────────────────────────────────────────
const TYPE_MAP: Record<string, AbsenceType> = {
  'مرضية': 'sick', 'مرضي': 'sick', 'sick': 'sick', '1': 'sick',
  'اضطرارية': 'emergency', 'اضطراري': 'emergency', 'emergency': 'emergency', '2': 'emergency',
  'مولود': 'newborn', 'newborn': 'newborn', '3': 'newborn',
  'وفاة قريب': 'bereavement', 'وفاة': 'bereavement', 'bereavement': 'bereavement', '4': 'bereavement',
  'مرافقة مريض': 'patient_escort', 'مرافقة': 'patient_escort', 'patient_escort': 'patient_escort', '5': 'patient_escort',
  'زواج': 'marriage', 'marriage': 'marriage', '6': 'marriage',
  'غير محددة': 'unspecified', 'غير محدد': 'unspecified', 'unspecified': 'unspecified', '7': 'unspecified',
};

export function parseAbsenceType(raw: string): AbsenceType | null {
  return TYPE_MAP[raw.trim()] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Teacher lookup – by national ID (exact) → full name (exact) → partial name
// ────────────────────────────────────────────────────────────────────────────
export function findTeacher(query: string, teachers: Teacher[]): Teacher | null {
  const q = query.trim();
  if (!q) return null;
  const byId = teachers.find(t => t.nationalId === q);
  if (byId) return byId;
  const byName = teachers.find(t => t.name === q);
  if (byName) return byName;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const partial = teachers.find(t =>
      words.slice(0, 2).every(w => t.name.includes(w))
    );
    if (partial) return partial;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Fares flag parsing
// ────────────────────────────────────────────────────────────────────────────
export function parseFares(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return ['نعم', 'yes', '1', 'true', '✓', 'صح'].includes(s);
}

// ────────────────────────────────────────────────────────────────────────────
// Split a raw line into cells (tab → comma fallback)
// ────────────────────────────────────────────────────────────────────────────
export function splitCells(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map(s => s.trim());
  return line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
}
