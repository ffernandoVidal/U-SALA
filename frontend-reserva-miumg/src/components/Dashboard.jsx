import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getReservas, crearReserva, aprobarReserva, rechazarReserva, cancelarReserva } from '../services/reservaService';
import { getRecursosActivos } from '../services/recursoService';
import Sidebar from './Sidebar';
import Header from './Header';
import CalendarView from './CalendarView';
import ReservaForm from './ReservaForm';
import ReservaModal from './ReservaModal';
import AdminUsers from './AdminUsers';
import ResourcesView from './ResourcesView';
import UnderConstructionModal from './UnderConstructionModal';

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
      usuario_nombre: r.usuario_nombre || 'Usuario U-SALA',
      ubicacion: r.recurso_ubicacion || 'Edificio Asignado',
      notas: r.notas,
      motivo: r.motivo,
      estado: r.estado,
      inicioStr: r.inicio,
      finStr: r.fin,
      usuario_id: r.usuario_id,
    },
  }));

export default function Dashboard({ user, onLogout }) {
  const [eventos, setEventos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '', hora_fin: '', motivo: '',
  });
  const [errorValidacion, setErrorValidacion] = useState('');
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [modalConstruccion, setModalConstruccion] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [reservas, recursosData] = await Promise.all([
        getReservas(),
        getRecursosActivos(),
      ]);
      setEventos(formatearEventos(reservas));
      setRecursos(recursosData);
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (vistaActiva === 'dashboard') setModalConstruccion('Dashboard');
    else if (vistaActiva === 'reportes') setModalConstruccion('Reportes');
    else setModalConstruccion(null);
  }, [vistaActiva]);

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    const inicio = `${formData.fecha}T${formData.hora_inicio}:00`;
    const fin = `${formData.fecha}T${formData.hora_fin}:00`;

    if (new Date(inicio) >= new Date(fin)) {
      setErrorValidacion('La hora de inicio debe ser anterior a la hora de finalización.');
      return;
    }

    try {
      await crearReserva({
        usuario_id: parseInt(user.id, 10),
        recurso_id: parseInt(formData.recurso_id, 10),
        inicio,
        fin,
        notes: formData.motivo,
        motivo: formData.motivo,
      });
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      await cargarDatos();
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error al crear la reserva.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await aprobarReserva(id);
      setReservaSeleccionada(null);
      await cargarDatos();
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error al aprobar la reserva');
    }
  };

  const handleReject = async (id, motivo) => {
    try {
      await rechazarReserva(id, motivo);
      setReservaSeleccionada(null);
      await cargarDatos();
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error al rechazar la reserva');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelarReserva(id, 'Cancelado por el administrador');
      setReservaSeleccionada(null);
      await cargarDatos();
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error al cancelar la reserva');
    }
  };

  const vistaPlaceholder = (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'left' }}>
      <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'capitalize' }}>Sección {vistaActiva}</h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Módulo en desarrollo para la gestión interna de U-SALA.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#ffffff', color: '#1e293b', overflow: 'hidden' }}>
      <Sidebar vistaActiva={vistaActiva} onNavigate={setVistaActiva} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <Header
          user={user}
          onLogout={onLogout}
          onNuevaReserva={vistaActiva === 'calendario' ? () => setMostrarFormulario(!mostrarFormulario) : undefined}
          titulo={vistaActiva === 'recursos' ? 'Gestión de Recursos' : vistaActiva === 'usuarios' ? 'Gestión de Usuarios' : undefined}
          subtitulo={vistaActiva === 'recursos' ? 'Administración' : vistaActiva === 'usuarios' ? 'Administración' : undefined}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
          <section style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={cargarDatos}
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
            {vistaActiva === 'calendario' ? (
              <CalendarView
                eventos={eventos}
                onDateClick={(arg) => {
                  setFormData({ ...formData, fecha: arg.dateStr });
                  setMostrarFormulario(true);
                }}
                onEventClick={(info) => setReservaSeleccionada(info.event.extendedProps)}
              />
            ) : vistaActiva === 'recursos' ? (
              <ResourcesView />
            ) : vistaActiva === 'usuarios' ? (
              <AdminUsers />
            ) : vistaActiva === 'reservas' ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Todas las Reservas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  {eventos.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>No hay reservas registradas.</p>
                  ) : (
                    eventos.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setReservaSeleccionada(ev.extendedProps)}
                        style={{
                          padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{ev.title}</span>
                          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                            {new Date(ev.start).toLocaleDateString('es-GT')} {new Date(ev.start).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span style={{
                          padding: '2px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: ev.extendedProps.estado === 'aprobada' ? '#dcfce7' : ev.extendedProps.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
                          color: ev.extendedProps.estado === 'aprobada' ? '#15803d' : ev.extendedProps.estado === 'rechazada' ? '#b91c1c' : '#a16207',
                        }}>
                          {ev.extendedProps.estado}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              vistaPlaceholder
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

        <ReservaModal
          reserva={reservaSeleccionada}
          onClose={() => setReservaSeleccionada(null)}
          user={user}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
        />

        <UnderConstructionModal
          titulo={modalConstruccion ? `${modalConstruccion} — Estamos trabajando en ello` : null}
          onClose={() => setModalConstruccion(null)}
        />
      </div>
    </div>
  );
}
