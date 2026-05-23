import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const styles = {
  container: {
    display: 'flex', minHeight: '100vh', backgroundColor: '#f4f5f6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  leftPanel: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    alignItems: 'center', padding: '40px', backgroundColor: '#ffffff',
  },
  rightPanel: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    alignItems: 'center', padding: '40px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#ffffff',
  },
  card: {
    width: '100%', maxWidth: '400px', padding: '32px',
    borderRadius: '16px', backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  tabRow: {
    display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '24px',
  },
  tab: (active) => ({
    flex: 1, padding: '12px', border: 'none', background: 'none',
    cursor: 'pointer', fontWeight: active ? '700' : '500',
    fontSize: '14px', color: active ? '#6366f1' : '#64748b',
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    marginBottom: '-2px',
  }),
  input: {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    backgroundColor: '#6366f1', color: '#ffffff', fontWeight: '700',
    fontSize: '15px', cursor: 'pointer',
  },
  error: {
    padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2', color: '#991b1b', fontSize: '13px',
    marginBottom: '16px', textAlign: 'center',
  },
};

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('google');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleGoogleSuccess = async (response) => {
    setError('');
    try {
      await loginWithGoogle(response.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión con Google');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Completa todos los campos');
      return;
    }
    try {
      await loginWithEmail(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '48px', height: '48px', backgroundColor: '#6366f1',
              borderRadius: '12px', display: 'grid', placeItems: 'center',
              color: '#ffffff', fontWeight: '700', fontSize: '20px',
              margin: '0 auto 12px',
            }}>U</div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
              Iniciar Sesión
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              Ingresa al sistema de reservas U-SALA
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.tabRow}>
            <button style={styles.tab(tab === 'google')} onClick={() => setTab('google')}>
              Google
            </button>
            <button style={styles.tab(tab === 'email')} onClick={() => setTab('email')}>
              Correo y Contraseña
            </button>
          </div>

          {tab === 'google' ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error con Google. Intenta de nuevo.')}
              />
            </div>
          ) : (
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Correo institucional
                </label>
                <input
                  type="email"
                  placeholder="correo@miumg.edu.gt"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <button type="submit" style={styles.btn}>
                Iniciar Sesión
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
              Registrarse
            </Link>
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          U-SALA
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9, textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
          Sistema de gestión y reservación de espacios académicos para la Universidad Mariano Gálvez
        </p>
      </div>
    </div>
  );
}
