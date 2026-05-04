import { Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

interface Props {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: Props) {
  const { notifications, unreadCount, markNotificationRead, settings } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200/70 h-16 flex items-center px-4 lg:px-6 sticky top-0 z-10 shadow-sm shadow-indigo-100/40">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* School name + date — fills middle space */}
      <div className="flex-1 px-3 lg:px-0">
        <div className="lg:flex lg:items-center lg:gap-4">
          <p className="text-sm font-bold text-indigo-700 leading-none">{settings.schoolName}</p>
          <span className="hidden lg:inline w-1 h-1 rounded-full bg-slate-300" />
          <p className="hidden lg:block text-xs text-slate-400">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="lg:hidden mt-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(v => !v)}
          className="relative p-2.5 rounded-xl hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
            <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-l from-indigo-50 to-white flex items-center justify-between">
                <h3 className="font-semibold text-sm text-indigo-800">الإشعارات</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} جديد</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 text-center">لا توجد إشعارات</p>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-indigo-50/50 border-r-2 border-r-indigo-400' : ''}`}
                    >
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt.split('T')[0])}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
