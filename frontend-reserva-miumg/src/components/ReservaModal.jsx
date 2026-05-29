import { useState } from 'react';
import { X, Clock, User, FileText, CheckCircle, XCircle, Ban } from 'lucide-react';

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
  footer: {
    padding: '16px 24px', borderTop: '1px solid #f1f5f9',
    display: 'flex', gap: '8px', justifyContent: 'flex-end',
  },
};

const badge = (estado) => ({
  padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '600',
  textTransform: 'capitalize',
  backgroundColor: estado === 'aprobada' ? '#dcfce7' : estado === 'rechazada' ? '#fee2e2' : estado === 'cancelada' ? '#f1f5f9' : '#fef9c3',
  color: estado === 'aprobada' ? '#15803d' : estado === 'rechazada' ? '#b91c1c' : estado === 'cancelada' ? '#475569' : '#a16207',
});

const formatearHoraRange = (inicio, fin) => {
  const format = (str) => new Date(str).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${format(inicio)} - ${format(fin)}`;
};

const formatearFechaLarga = (str) => {
  return new Date(str).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatearFechaHora = (str) => {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ReservaModal({ reserva, onClose, user, onApprove, onReject, onCancel }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [accionando, setAccionando] = useState(false);

  if (!reserva) return null;

  const esAdmin = user?.role_id === 1;
  const esPropietario = user?.id === reserva.usuario_id;
  const puedeAprobar = esAdmin && reserva.estado === 'pendiente';
  const puedeRechazar = esAdmin && reserva.estado === 'pendiente';
  const puedeCancelar = (esAdmin || esPropietario) && (reserva.estado === 'pendiente' || reserva.estado === 'aprobada');

  const handleApprove = async () => {
    if (!onApprove || accionando) return;
    setAccionando(true);
    try {
      await onApprove(reserva.id);
    } finally {
      setAccionando(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || accionando || !rejectMotivo.trim()) return;
    setAccionando(true);
    try {
      await onReject(reserva.id, rejectMotivo.trim());
      setRejectMode(false);
      setRejectMotivo('');
    } finally {
      setAccionando(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel || accionando) return;
    setAccionando(true);
    try {
      await onCancel(reserva.id);
    } finally {
      setAccionando(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Reserva del {formatearFechaLarga(reserva.inicioStr)}
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
                {reserva.ubicacion || reserva.recurso_ubicacion}
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
                  "{reserva.notes || reserva.notas || reserva.motivo || 'Sin especificaciones'}"
                </p>
              </div>
            </div>
          </div>

          {reserva.rechazo_motivo && (
            <div style={styles.infoRow}>
              <XCircle size={16} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: '600', display: 'block', color: '#dc2626', fontSize: '13px' }}>Motivo de Rechazo</span>
                <span style={{ fontSize: '13px', color: '#991b1b' }}>"{reserva.rechazo_motivo}"</span>
              </div>
            </div>
          )}

          {reserva.cancelacion_motivo && (
            <div style={styles.infoRow}>
              <Ban size={16} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: '600', display: 'block', color: '#475569', fontSize: '13px' }}>Motivo de Cancelación</span>
                <span style={{ fontSize: '13px', color: '#475569' }}>"{reserva.cancelacion_motivo}"</span>
              </div>
            </div>
          )}

          {reserva.aprobado_por_nombre && (
            <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              Aprobado por {reserva.aprobado_por_nombre}
            </div>
          )}

          {reserva.rechazado_por_nombre && (
            <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              Rechazado por {reserva.rechazado_por_nombre}
            </div>
          )}

          {reserva.cancelado_por_nombre && (
            <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              Cancelado por {reserva.cancelado_por_nombre}
            </div>
          )}
        </div>

        {rejectMode ? (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                rows={3}
                placeholder="Indica el motivo de rechazo..."
                value={rejectMotivo}
                onChange={(e) => setRejectMotivo(e.target.value)}
                style={{
                  padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '13px', resize: 'none', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setRejectMode(false); setRejectMotivo(''); }}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectMotivo.trim() || accionando}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer',
                    fontWeight: '600', fontSize: '12px', opacity: !rejectMotivo.trim() || accionando ? 0.6 : 1,
                  }}
                >
                  {accionando ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.footer}>
            {puedeAprobar && (
              <button
                onClick={handleApprove}
                disabled={accionando}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#22c55e', color: '#ffffff', cursor: 'pointer',
                  fontWeight: '600', fontSize: '12px', opacity: accionando ? 0.6 : 1,
                }}
              >
                <CheckCircle size={14} /> {accionando ? 'Procesando...' : 'Aprobar'}
              </button>
            )}
            {puedeRechazar && (
              <button
                onClick={() => setRejectMode(true)}
                disabled={accionando}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#ef4444', color: '#ffffff', cursor: 'pointer',
                  fontWeight: '600', fontSize: '12px', opacity: accionando ? 0.6 : 1,
                }}
              >
                <XCircle size={14} /> Rechazar
              </button>
            )}
            {puedeCancelar && (
              <button
                onClick={handleCancel}
                disabled={accionando}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer',
                  fontWeight: '600', fontSize: '12px', opacity: accionando ? 0.6 : 1,
                }}
              >
                <Ban size={14} /> {accionando ? 'Cancelando...' : 'Cancelar Reserva'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
