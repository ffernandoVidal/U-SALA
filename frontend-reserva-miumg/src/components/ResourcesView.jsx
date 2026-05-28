import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit3, MoreHorizontal, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Building2,
  RefreshCw,
} from 'lucide-react';
import { getRecursos, cambiarEstado, toggleActivo } from '../services/recursoService';
import ResourceStatusChip, { STATUS_CONFIG } from './ResourceStatusChip';
import ResourceFormModal from './ResourceFormModal';
import ResourceDetailModal from './ResourceDetailModal';

const TIPOS = ['', 'SALON', 'LABORATORIO', 'SALA_REUNIONES'];
const TIPO_FILTER_LABELS = { '': 'Todos los tipos', SALON: 'Salón', LABORATORIO: 'Laboratorio', SALA_REUNIONES: 'Sala de Reuniones' };
const ESTADOS_FILTER = ['', 'AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
const ESTADO_FILTER_LABELS = { '': 'Todos los estados', AVAILABLE: 'Disponible', RESERVED: 'Reservado', MAINTENANCE: 'Mantenimiento', OUT_OF_SERVICE: 'Fuera de Servicio' };
const ACTIVO_FILTER = ['', 'true', 'false'];
const ACTIVO_FILTER_LABELS = { '': 'Todos', true: 'Activos', false: 'Inactivos' };
const ITEMS_PER_PAGE = 10;

const TIPO_LABELS = { SALON: 'Salón', LABORATORIO: 'Laboratorio', SALA_REUNIONES: 'Sala de Reuniones' };

const STATUS_OPTIONS = ['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];

const styles = {
  input: {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  },
  select: {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '13px', outline: 'none', cursor: 'pointer', backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '8px', border: 'none',
    backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer',
    fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
  },
  btnOutline: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
    backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500',
    fontSize: '12px', color: '#475569',
  },
  th: {
    textAlign: 'left', padding: '12px 14px', fontWeight: '600',
    color: '#475569', fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '0.3px', whiteSpace: 'nowrap',
  },
  td: { padding: '12px 14px', fontSize: '13px', verticalAlign: 'middle' },
};

export default function ResourcesView() {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [formModal, setFormModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusMenu, setStatusMenu] = useState(null);

  const cargarRecursos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecursos({
        tipo: filtroTipo || undefined,
        estado: filtroEstado || undefined,
        activo: filtroActivo || undefined,
        search: search || undefined,
      });
      setRecursos(data);
    } catch (err) {
      setError('Error al cargar recursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroEstado, filtroActivo, search]);

  useEffect(() => { cargarRecursos(); }, [cargarRecursos]);

  useEffect(() => { setPagina(1); }, [search, filtroTipo, filtroEstado, filtroActivo]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleActivo = async (id) => {
    try {
      const updated = await toggleActivo(id);
      setRecursos((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      showSuccess(updated.esta_activo ? 'Recurso activado' : 'Recurso desactivado');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado activo');
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const updated = await cambiarEstado(id, nuevoEstado);
      setRecursos((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setStatusMenu(null);
      showSuccess(`Estado cambiado a ${STATUS_CONFIG[nuevoEstado]?.label || nuevoEstado}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const totalPages = Math.max(1, Math.ceil(recursos.length / ITEMS_PER_PAGE));
  const paginados = recursos.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Gestión de Recursos</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Administra salones, laboratorios y salas de reuniones
          </p>
        </div>
        <button onClick={() => setFormModal('create')} style={styles.btnPrimary}>
          <Plus size={16} /> Nuevo Recurso
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: '600' }}>X</button>
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#166534', fontSize: '13px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{success}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.input, width: '100%', paddingLeft: '34px' }}
          />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...styles.select, minWidth: '150px' }}>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_FILTER_LABELS[t]}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ ...styles.select, minWidth: '150px' }}>
          {ESTADOS_FILTER.map((e) => <option key={e} value={e}>{ESTADO_FILTER_LABELS[e]}</option>)}
        </select>
        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)} style={{ ...styles.select, minWidth: '120px' }}>
          {ACTIVO_FILTER.map((a) => <option key={a} value={a}>{ACTIVO_FILTER_LABELS[a]}</option>)}
        </select>
        <button onClick={cargarRecursos} style={{ ...styles.btnOutline, padding: '9px 12px' }} title="Refrescar">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>Cargando recursos...</p>
          </div>
        ) : recursos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#64748b' }}>No hay recursos</p>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {search || filtroTipo || filtroEstado ? 'Intenta con otros filtros' : 'Crea tu primer recurso'}
            </p>
            {!search && !filtroTipo && !filtroEstado && (
              <button onClick={() => setFormModal('create')} style={styles.btnPrimary}>
                <Plus size={16} /> Nuevo Recurso
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Ubicación</th>
                <th style={styles.th}>Capacidad</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Activo</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < paginados.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td style={{ ...styles.td, fontWeight: '600', color: '#6366f1', fontFamily: 'monospace', fontSize: '12px' }}>{r.codigo}</td>
                  <td style={{ ...styles.td, fontWeight: '600', color: '#0f172a' }}>{r.nombre}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                      backgroundColor: r.tipo === 'LABORATORIO' ? '#f0f9ff' : r.tipo === 'SALA_REUNIONES' ? '#fdf4ff' : '#f0fdf4',
                      color: r.tipo === 'LABORATORIO' ? '#0369a1' : r.tipo === 'SALA_REUNIONES' ? '#a21caf' : '#15803d',
                    }}>
                      {TIPO_LABELS[r.tipo] || r.tipo}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#475569' }}>{r.ubicacion || '—'}</td>
                  <td style={{ ...styles.td, color: '#475569' }}>{r.capacidad ? `${r.capacidad}` : '—'}</td>
                  <td style={styles.td}>
                    <ResourceStatusChip estado={r.estado} size="sm" />
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleActivo(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: r.esta_activo ? '#15803d' : '#94a3b8' }}
                      title={r.esta_activo ? 'Desactivar' : 'Activar'}
                    >
                      {r.esta_activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      <span style={{ fontSize: '11px', fontWeight: '600' }}>{r.esta_activo ? 'Sí' : 'No'}</span>
                    </button>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => setDetailModal(r)} style={styles.btnOutline} title="Ver detalle">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setFormModal(r)} style={styles.btnOutline} title="Editar">
                        <Edit3 size={13} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setStatusMenu(statusMenu === r.id ? null : r.id)} style={styles.btnOutline} title="Cambiar estado">
                          <MoreHorizontal size={13} />
                        </button>
                        {statusMenu === r.id && (
                          <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                            backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0', zIndex: 50, minWidth: '160px', overflow: 'hidden',
                          }}>
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleCambiarEstado(r.id, s)}
                                style={{
                                  display: 'block', width: '100%', padding: '8px 14px', border: 'none',
                                  background: r.estado === s ? '#f0fdf4' : 'none', cursor: 'pointer',
                                  fontSize: '12px', fontWeight: r.estado === s ? '700' : '500',
                                  color: r.estado === s ? '#166534' : '#334155', textAlign: 'left',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = r.estado === s ? '#f0fdf4' : 'none'}
                              >
                                → {STATUS_CONFIG[s]?.label || s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && recursos.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Mostrando {(pagina - 1) * ITEMS_PER_PAGE + 1}–{Math.min(pagina * ITEMS_PER_PAGE, recursos.length)} de {recursos.length} recursos
            </span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: pagina === 1 ? 'not-allowed' : 'pointer', opacity: pagina === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  style={{
                    width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                    backgroundColor: p === pagina ? '#6366f1' : 'transparent',
                    color: p === pagina ? '#fff' : '#475569',
                    fontWeight: p === pagina ? '700' : '500', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
                disabled={pagina === totalPages}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: pagina === totalPages ? 'not-allowed' : 'pointer', opacity: pagina === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {formModal && (
        <ResourceFormModal
          recurso={formModal === 'create' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSuccess={() => { cargarRecursos(); showSuccess(formModal === 'create' ? 'Recurso creado exitosamente' : 'Recurso actualizado exitosamente'); }}
        />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <ResourceDetailModal
          recurso={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}
