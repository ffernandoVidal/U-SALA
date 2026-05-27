import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

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
  btnDisabled: {
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    backgroundColor: '#a5b4fc', color: '#ffffff', fontWeight: '700',
    fontSize: '15px', cursor: 'not-allowed',
  },
  error: {
    padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2', color: '#991b1b', fontSize: '13px',
    marginBottom: '16px', textAlign: 'center',
  },
  success: {
    padding: '10px', borderRadius: '8px', backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px',
    marginBottom: '16px', textAlign: 'center',
  },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Ingresa tu correo institucional');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
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
              Recuperar contraseña
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              Ingresa tu correo y te enviaremos un enlace
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Correo institucional
              </label>
              <input
                type="email"
                placeholder="correo@miumg.edu.gt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
            <Link to="/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          U-SALA
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9, textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
          Te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
    </div>
  );
}
