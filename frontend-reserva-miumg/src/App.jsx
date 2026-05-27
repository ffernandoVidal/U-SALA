import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminDashboard from './components/AdminDashboard';
import DocenteDashboard from './components/DocenteDashboard';
import UsuarioDashboard from './components/UsuarioDashboard';

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}><p>Cargando...</p></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function HomePage() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const dashboards = {
    1: AdminDashboard,
    2: DocenteDashboard,
    3: UsuarioDashboard,
  };

  const DashboardComponent = dashboards[user.role_id] || UsuarioDashboard;
  return <DashboardComponent user={user} onLogout={logout} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
