import { useState } from 'react';
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

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre_completo || !form.email || !form.password || !form.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!form.email.endsWith('@miumg.edu.gt')) {
      setError('Debes usar tu correo institucional @miumg.edu.gt');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await registerUser(form.email, form.nombre_completo, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
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
              Crear Cuenta
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
              Regístrate en el sistema U-SALA
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                style={styles.input}
                required
              />
            </div>
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" style={styles.btn}>
              Crear cuenta
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          U-SALA
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9, textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
          Crea tu cuenta y empieza a reservar espacios académicos de forma rápida y sencilla
        </p>
      </div>
    </div>
  );
}
