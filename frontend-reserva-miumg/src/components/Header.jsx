import { Plus, LogOut } from 'lucide-react';

const styles = {
  topBar: {
    height: '70px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backgroundColor: '#ffffff',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
};

export default function Header({ user, onLogout, onNuevaReserva, titulo, subtitulo }) {
  return (
    <header style={styles.topBar}>
      <div style={{ textAlign: 'left' }}>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {subtitulo || 'Panel de Control'}
        </span>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          {titulo || 'Reservación de Espacios'}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{user.nombre_completo}</span>
        {onNuevaReserva && (
          <button onClick={onNuevaReserva} style={styles.btnPrimary}>
            <Plus size={16} /> Nueva Reserva
          </button>
        )}
        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </header>
  );
}
