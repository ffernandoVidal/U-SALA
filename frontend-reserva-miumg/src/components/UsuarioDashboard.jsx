import { useState, useEffect } from 'react';
import { LogOut, CalendarCheck, Clock, User as UserIcon, FileText, X } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:3000/api';

export default function UsuarioDashboard({ user, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/reservas/usuario/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setReservas(res.data)).catch(() => {});
  }, [user.id]);

  const formatearFecha = (str) =>
    new Date(str).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatearHora = (str) =>
    new Date(str).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

  const badge = (estado) => ({
    padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600',
    textTransform: 'capitalize',
    backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
    color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : '#a16207',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <aside style={{ width: '240px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#ffffff', fontWeight: '700' }}>U</div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>U-SALA</h2>
              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600' }}>Usuario</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f4f5f6', fontWeight: '600', fontSize: '14px' }}>
            <CalendarCheck size={18} /> Mis Reservas
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Mis Reservas</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Historial de tus reservaciones</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{user.nombre_completo}</span>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}><LogOut size={14} /> Cerrar sesión</button>
          </div>
        </div>

        {reservas.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
            <CalendarCheck size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#475569' }}>No tienes reservas</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Las reservas que realices aparecerán aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reservas.map(r => (
              <div
                key={r.id}
                onClick={() => setDetalle(r)}
                style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{r.recurso_nombre || `Recurso #${r.recurso_id}`}</p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {formatearFecha(r.inicio)}</span>
                    <span>{formatearHora(r.inicio)} - {formatearHora(r.fin)}</span>
                  </div>
                </div>
                <span style={badge(r.estado)}>{r.estado}</span>
              </div>
            ))}
          </div>
        )}

        {detalle && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 999 }}
            onClick={() => setDetalle(null)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Detalle de Reserva</h3>
                <button onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <FileText size={16} style={{ color: '#64748b', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block' }}>Recurso</span>
                    <span style={{ fontWeight: '500' }}>{detalle.recurso_nombre || `Recurso #${detalle.recurso_id}`}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Clock size={16} style={{ color: '#64748b', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block' }}>Horario</span>
                    <span>{formatearFecha(detalle.inicio)}, {formatearHora(detalle.inicio)} - {formatearHora(detalle.fin)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={badge(detalle.estado)}>{detalle.estado}</span>
                </div>
                {detalle.notas && (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#334155' }}>"{detalle.notas}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
