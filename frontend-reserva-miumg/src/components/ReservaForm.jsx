import { X, AlertCircle } from 'lucide-react';

const styles = {
  panel: {
    width: '400px',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    padding: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
};

export default function ReservaForm({
  visible,
  onClose,
  formData,
  onChange,
  recursos,
  errorValidacion,
  onSubmit,
}) {
  if (!visible) return null;

  const handleChange = (field) => (e) => {
    onChange({ ...formData, [field]: e.target.value });
  };

  return (
    <aside style={styles.panel}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
          Nueva Reserva
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {errorValidacion && (
        <div style={{
          display: 'flex', gap: '8px', backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px',
          marginBottom: '16px', color: '#991b1b', fontSize: '13px', textAlign: 'left',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorValidacion}</span>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Recurso Universitario</label>
          <select
            required
            value={formData.recurso_id}
            onChange={handleChange('recurso_id')}
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
            onChange={handleChange('fecha')}
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
              onChange={handleChange('hora_inicio')}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Hora Fin</label>
            <input
              type="time"
              required
              value={formData.hora_fin}
              onChange={handleChange('hora_fin')}
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
            onChange={handleChange('motivo')}
            style={{ ...styles.input, resize: 'none', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              padding: '10px', borderRadius: '8px', border: 'none',
              backgroundColor: '#6366f1', color: '#ffffff', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
            }}
          >
            Crear Reserva
          </button>
        </div>
      </form>
    </aside>
  );
}
