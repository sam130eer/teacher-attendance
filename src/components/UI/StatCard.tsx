import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  sub?: string;
}

export default function StatCard({ title, value, icon, color, sub }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
