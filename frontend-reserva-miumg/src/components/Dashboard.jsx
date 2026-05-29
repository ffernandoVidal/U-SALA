import { useState, useEffect, useCallback } from 'react';
import { getReservas } from '../services/reservaService';
import { getRecursosActivos } from '../services/recursoService';
import { crearReserva } from '../services/reservaService';
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
    backgroundColor: r.estado === 'aprobada' ? '#dcfce7' : r.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
    borderColor: r.estado === 'aprobada' ? '#22c55e' : r.estado === 'rechazada' ? '#ef4444' : '#eab308',
    textColor: r.estado === 'aprobada' ? '#166534' : r.estado === 'rechazada' ? '#991b1b' : '#854d0e',
    extendedProps: {
      recurso_id: r.recurso_id,
      recurso_nombre: r.recurso_nombre || `Recurso #${r.recurso_id}`,
      usuario_nombre: r.usuario_nombre || 'Usuario U-SALA',
      ubicacion: r.ubicacion || 'Edificio Asignado',
      notas: r.notas,
      estado: r.estado,
      inicioStr: r.inicio,
      finStr: r.fin,
    },
  }));

const datosMock = {
  recursos: [
    { id: 1, nombre: 'Laboratorio de Computación 1', ubicacion: 'Edificio B - Segundo Piso' },
    { id: 2, nombre: 'Auditorio Principal', ubicacion: 'Edificio A - Primer Piso' },
    { id: 3, nombre: 'Sala de Conferencias A', ubicacion: 'Edificio C' },
  ],
  eventos: [{
    id: 101,
    title: 'Laboratorio de Computación 1',
    start: '2026-05-12T14:00:00',
    end: '2026-05-12T16:00:00',
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    textColor: '#166534',
    extendedProps: {
      recurso_id: 1, recurso_nombre: 'Laboratorio de Computación 1',
      usuario_nombre: 'María García', ubicacion: 'Edificio B - Segundo Piso',
      notas: 'Práctica de programación del curso de Sistemas Operativos.',
      estado: 'aprobada', inicioStr: '2026-05-12T14:00:00', finStr: '2026-05-12T16:00:00',
    },
  }],
};

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
      setRecursos(datosMock.recursos);
      setEventos(datosMock.eventos);
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

  const verificarColisionLocal = (nuevoInicioStr, nuevoFinStr, recursoId) => {
    const tNuevaInicio = new Date(nuevoInicioStr).getTime();
    const tNuevaFin = new Date(nuevoFinStr).getTime();
    return eventos.some(ev => {
      if (ev.extendedProps.estado === 'rechazada' || ev.extendedProps.estado === 'cancelada') return false;
      if (Number(ev.extendedProps.recurso_id) !== Number(recursoId)) return false;
      const tEvInicio = new Date(ev.start).getTime();
      const tEvFin = new Date(ev.end).getTime();
      return tNuevaInicio < tEvFin && tNuevaFin > tEvInicio;
    });
  };

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    const inicio = `${formData.fecha}T${formData.hora_inicio}:00`;
    const fin = `${formData.fecha}T${formData.hora_fin}:00`;

    if (new Date(inicio) >= new Date(fin)) {
      setErrorValidacion('La hora de inicio debe ser cronológicamente menor a la hora de finalización.');
      return;
    }

    if (verificarColisionLocal(inicio, fin, formData.recurso_id)) {
      setErrorValidacion('Conflicto de disponibilidad: El recurso seleccionado ya se encuentra reservado.');
      return;
    }

    try {
      await crearReserva({
        usuario_id: parseInt(user.id, 10),
        recurso_id: parseInt(formData.recurso_id, 10),
        inicio,
        fin,
        notes: formData.motivo,
      });
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      cargarDatos();
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error de integridad referencial.');
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
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Mis Reservas</h3>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Próximamente podrás ver tus reservas aquí.</p>
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
          />
        </div>

        <ReservaModal
          reserva={reservaSeleccionada}
          onClose={() => setReservaSeleccionada(null)}
        />

        <UnderConstructionModal
          titulo={modalConstruccion ? `${modalConstruccion} — Estamos trabajando en ello` : null}
          onClose={() => setModalConstruccion(null)}
        />
      </div>
    </div>
  );
}
