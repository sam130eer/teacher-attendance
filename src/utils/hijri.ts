export const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Gregorian → Hijri using browser Intl (Umm Al-Qura — accurate)
export function gregorianToHijri(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr + 'T12:00:00');
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(date);
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0');
    return { year: get('year'), month: get('month'), day: get('day') };
  } catch {
    return null;
  }
}

// Hijri → Gregorian: tabular approximation then verified with Intl
export function hijriToGregorian(hy: number, hm: number, hd: number): string | null {
  if (hy < 1300 || hy > 1500 || hm < 1 || hm > 12 || hd < 1 || hd > 30) return null;

  // Tabular civil calendar (approximate Julian Day)
  const jdn = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm
    - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;

  // JDN → Date
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const d = l - Math.floor((2447 * j) / 80);
  const l3 = Math.floor(j / 11);
  const m = j + 2 - 12 * l3;
  const y = 100 * (n - 49) + i + l3;
  const approx = new Date(y, m - 1, d);

  // Verify with Intl in a ±3-day window (handles Umm Al-Qura vs tabular diff)
  for (let offset = -3; offset <= 3; offset++) {
    const candidate = new Date(approx);
    candidate.setDate(approx.getDate() + offset);
    const str = dateToStr(candidate);
    const h = gregorianToHijri(str);
    if (h && h.year === hy && h.month === hm && h.day === hd) return str;
  }

  // Fallback: return tabular result
  return dateToStr(approx);
}

export function formatHijri(dateStr: string): string {
  const h = gregorianToHijri(dateStr);
  if (!h) return '';
  return `${h.year}/${String(h.month).padStart(2, '0')}/${String(h.day).padStart(2, '0')} هـ`;
}

export function formatGregorianArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Max days in a Hijri month (alternating 30/29, last month of leap year = 30)
export function hijriMonthDays(year: number, month: number): number {
  if (month % 2 === 1) return 30; // odd months
  if (month === 12) {
    // Leap year check: (11y + 14) mod 30 < 11
    return ((11 * year + 14) % 30) < 11 ? 30 : 29;
  }
  return 29;
}
