import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  LayoutDashboard, Building2, CalendarCheck, Calendar as CalendarIcon, 
  Users, BarChart3, LogOut, Bell, Plus, X, AlertCircle, Clock, User, FileText
} from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [eventos, setEventos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  
  // Estados para controlar el formulario lateral derecho
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: '',
    motivo: ''
  });
  const [errorValidacion, setErrorValidacion] = useState('');

  // NUEVO ESTADO: Control de la tarjeta emergente de detalle de reserva
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  // 1. Sincronización asíncrona con el Backend de la UMG
  const cargarDatos = async () => {
    try {
      const [resReservas, resRecursos] = await Promise.all([
        axios.get('http://localhost:3000/api/reservas'),
        axios.get('http://localhost:3000/api/recursos')
      ]);
      
      const infoMapeada = resReservas.data.map(reserva => ({
        id: reserva.id,
        title: reserva.recurso_nombre || `Recurso #${reserva.recurso_id}`,
        start: reserva.inicio, 
        end: reserva.fin,      
        backgroundColor: reserva.estado === 'aprobada' ? '#dcfce7' : reserva.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
        borderColor: reserva.estado === 'aprobada' ? '#22c55e' : reserva.estado === 'rechazada' ? '#ef4444' : '#eab308',
        textColor: reserva.estado === 'aprobada' ? '#166534' : reserva.estado === 'rechazada' ? '#991b1b' : '#854d0e',
        extendedProps: {
          recurso_id: reserva.recurso_id,
          recurso_nombre: reserva.recurso_nombre || `Recurso #${reserva.recurso_id}`,
          usuario_nombre: reserva.usuario_nombre || 'Usuario U-SALA',
          ubicacion: reserva.ubicacion || 'Edificio Asignado',
          notas: reserva.notas,
          estado: reserva.estado,
          inicioStr: reserva.inicio,
          finStr: reserva.fin
        }
      }));
      setEventos(infoMapeada);
      setRecursos(resRecursos.data);
    } catch (error) {
      console.warn("Utilizando banco de datos local simulado (Fallback de contingencia)...");
      setRecursos([
        { id: 1, nombre: 'Laboratorio de Computación 1', ubicacion: 'Edificio B - Segundo Piso' },
        { id: 2, nombre: 'Auditorio Principal', ubicacion: 'Edificio A - Primer Piso' },
        { id: 3, nombre: 'Sala de Conferencias A', ubicacion: 'Edificio C' }
      ]);
      setEventos([
        { 
          id: 101,
          title: 'Laboratorio de Computación 1', 
          start: '2026-05-12T14:00:00', 
          end: '2026-05-12T16:00:00', 
          backgroundColor: '#dcfce7', 
          borderColor: '#22c55e', 
          textColor: '#166534', 
          extendedProps: { 
            recurso_id: 1, 
            recurso_nombre: 'Laboratorio de Computación 1',
            usuario_nombre: 'María García',
            ubicacion: 'Edificio B - Segundo Piso',
            notas: 'Práctica de programación del curso de Sistemas Operativos utilizando entornos Linux.', 
            estado: 'aprobada',
            inicioStr: '2026-05-12T14:00:00',
            finStr: '2026-05-12T16:00:00'
          } 
        }
      ]);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const verificarColisionLocal = (nuevoInicioStr, nuevoFinStr, recursoId) => {
    const tNuevaInicio = new Date(nuevoInicioStr).getTime();
    const tNuevaFin = new Date(nuevoFinStr).getTime();

    for (let evento of eventos) {
      if (evento.extendedProps.estado === 'rechazada' || evento.extendedProps.estado === 'cancelada') {
        continue;
      }
      if (Number(evento.extendedProps.recurso_id) === Number(recursoId)) {
        const tEvInicio = new Date(evento.start).getTime();
        const tEvFin = new Date(evento.end).getTime();
        if (tNuevaInicio < tEvFin && tNuevaFin > tEvInicio) {
          return true;
        }
      }
    }
    return false;
  };

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    const timestampInicio = `${formData.fecha}T${formData.hora_inicio}:00`;
    const timestampFin = `${formData.fecha}T${formData.hora_fin}:00`;

    if (new Date(timestampInicio) >= new Date(timestampFin)) {
      setErrorValidacion('La hora de inicio debe ser cronológicamente menor a la hora de finalización.');
      return;
    }

    const colisiona = verificarColisionLocal(timestampInicio, timestampFin, formData.recurso_id);
    if (colisiona) {
      setErrorValidacion('Conflicto de disponibilidad: El recurso seleccionado ya se encuentra reservado.');
      return;
    }

    try {
      const payload = {
        usuario_id: parseInt(user.id, 10),     
        recurso_id: parseInt(formData.recurso_id, 10), 
        inicio: timestampInicio,               
        fin: timestampFin,                     
        notas: formData.motivo                 
      };
      await axios.post('http://localhost:3000/api/reservas', payload);
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
      cargarDatos(); 
    } catch (error) {
      setErrorValidacion(error.response?.data?.error || 'Error de integridad referencial.');
    }
  };

  // Formateadores auxiliares de fecha y hora para la tarjeta de detalle
  const formatearHoraRange = (inicio, fin) => {
    const format = (str) => new Date(str).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${format(inicio)} - ${format(fin)}`;
  };

  const formatearFechaLarga = (str) => {
    return new Date(str).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const styles = {
    layout: { display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#ffffff', color: '#1e293b', overflow: 'hidden', margin: 0, padding: 0 },
    sidebar: { width: '260px', backgroundColor: '#f4f5f6', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', height: '100%' },
    brandArea: { display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', marginBottom: '32px' },
    brandIcon: { width: '32px', height: '32px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#ffffff', fontWeight: '700' },
    navLink: (activo) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', color: activo ? '#0f172a' : '#475569', backgroundColor: activo ? '#ffffff' : 'transparent', boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', fontWeight: activo ? '600' : '500', fontSize: '14px', cursor: 'pointer' }),
    main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' },
    topBar: { height: '70px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: '#ffffff' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    contentArea: { flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#f8fafc' },
    workspace: { flex: 1, padding: '32px', overflowY: 'auto' },
    sidePanelForm: { width: '400px', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '24px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', textAlign: 'left' },
    input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
    label: { fontSize: '13px', fontWeight: '600', color: '#475569' },

    // ESTILOS DE LA TARJETA EMERGENTE (MODAL POP-OVER)
    modalOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 999 },
    modalCard: { width: '520px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'fadeIn 0.15s ease-out' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
    badge: (estado) => ({
      padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
      backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
      color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : '#a16207'
    }),
    infoRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#334155' },
    notesBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginTop: '4px' }
  };

  return (
    <div style={styles.layout}>
      
      {/* MENÚ LATERAL IZQUIERDO */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandArea}>
            <div style={styles.brandIcon}>U</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>U-SALA</h2>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div onClick={() => setVistaActiva('dashboard')} style={styles.navLink(vistaActiva === 'dashboard')}><LayoutDashboard size={18} /> Dashboard</div>
            <div onClick={() => setVistaActiva('recursos')} style={styles.navLink(vistaActiva === 'recursos')}><Building2 size={18} /> Recursos</div>
            <div onClick={() => setVistaActiva('reservas')} style={styles.navLink(vistaActiva === 'reservas')}><CalendarCheck size={18} /> Reservas</div>
            <div onClick={() => setVistaActiva('calendario')} style={styles.navLink(vistaActiva === 'calendario')}><CalendarIcon size={18} /> Calendario</div>
            <div onClick={() => setVistaActiva('usuarios')} style={styles.navLink(vistaActiva === 'usuarios')}><Users size={18} /> Usuarios</div>
            <div onClick={() => setVistaActiva('reportes')} style={styles.navLink(vistaActiva === 'reportes')}><BarChart3 size={18} /> Reportes</div>
          </nav>
        </div>
        <div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}><LogOut size={14} /> Cerrar sesión</button>
        </div>
      </aside>

      {/* ÁREA CONTENEDORA PRINCIPAL */}
      <div style={styles.main}>
        <header style={styles.topBar}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Panel de Control</span>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Reservación de Espacios</h1>
          </div>
          <div>
            <button onClick={() => setMostrarFormulario(!mostrarFormulario)} style={styles.btnPrimary}>
              <Plus size={16} /> Nueva Reserva
            </button>
          </div>
        </header>

        <div style={styles.contentArea}>
          
          {/* VISTA DEL CALENDARIO */}
          <section style={styles.workspace}>
            {vistaActiva === 'calendario' ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Leyenda:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fef9c3', border: '1px solid #eab308' }}></span> Pendiente</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#dcfce7', border: '1px solid #22c55e' }}></span> Aprobada</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}></span> Rechazada</span>
                </div>
                
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="es"
                  events={eventos}
                  headerToolbar={{ left: 'title', center: '', right: 'prev,next today' }}
                  height="560px"
                  dateClick={(arg) => {
                    setFormData({ ...formData, fecha: arg.dateStr });
                    setMostrarFormulario(true);
                  }}
                  // INTERCEPTOR DE CLIC: Carga las extendedProps de la base de datos en O(1)
                  eventClick={(info) => {
                    setReservaSeleccionada(info.event.extendedProps);
                  }}
                />
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'capitalize' }}>Sección {vistaActiva}</h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', margin: 0 }}>Módulo en desarrollo para la gestión interna de U-SALA.</p>
              </div>
            )}
          </section>

          {/* FORMULARIO DESPLEGABLE EN EL LATERAL DERECHO */}
          {mostrarFormulario && (
            <aside style={styles.sidePanelForm}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Nueva Reserva</h3>
                <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {errorValidacion && (
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', textAlign: 'left' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{errorValidacion}</span>
                </div>
              )}

              <form onSubmit={handleCrearReserva}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Recurso Universitario</label>
                  <select 
                    required
                    value={formData.recurso_id} 
                    onChange={(e) => setFormData({ ...formData, recurso_id: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Seleccionar recurso</option>
                    {recursos.map(rec => (
                      <option key={rec.id} value={rec.id}>{rec.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Reserva</label>
                  <input 
                    type="date" 
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Hora Inicio</label>
                    <input 
                      type="time" 
                      required
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Hora Fin</label>
                    <input 
                      type="time" 
                      required
                      value={formData.hora_fin}
                      onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Motivo / Notas</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Escribe detalles..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    style={{ ...styles.input, resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setMostrarFormulario(false)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: '#ffffff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Crear Reserva</button>
                </div>
              </form>
            </aside>
          )}
        </div>

        {/* COMPONENTE ADAPTADO: TARJETA EMERGENTE CONFORME A LA IMAGEN DE REFERENCIA */}
        {reservaSeleccionada && (
          <div style={styles.modalOverlay} onClick={() => setReservaSeleccionada(null)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              
              {/* Encabezado del Modal con Titulo Dinámico */}
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Reservas del {formatearFechaLarga(reservaSeleccionada.inicioStr)}
                </h3>
                <button 
                  onClick={() => setReservaSeleccionada(null)} 
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Modal Basado en Tarjetas Internas de la Maqueta */}
              <div style={styles.modalBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                      {reservaSeleccionada.recurso_nombre}
                    </h4>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {reservaSeleccionada.ubicacion}
                    </span>
                  </div>
                  <span style={styles.badge(reservaSeleccionada.estado)}>
                    {reservaSeleccionada.estado}
                  </span>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                {/* Metadatos de Negocio de la Reserva */}
                <div style={styles.infoRow}>
                  <Clock size={16} style={{ color: '#64748b', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px' }}>Horario</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatearHoraRange(reservaSeleccionada.inicioStr, reservaSeleccionada.finStr)}</span>
                  </div>
                </div>

                <div style={styles.infoRow}>
                  <User size={16} style={{ color: '#64748b', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px' }}>Usuario Responsable</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{reservaSeleccionada.usuario_nombre}</span>
                  </div>
                </div>

                <div style={styles.infoRow}>
                  <FileText size={16} style={{ color: '#64748b', marginTop: '2px' }} />
                  <div style={{ width: '100%' }}>
                    <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px', marginBottom: '4px' }}>Motivo Académico</span>
                    <div style={styles.notesBox}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                        "{reservaSeleccionada.notes || 'Sin especificaciones añadidas por el solicitante.'}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;