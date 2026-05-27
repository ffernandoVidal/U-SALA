import { X, Clock, User, FileText } from 'lucide-react';

const styles = {
  overlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)',
    display: 'grid', placeItems: 'center', zIndex: 999,
  },
  card: {
    width: '520px', backgroundColor: '#ffffff', borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0', overflow: 'hidden',
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  body: {
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left',
  },
  infoRow: {
    display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#334155',
  },
  notesBox: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '16px', marginTop: '4px',
  },
};

const badge = (estado) => ({
  padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600',
  textTransform: 'capitalize',
  backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
  color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : '#a16207',
});

const formatearHoraRange = (inicio, fin) => {
  const format = (str) => new Date(str).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${format(inicio)} - ${format(fin)}`;
};

const formatearFechaLarga = (str) => {
  return new Date(str).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ReservaModal({ reserva, onClose }) {
  if (!reserva) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Reservas del {formatearFechaLarga(reserva.inicioStr)}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {reserva.recurso_nombre}
              </h4>
              <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                {reserva.ubicacion}
              </span>
            </div>
            <span style={badge(reserva.estado)}>
              {reserva.estado}
            </span>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

          <div style={styles.infoRow}>
            <Clock size={16} style={{ color: '#64748b', marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px' }}>Horario</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {formatearHoraRange(reserva.inicioStr, reserva.finStr)}
              </span>
            </div>
          </div>

          <div style={styles.infoRow}>
            <User size={16} style={{ color: '#64748b', marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px' }}>Usuario Responsable</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{reserva.usuario_nombre}</span>
            </div>
          </div>

          <div style={styles.infoRow}>
            <FileText size={16} style={{ color: '#64748b', marginTop: '2px' }} />
            <div style={{ width: '100%' }}>
              <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px', marginBottom: '4px' }}>Motivo Académico</span>
              <div style={styles.notesBox}>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                  "{reserva.notes || reserva.notas || 'Sin especificaciones añadidas por el solicitante.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
