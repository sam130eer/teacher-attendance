import { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  gregorianToHijri, hijriToGregorian, hijriMonthDays,
  HIJRI_MONTHS, formatHijri, formatGregorianArabic,
} from '../../utils/hijri';

type Mode = 'gregorian' | 'hijri';

interface Props {
  label: string;
  value: string;          // always YYYY-MM-DD (Gregorian)
  onChange: (v: string) => void;
  error?: string;
}

function initHijri(gregorianStr: string) {
  const h = gregorianToHijri(gregorianStr);
  return h ?? { year: 1446, month: 1, day: 1 };
}

export default function DateInput({ label, value, onChange, error }: Props) {
  const [mode, setMode] = useState<Mode>('gregorian');
  const [hYear,  setHYear]  = useState(() => initHijri(value).year);
  const [hMonth, setHMonth] = useState(() => initHijri(value).month);
  const [hDay,   setHDay]   = useState(() => initHijri(value).day);
  const [hYearStr, setHYearStr] = useState(() => String(initHijri(value).year));

  // Sync Hijri state when switching TO hijri mode
  function switchMode(next: Mode) {
    if (next === 'hijri' && value) {
      const h = gregorianToHijri(value);
      if (h) {
        setHYear(h.year); setHYearStr(String(h.year));
        setHMonth(h.month); setHDay(h.day);
      }
    }
    setMode(next);
  }

  // Attempt conversion whenever any Hijri field changes
  function applyHijri(y: number, mo: number, d: number) {
    const maxDay = hijriMonthDays(y, mo);
    const safeDay = Math.min(d, maxDay);
    if (safeDay !== d) setHDay(safeDay);
    if (y >= 1400 && y <= 1460) {
      const result = hijriToGregorian(y, mo, safeDay);
      if (result) onChange(result);
    }
  }

  function onYearInput(raw: string) {
    setHYearStr(raw);
    const n = parseInt(raw);
    if (!isNaN(n)) { setHYear(n); applyHijri(n, hMonth, hDay); }
  }

  function onMonthChange(mo: number) {
    setHMonth(mo);
    applyHijri(hYear, mo, hDay);
  }

  function onDayInput(raw: string) {
    const n = Math.max(1, Math.min(30, parseInt(raw) || 1));
    setHDay(n);
    applyHijri(hYear, hMonth, n);
  }

  const hijriLabel    = value ? formatHijri(value) : '';
  const gregorianLabel = value ? formatGregorianArabic(value) : '';

  return (
    <div>
      {/* Label + mode toggle */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          {label}
        </label>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => switchMode('gregorian')}
            className={`px-2.5 py-1 transition-colors ${mode === 'gregorian' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            ميلادي
          </button>
          <button
            type="button"
            onClick={() => switchMode('hijri')}
            className={`px-2.5 py-1 transition-colors ${mode === 'hijri' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            هجري
          </button>
        </div>
      </div>

      {/* Input area */}
      {mode === 'gregorian' ? (
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
        />
      ) : (
        <div className="flex gap-2">
          {/* Day */}
          <div className="w-16">
            <input
              type="number"
              min={1}
              max={30}
              value={hDay}
              onChange={e => onDayInput(e.target.value)}
              placeholder="يوم"
              className={`w-full border rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
            />
            <p className="text-center text-xs text-slate-400 mt-0.5">يوم</p>
          </div>

          {/* Month */}
          <div className="flex-1">
            <select
              value={hMonth}
              onChange={e => onMonthChange(parseInt(e.target.value))}
              className={`w-full border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
            >
              {HIJRI_MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <p className="text-center text-xs text-slate-400 mt-0.5">الشهر</p>
          </div>

          {/* Year */}
          <div className="w-20">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={hYearStr}
              onChange={e => onYearInput(e.target.value)}
              placeholder="السنة"
              className={`w-full border rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
            />
            <p className="text-center text-xs text-slate-400 mt-0.5">السنة</p>
          </div>
        </div>
      )}

      {/* Conversion display */}
      {value && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <RefreshCw size={11} className="text-slate-300 shrink-0" />
          <p className="text-xs text-slate-400">
            {mode === 'gregorian'
              ? (hijriLabel    ? `يعادل: ${hijriLabel}`    : '')
              : (gregorianLabel ? `يعادل: ${gregorianLabel}` : '')}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
