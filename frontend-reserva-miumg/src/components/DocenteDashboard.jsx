import { useState, useEffect, useCallback } from 'react';
import { Building2, CalendarCheck, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { getAllReservas, crearReserva, cancelarReserva, getMisReservas } from '../services/reservaService';
import { getRecursos } from '../services/recursoService';
import Sidebar from './Sidebar';
import Header from './Header';
import CalendarView from './CalendarView';
import ReservaForm from './ReservaForm';
import ReservaModal from './ReservaModal';

const navItems = [
  { key: 'calendario', icon: CalendarIcon, label: 'Calendario' },
  { key: 'reservas', icon: CalendarCheck, label: 'Mis Reservas' },
  { key: 'recursos', icon: Building2, label: 'Recursos' },
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
      recurso_nombre: r.recurso_nombre,
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

export default function DocenteDashboard({ user, onLogout }) {
  const [eventos, setEventos] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '', hora_fin: '', motivo: '',
  });
  const [errorValidacion, setErrorValidacion] = useState('');
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [reservas, recursosData] = await Promise.all([
        getAllReservas(),
        getRecursos(),
      ]);
      setEventos(formatearEventos(reservas));
      setRecursos(recursosData);
    } catch {
      // silent fallback
    }
  }, []);

  const cargarMisReservas = useCallback(async () => {
    try {
      const data = await getMisReservas(user.id);
      setMisReservas(data);
    } catch {
      // silent fallback
    }
  }, [user.id]);

  useEffect(() => {
    cargarDatos();
    cargarMisReservas();
  }, [cargarDatos, cargarMisReservas]);

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
      await Promise.all([cargarDatos(), cargarMisReservas()]);
    } catch (err) {
      setErrorValidacion(err.response?.data?.error || 'Error al crear reserva');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelarReserva(id, 'Cancelado por el docente');
      setReservaSeleccionada(null);
      await Promise.all([cargarDatos(), cargarMisReservas()]);
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error al cancelar la reserva');
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <Sidebar vistaActiva={vistaActiva} onNavigate={setVistaActiva} items={navItems} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          user={user}
          onLogout={onLogout}
          onNuevaReserva={() => setMostrarFormulario(!mostrarFormulario)}
          subtitulo="Panel Docente"
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <section style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={() => { cargarDatos(); cargarMisReservas(); }}
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
                onEventClick={(info) => setReservaSeleccionada(info.event.extendedProps)}
              />
            )}

            {vistaActiva === 'reservas' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Mis Reservas</h3>
                {misReservas.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '12px' }}>No tienes reservas aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    {misReservas.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setReservaSeleccionada({
                          ...r,
                          recurso_nombre: r.recurso_nombre,
                          inicioStr: r.inicio,
                          finStr: r.fin,
                        })}
                        style={{
                          padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{r.recurso_nombre || `Recurso #${r.recurso_id}`}</span>
                          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                            {new Date(r.inicio).toLocaleDateString('es-GT')} {new Date(r.inicio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span style={{
                          padding: '2px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: r.estado === 'aprobada' ? '#dcfce7' : r.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
                          color: r.estado === 'aprobada' ? '#15803d' : r.estado === 'rechazada' ? '#b91c1c' : '#a16207',
                        }}>
                          {r.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vistaActiva === 'recursos' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Recursos Disponibles</h3>
                {recursos.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No hay recursos disponibles.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {recursos.map(r => (
                      <div key={r.id} style={{
                        padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600' }}>{r.nombre}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{r.ubicacion || ''}</p>
                        </div>
                        <button
                          onClick={() => { setFormData({ ...formData, recurso_id: r.id }); setMostrarFormulario(true); }}
                          style={{
                            padding: '8px 14px', backgroundColor: '#6366f1', color: '#ffffff',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                          }}
                        >
                          Reservar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
