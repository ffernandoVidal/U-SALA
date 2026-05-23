import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_NAMES = { 1: 'administrador', 2: 'docente', 3: 'usuario' };

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    const roleName = ROLE_NAMES[user.role_id] || 'usuario';
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', textAlign: 'center' }}>
        <div>
          <h2>Acceso denegado</h2>
          <p>Tu rol ({roleName}) no tiene permisos para acceder a esta página.</p>
          <a href="/" style={{ color: '#6366f1' }}>Volver al inicio</a>
        </div>
      </div>
    );
  }

  return children;
}
