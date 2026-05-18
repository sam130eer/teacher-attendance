import type { AbsenceType } from '../../types';
import { ABSENCE_TYPES } from '../../types';

const colorMap: Record<AbsenceType, string> = {
  sick:           'bg-blue-100 text-blue-700',
  emergency:      'bg-orange-100 text-orange-700',
  newborn:        'bg-green-100 text-green-700',
  bereavement:    'bg-slate-200 text-slate-700',
  patient_escort: 'bg-purple-100 text-purple-700',
  marriage:       'bg-pink-100 text-pink-700',
  sports:         'bg-emerald-100 text-emerald-700',
  unspecified:    'bg-slate-100 text-slate-500',
};

export default function Badge({ type }: { type: AbsenceType }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[type]}`}>
      {ABSENCE_TYPES[type]}
    </span>
  );
}
