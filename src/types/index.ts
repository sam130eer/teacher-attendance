export interface Teacher {
  id: string;
  name: string;
  nationalId: string;
  specialty: string;
  createdAt: string;
}

export type AbsenceType = 'sick' | 'emergency' | 'newborn' | 'bereavement' | 'patient_escort' | 'marriage' | 'sports' | 'unspecified';

export interface Absence {
  id: string;
  teacherId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  notes: string;
  addedInFares: boolean;
  createdAt: string;
}

export interface Tardiness {
  id: string;
  teacherId: string;
  date: string;
  scheduledTime: string;
  actualTime: string;
  notes: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  teacherId: string;
  type: 'absence' | 'tardiness';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const ABSENCE_TYPES: Record<AbsenceType, string> = {
  sick:           'مرضية',
  emergency:      'اضطرارية',
  newborn:        'مولود',
  bereavement:    'وفاة قريب',
  patient_escort: 'مرافقة مريض',
  marriage:       'زواج',
  sports:         'مشاركة رياضية',
  unspecified:    'غير محددة',
};

export const ABSENCE_COLORS: Record<AbsenceType, string> = {
  sick:           '#3b82f6',
  emergency:      '#f97316',
  newborn:        '#10b981',
  bereavement:    '#6b7280',
  patient_escort: '#8b5cf6',
  marriage:       '#ec4899',
  sports:         '#059669',
  unspecified:    '#94a3b8',
};
