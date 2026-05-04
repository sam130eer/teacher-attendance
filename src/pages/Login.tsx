import { useState } from 'react';
import { Eye, EyeOff, Lock, User, GraduationCap } from 'lucide-react';
import { getCredentials } from '../utils/auth';

function getSchoolName() {
  return localStorage.getItem('school_name') || '';
}

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const schoolName = getSchoolName();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const creds = getCredentials();
      if (username.trim() === creds.username && password === creds.password) {
        localStorage.setItem('auth_session', 'true');
        onLogin();
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        setLoading(false);
      }
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'linear-gradient(175deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '1.25rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <GraduationCap size={36} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>نظام إدارة الغياب والتأخير</h1>
          {schoolName && (
            <p style={{ color: '#fde68a', fontSize: '0.95rem', fontWeight: 600, margin: '0.35rem 0 0' }}>{schoolName}</p>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '1.5rem',
          padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '1.5rem' }}>
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                اسم المستخدم
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="admin"
                  autoComplete="username"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                    padding: '0.625rem 2.25rem 0.625rem 1rem',
                    fontSize: '0.9rem', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                    padding: '0.625rem 2.25rem 0.625rem 2.5rem',
                    fontSize: '0.9rem', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem',
                padding: '0.75rem', fontSize: '0.85rem', color: '#dc2626',
                textAlign: 'center', marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
                color: 'white', border: 'none', borderRadius: '0.75rem',
                fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        </div>
        <p style={{ color: '#a5b4fc', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem' }}>
          © 2026 تصميم وبرمجة سمير معتوق الطريفي
        </p>
      </div>
    </div>
  );
}
