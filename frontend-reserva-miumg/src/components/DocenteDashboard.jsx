import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  LayoutDashboard, Building2, CalendarCheck, Calendar as CalendarIcon,
  LogOut, Plus, X, AlertCircle, Clock, User, FileText
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000/api';

export default function DocenteDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('calendario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    recurso_id: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '', hora_fin: '', motivo: ''
  });
  const [errorValidacion, setErrorValidacion] = useState('');
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API}/reservas`, config),
      axios.get(`${API}/recursos`, config)
    ]).then(([resR, resRec]) => {
      const infoMapeada = resR.data.map(r => ({
        id: r.id,
        title: r.recurso_nombre || `Recurso #${r.recurso_id}`,
        start: r.inicio, end: r.fin,
        backgroundColor: r.estado === 'aprobada' ? '#dcfce7' : r.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
        borderColor: r.estado === 'aprobada' ? '#22c55e' : r.estado === 'rechazada' ? '#ef4444' : '#eab308',
        textColor: r.estado === 'aprobada' ? '#166534' : r.estado === 'rechazada' ? '#991b1b' : '#854d0e',
        extendedProps: {
          recurso_id: r.recurso_id, recurso_nombre: r.recurso_nombre,
          usuario_nombre: r.usuario_nombre || 'Usuario',
          ubicacion: r.ubicacion, notas: r.notas, estado: r.estado,
          inicioStr: r.inicio, finStr: r.fin
        }
      }));
      setEventos(infoMapeada);
      setRecursos(resRec.data);
    }).catch(() => {
      setRecursos([
        { id: 1, nombre: 'Laboratorio de Computación 1', ubicacion: 'Edificio B - Segundo Piso' },
        { id: 2, nombre: 'Auditorio Principal', ubicacion: 'Edificio A - Primer Piso' },
        { id: 3, nombre: 'Sala de Conferencias A', ubicacion: 'Edificio C' }
      ]);
    });
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
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reservas`, {
        usuario_id: user.id, recurso_id: formData.recurso_id,
        inicio, fin, notas: formData.motivo,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMostrarFormulario(false);
      setFormData({ recurso_id: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fin: '', motivo: '' });
    } catch (err) {
      setErrorValidacion(err.response?.data?.error || 'Error al crear reserva');
    }
  };

  const navItems = [
    { key: 'calendario', icon: CalendarIcon, label: 'Calendario' },
    { key: 'reservas', icon: CalendarCheck, label: 'Mis Reservas' },
    { key: 'recursos', icon: Building2, label: 'Recursos' },
  ];

  const s = {
    layout: { display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#ffffff', color: '#1e293b', overflow: 'hidden' },
    sidebar: { width: '240px', backgroundColor: '#f4f5f6', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 16px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    topBar: { height: '70px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' },
    workspace: { flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#f8fafc' },
    navLink: (active) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', color: active ? '#0f172a' : '#475569', backgroundColor: active ? '#ffffff' : 'transparent', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', fontWeight: active ? '600' : '500', fontSize: '14px', cursor: 'pointer' }),
    sidePanel: { width: '380px', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', padding: '24px', overflowY: 'auto' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    badge: (estado) => ({ padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : '#fef9c3', color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : '#a16207' }),
  };

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#ffffff', fontWeight: '700' }}>U</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>U-SALA</h2>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map(item => (
              <div key={item.key} onClick={() => setVistaActiva(item.key)} style={s.navLink(vistaActiva === item.key)}>
                <item.icon size={18} /> {item.label}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topBar}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Panel Docente</span>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Reservación de Espacios</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{user.nombre_completo}</span>
            <button onClick={() => setMostrarFormulario(!mostrarFormulario)} style={s.btnPrimary}>
              <Plus size={16} /> Nueva Reserva
            </button>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}><LogOut size={14} /> Cerrar sesión</button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <section style={s.workspace}>
            {vistaActiva === 'calendario' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Leyenda:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fef9c3', border: '1px solid #eab308' }}></span> Pendiente</span>
                  <span><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#dcfce7', border: '1px solid #22c55e', display: 'inline-block' }}></span> Aprobada</span>
                  <span><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', display: 'inline-block' }}></span> Rechazada</span>
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
                  eventClick={(info) => setReservaSeleccionada(info.event.extendedProps)}
                />
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
                      <div key={r.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600' }}>{r.nombre}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{r.ubicacion || ''}</p>
                        </div>
                        <button onClick={() => { setFormData({ ...formData, recurso_id: r.id }); setMostrarFormulario(true); }} style={{ padding: '8px 14px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Reservar</button>
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

          {mostrarFormulario && (
            <aside style={s.sidePanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Nueva Reserva</h3>
                <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              {errorValidacion && (
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorValidacion}</span>
                </div>
              )}
              <form onSubmit={handleCrearReserva}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Recurso</label>
                  <select required value={formData.recurso_id} onChange={(e) => setFormData({ ...formData, recurso_id: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Seleccionar</option>
                    {recursos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Fecha</label>
                  <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Inicio</label>
                    <input type="time" required value={formData.hora_inicio} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Fin</label>
                    <input type="time" required value={formData.hora_fin} onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Motivo</label>
                  <textarea rows={3} required value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#6366f1', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Crear Reserva</button>
              </form>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
