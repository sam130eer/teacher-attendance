import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Absences from './pages/Absences';
import Tardiness from './pages/Tardiness';
import Statistics from './pages/Statistics';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';

function Layout({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/absences" element={<Absences />} />
            <Route path="/tardiness" element={<Tardiness />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const session = localStorage.getItem('auth_session');
      // Clear any old JSON-format session from the previous multi-user system
      if (session && session !== 'true') {
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_credentials');
        return false;
      }
      return session === 'true';
    } catch {
      return false;
    }
  });

  function handleLogout() {
    localStorage.removeItem('auth_session');
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <Layout onLogout={handleLogout} />
      </AppProvider>
    </BrowserRouter>
  );
}
