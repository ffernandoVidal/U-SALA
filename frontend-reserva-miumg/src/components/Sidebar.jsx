import { LayoutDashboard, Building2, CalendarCheck, Calendar as CalendarIcon, Users, BarChart3 } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'recursos', icon: Building2, label: 'Recursos' },
  { key: 'reservas', icon: CalendarCheck, label: 'Reservas' },
  { key: 'calendario', icon: CalendarIcon, label: 'Calendario' },
  { key: 'usuarios', icon: Users, label: 'Usuarios' },
  { key: 'reportes', icon: BarChart3, label: 'Reportes' },
];

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#f4f5f6',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    height: '100%',
  },
  brandArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingLeft: '8px',
    marginBottom: '32px',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    color: '#ffffff',
    fontWeight: '700',
  },
  navLink: (activo) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    color: activo ? '#0f172a' : '#475569',
    backgroundColor: activo ? '#ffffff' : 'transparent',
    boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    fontWeight: activo ? '600' : '500',
    fontSize: '14px',
    cursor: 'pointer',
  }),
};

export default function Sidebar({ vistaActiva, onNavigate, items }) {
  const links = items || navItems;

  return (
    <aside style={styles.sidebar}>
      <div>
        <div style={styles.brandArea}>
          <div style={styles.brandIcon}>U</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>U-SALA</h2>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(item => (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={styles.navLink(vistaActiva === item.key)}
            >
              <item.icon size={18} /> {item.label}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
