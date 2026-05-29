import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { checkAvailability } from '../services/reservaService';

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

const HORARIO_INICIO = 7;
const HORARIO_FIN = 22;

const generarHoras = () => {
  const horas = [];
  for (let h = HORARIO_INICIO; h <= HORARIO_FIN; h++) {
    const str = `${String(h).padStart(2, '0')}:00`;
    horas.push(str);
    if (h < HORARIO_FIN) {
      const str30 = `${String(h).padStart(2, '0')}:30`;
      horas.push(str30);
    }
  }
  return horas;
};

export default function ReservaForm({
  visible,
  onClose,
  formData,
  onChange,
  recursos,
  errorValidacion,
  onSubmit,
  user,
}) {
  const [enviando, setEnviando] = useState(false);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const submitRef = useRef(false);

  const horasDisponibles = generarHoras();

  useEffect(() => {
    if (!visible) {
      setHorasOcupadas([]);
      setEnviando(false);
      submitRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (!formData.recurso_id || !formData.fecha) {
      setHorasOcupadas([]);
      return;
    }
    let activo = true;
    setVerificandoDisponibilidad(true);
    checkAvailability(formData.recurso_id, formData.fecha)
      .then((data) => {
        if (activo) {
          const ocupados = data.ocupados || [];
          setHorasOcupadas(ocupados);
        }
      })
      .catch(() => {
        if (activo) setHorasOcupadas([]);
      })
      .finally(() => {
        if (activo) setVerificandoDisponibilidad(false);
      });
    return () => { activo = false; };
  }, [formData.recurso_id, formData.fecha]);

  const horaEstaOcupada = (hora) => {
    if (!formData.fecha) return false;
    return horasOcupadas.some((oc) => {
      const ocInicio = new Date(oc.inicio).toTimeString().slice(0, 5);
      const ocFin = new Date(oc.fin).toTimeString().slice(0, 5);
      const hInicio = hora;
      const hFin = formData.hora_fin || hora;
      return hInicio < ocFin && hFin > ocInicio;
    });
  };

  const handleChange = (field) => (e) => {
    onChange({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current || enviando) return;
    submitRef.current = true;
    setEnviando(true);
    try {
      await onSubmit(e);
    } finally {
      setEnviando(false);
      submitRef.current = false;
    }
  };

  if (!visible) return null;

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

      <form onSubmit={handleSubmit}>
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
            <label style={styles.label}>
              Hora Inicio
              {verificandoDisponibilidad && <Loader2 size={12} style={{ marginLeft: '6px', animation: 'spin 1s linear infinite' }} />}
            </label>
            <select
              required
              value={formData.hora_inicio}
              onChange={handleChange('hora_inicio')}
              style={{
                ...styles.input,
                borderColor: formData.hora_inicio && horaEstaOcupada(formData.hora_inicio) ? '#ef4444' : '#cbd5e1',
              }}
            >
              <option value="">Seleccionar</option>
              {horasDisponibles.map(h => (
                <option
                  key={h}
                  value={h}
                  disabled={horaEstaOcupada(h) && h !== formData.hora_inicio}
                  style={horaEstaOcupada(h) ? { color: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                >
                  {h} {horaEstaOcupada(h) ? '(ocupado)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Hora Fin</label>
            <select
              required
              value={formData.hora_fin}
              onChange={handleChange('hora_fin')}
              style={{
                ...styles.input,
                borderColor: formData.hora_fin && horaEstaOcupada(formData.hora_fin) ? '#ef4444' : '#cbd5e1',
              }}
            >
              <option value="">Seleccionar</option>
              {horasDisponibles.map(h => (
                <option
                  key={h}
                  value={h}
                  disabled={horaEstaOcupada(h) && h !== formData.hora_fin}
                  style={horaEstaOcupada(h) ? { color: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                >
                  {h} {horaEstaOcupada(h) ? '(ocupado)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {horasOcupadas.length > 0 && (
          <div style={{
            backgroundColor: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#92400e', textAlign: 'left',
          }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Horarios ocupados en esta fecha:</strong>
            {horasOcupadas.map((oc, i) => (
              <div key={i}>
                {new Date(oc.inicio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })} - {new Date(oc.fin).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
          </div>
        )}

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
            disabled={enviando}
            style={{
              padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff', cursor: enviando ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '14px', opacity: enviando ? 0.6 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            style={{
              padding: '10px', borderRadius: '8px', border: 'none',
              backgroundColor: enviando ? '#a5b4fc' : '#6366f1',
              color: '#ffffff', cursor: enviando ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {enviando ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</> : 'Crear Reserva'}
          </button>
        </div>
      </form>
    </aside>
  );
}
