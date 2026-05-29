import { useState, useEffect, useCallback } from 'react';
import { LogOut, CalendarCheck, Clock, FileText, X, Ban, Plus, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { getMisReservas, cancelarReserva, crearReserva, getAllReservas } from '../services/reservaService';
import { getRecursosActivos } from '../services/recursoService';
import Sidebar from './Sidebar';
import Header from './Header';
import CalendarView from './CalendarView';
import ReservaForm from './ReservaForm';

const navItems = [
  { key: 'calendario', icon: CalendarIcon, label: 'Calendario' },
  { key: 'reservas', icon: CalendarCheck, label: 'Mis Reservas' },
];

const formatearEventos = (reservas) =>
  reservas.map(r => ({
    id: r.id,
    title: r.recurso_nombre || `Recurso #${r.recurso_id}`,
    start: r.inicio,
    end: r.fin,
    backgroundColor: r.estado === 'aprobada' ? '#dcfce7' : r.estado === 'rechazada' ? '#fee2e2' : r.estado === 'cancelada' ? '#f1f5f9' : '#fef9c3',
    borderColor: r.estado === 'aprobada' ? '#22c55e' : r.estado === 'rechazada' ? '#ef4444' : r.estado === 'cancelada' ? '#94a3b8' : '#eab308',
    textColor: r.estado === 'aprobada' ? '#166534' : r.estado === 'rechazada' ? '#991b1b' : r.estado === 'cancelada' ? '#475569' : '#854d0e',
    extendedProps: {
      ...r,
      recurso_nombre: r.recurso_nombre || `Recurso #${r.recurso_id}`,
      usuario_nombre: r.usuario_nombre || 'Usuario',
      ubicacion: r.recurso_ubicacion,
      notas: r.notas,
      motivo: r.motivo,
      estado: r.estado,
      inicioStr: r.inicio,
      finStr: r.fin,
      usuario_id: r.usuario_id,
    },
  }));

export default function UsuarioDashboard({ user, onLogout }) {
  const [eventos, setEventos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '', hora_fin: '', motivo: '',
  });
  const [errorValidacion, setErrorValidacion] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargarReservas = useCallback(async () => {
    try {
      const data = await getMisReservas(user.id);
      setReservas(data);
    } catch {
      // silent
    }
  }, [user.id]);

  const cargarEventos = useCallback(async () => {
    try {
      const data = await getAllReservas();
      setEventos(formatearEventos(data));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    cargarReservas();
    cargarEventos();
    getRecursosActivos()
      .then(setRecursos)
      .catch(() => {});
  }, [cargarReservas, cargarEventos]);

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    const inicio = `${formData.fecha}T${formData.hora_inicio}:00`;
    const fin = `${formData.fecha}T${formData.hora_fin}:00`;

    if (new Date(inicio) >= new Date(fin)) {
      setErrorValidacion('La hora de inicio debe ser anterior a la de finalización.');
      return;
    }

    try {
      await crearReserva({
        usuario_id: user.id,
        recurso_id: parseInt(formData.recurso_id, 10),
        inicio,
        fin,
        notes: formData.motivo,
        motivo: formData.motivo,
      });
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      await Promise.all([cargarReservas(), cargarEventos()]);
    } catch (err) {
      setErrorValidacion(err.response?.data?.error || 'Error al crear reserva');
    }
  };

  const handleCancelar = async () => {
    if (!detalle || cargando) return;
    setCargando(true);
    try {
      await cancelarReserva(detalle.id, 'Cancelado por el usuario');
      setDetalle(null);
      await Promise.all([cargarReservas(), cargarEventos()]);
    } catch (err) {
      setErrorValidacion(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (str) =>
    new Date(str).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatearHora = (str) =>
    new Date(str).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });

  const badge = (estado) => ({
    padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600',
    textTransform: 'capitalize',
    backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : estado === 'cancelada' ? '#f1f5f9' : '#fef9c3',
    color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : estado === 'cancelada' ? '#475569' : '#a16207',
  });

  const puedeCancelar = (r) => r.estado === 'pendiente' || r.estado === 'aprobada';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <Sidebar vistaActiva={vistaActiva} onNavigate={setVistaActiva} items={navItems} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          user={user}
          onLogout={onLogout}
          onNuevaReserva={() => setMostrarFormulario(!mostrarFormulario)}
          subtitulo="Panel de Usuario"
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <section style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
            {errorValidacion && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>
                {errorValidacion}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={() => { cargarEventos(); cargarReservas(); }}
                title="Actualizar"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '500', fontSize: '13px', color: '#475569',
                }}
              >
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>

            {vistaActiva === 'calendario' && (
              <CalendarView
                eventos={eventos}
                onDateClick={(arg) => {
                  setFormData({ ...formData, fecha: arg.dateStr });
                  setMostrarFormulario(true);
                }}
                onEventClick={(info) => setDetalle(info.event.extendedProps)}
              />
            )}

            {vistaActiva === 'reservas' && (
              <>
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
              </>
            )}
          </section>

          <ReservaForm
            visible={mostrarFormulario}
            onClose={() => setMostrarFormulario(false)}
            formData={formData}
            onChange={setFormData}
            recursos={recursos}
            errorValidacion={errorValidacion}
            onSubmit={handleCrearReserva}
            user={user}
          />
        </div>

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
                  {puedeCancelar(detalle) && (
                    <button
                      onClick={handleCancelar}
                      disabled={cargando}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff', cursor: cargando ? 'not-allowed' : 'pointer',
                        fontWeight: '600', fontSize: '12px', opacity: cargando ? 0.6 : 1,
                      }}
                    >
                      <Ban size={14} /> {cargando ? 'Cancelando...' : 'Cancelar Reserva'}
                    </button>
                  )}
                </div>
                {(detalle.notas || detalle.motivo) && (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#334155' }}>"{detalle.notas || detalle.motivo}"</p>
                  </div>
                )}
                {detalle.rechazo_motivo && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px' }}>
                    <span style={{ fontWeight: '600', fontSize: '12px', color: '#dc2626', display: 'block' }}>Motivo de Rechazo:</span>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#991b1b' }}>{detalle.rechazo_motivo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
