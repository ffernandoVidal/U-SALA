import { X, MapPin, Users, Tag, Calendar, Clock, Info } from 'lucide-react';
import ResourceStatusChip from './ResourceStatusChip';

const TIPO_LABELS = { SALON: 'Salón', LABORATORIO: 'Laboratorio', SALA_REUNIONES: 'Sala de Reuniones' };

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)',
    display: 'grid', placeItems: 'center', zIndex: 999,
  },
  card: {
    width: '560px', maxHeight: '85vh', overflowY: 'auto',
    backgroundColor: '#fff', borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f8fafc',
  },
  detailLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: '14px', color: '#0f172a', fontWeight: '600', textAlign: 'right' },
  badge: (bg, color) => ({
    padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
    backgroundColor: bg, color, display: 'inline-block',
  }),
};

export default function ResourceDetailModal({ recurso, onClose }) {
  if (!recurso) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-GT', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {recurso.nombre}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {recurso.codigo}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResourceStatusChip estado={recurso.estado} size="lg" />
            <span style={styles.badge(
              recurso.esta_activo ? '#dcfce7' : '#f1f5f9',
              recurso.esta_activo ? '#166534' : '#64748b'
            )}>
              {recurso.esta_activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}><Tag size={15} /> Tipo</span>
              <span style={styles.detailValue}>{TIPO_LABELS[recurso.tipo] || recurso.tipo}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}><MapPin size={15} /> Ubicación</span>
              <span style={styles.detailValue}>{recurso.ubicacion || '—'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}><Users size={15} /> Capacidad</span>
              <span style={styles.detailValue}>{recurso.capacidad ? `${recurso.capacidad} personas` : '—'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}><Calendar size={15} /> Creado</span>
              <span style={styles.detailValue}>{formatDate(recurso.created_at)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}><Clock size={15} /> Actualizado</span>
              <span style={styles.detailValue}>{formatDate(recurso.updated_at)}</span>
            </div>
          </div>

          {recurso.descripcion && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={15} /> Descripción
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                {recurso.descripcion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
