import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarX, Clock, BarChart3, FileText, X, Settings, LogOut,
} from 'lucide-react';

const links = [
  { to: '/', label: 'الشاشة الرئيسية', icon: LayoutDashboard },
  { to: '/teachers', label: 'المعلمون', icon: Users },
  { to: '/absences', label: 'الغياب', icon: CalendarX },
  { to: '/tardiness', label: 'التأخير', icon: Clock },
  { to: '/statistics', label: 'الإحصائيات', icon: BarChart3 },
  { to: '/reports', label: 'التقارير', icon: FileText },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({ open, onClose, onLogout }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full w-64 z-30 flex flex-col transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ background: 'linear-gradient(175deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <span className="text-white font-black text-base">ن</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">نظام إدارة</h1>
              <p className="text-sm text-indigo-300">الغياب والتأخير</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 mt-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-base transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-sm ring-1 ring-white/10'
                    : 'text-indigo-200/80 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive ? 'bg-amber-400/25 text-amber-300' : 'text-indigo-300/70 group-hover:text-indigo-200'
                  }`}>
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300/80 hover:bg-red-500/15 hover:text-red-300 transition-colors group"
          >
            <span className="p-1 rounded-lg text-red-400/60 group-hover:text-red-300 shrink-0">
              <LogOut size={15} />
            </span>
            تسجيل الخروج
          </button>
          <p className="text-xs text-indigo-200/70 text-center">© 2026 تصميم وبرمجة سمير الطريفي</p>
        </div>
      </aside>
    </>
  );
}
