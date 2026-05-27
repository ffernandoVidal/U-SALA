import { useState, useEffect, useCallback } from 'react';
import { Building2, CalendarCheck, Calendar as CalendarIcon } from 'lucide-react';
import { getReservas } from '../services/reservaService';
import { getRecursos } from '../services/recursoService';
import { crearReserva } from '../services/reservaService';
import Sidebar from './Sidebar';
import Header from './Header';
import CalendarView from './CalendarView';
import ReservaForm from './ReservaForm';

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
    backgroundColor: r.estado === 'aprobada' ? '#dcfce7' : r.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
    borderColor: r.estado === 'aprobada' ? '#22c55e' : r.estado === 'rechazada' ? '#ef4444' : '#eab308',
    textColor: r.estado === 'aprobada' ? '#166534' : r.estado === 'rechazada' ? '#991b1b' : '#854d0e',
    extendedProps: {
      recurso_id: r.recurso_id, recurso_nombre: r.recurso_nombre,
      usuario_nombre: r.usuario_nombre || 'Usuario',
      ubicacion: r.ubicacion, notas: r.notas, estado: r.estado,
      inicioStr: r.inicio, finStr: r.fin,
    },
  }));

export default function DocenteDashboard({ user, onLogout }) {
  const [eventos, setEventos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '', hora_fin: '', motivo: '',
  });
  const [errorValidacion, setErrorValidacion] = useState('');

  const cargarDatos = useCallback(async () => {
    try {
      const [reservas, recursosData] = await Promise.all([
        getReservas(),
        getRecursos(),
      ]);
      setEventos(formatearEventos(reservas));
      setRecursos(recursosData);
    } catch {
      setRecursos([
        { id: 1, nombre: 'Laboratorio de Computación 1', ubicacion: 'Edificio B' },
        { id: 2, nombre: 'Auditorio Principal', ubicacion: 'Edificio A' },
        { id: 3, nombre: 'Sala de Conferencias A', ubicacion: 'Edificio C' },
      ]);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarColision = (nuevoInicio, nuevoFin, recursoId) => {
    const t1 = new Date(nuevoInicio).getTime();
    const t2 = new Date(nuevoFin).getTime();
    return eventos.some(ev => {
      if (ev.extendedProps.estado === 'rechazada' || ev.extendedProps.estado === 'cancelada') return false;
      if (Number(ev.extendedProps.recurso_id) !== Number(recursoId)) return false;
      const e1 = new Date(ev.start).getTime();
      const e2 = new Date(ev.end).getTime();
      return t1 < e2 && t2 > e1;
    });
  };

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    const inicio = `${formData.fecha}T${formData.hora_inicio}:00`;
    const fin = `${formData.fecha}T${formData.hora_fin}:00`;

    if (new Date(inicio) >= new Date(fin)) {
      setErrorValidacion('La hora de inicio debe ser menor a la de finalización.');
      return;
    }

    if (verificarColision(inicio, fin, formData.recurso_id)) {
      setErrorValidacion('Conflicto de disponibilidad.');
      return;
    }

    try {
      await crearReserva({
        usuario_id: user.id, recurso_id: formData.recurso_id,
        inicio, fin, notes: formData.motivo,
      });
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      cargarDatos();
    } catch (err) {
      setErrorValidacion(err.response?.data?.error || 'Error al crear reserva');
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
            {vistaActiva === 'calendario' && (
              <CalendarView
                eventos={eventos}
                onDateClick={(arg) => {
                  setFormData({ ...formData, fecha: arg.dateStr });
                  setMostrarFormulario(true);
                }}
                onEventClick={() => {}}
              />
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

            {vistaActiva === 'reservas' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Mis Reservas</h3>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Próximamente podrás ver tus reservas aquí.</p>
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
          />
        </div>
      </div>
    </div>
  );
}
