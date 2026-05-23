import Dashboard from './Dashboard';

export default function AdminDashboard({ user, onLogout }) {
  return <Dashboard user={user} onLogout={onLogout} />;
}
