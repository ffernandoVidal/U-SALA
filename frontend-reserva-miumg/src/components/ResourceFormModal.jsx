import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createRecurso, updateRecurso } from '../services/recursoService';

const TIPOS = ['SALON', 'LABORATORIO', 'SALA_REUNIONES'];
const ESTADOS = ['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
const TIPO_LABELS = { SALON: 'Salón', LABORATORIO: 'Laboratorio', SALA_REUNIONES: 'Sala de Reuniones' };
const ESTADO_LABELS = { AVAILABLE: 'Disponible', RESERVED: 'Reservado', MAINTENANCE: 'Mantenimiento', OUT_OF_SERVICE: 'Fuera de Servicio' };

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)',
    display: 'grid', placeItems: 'center', zIndex: 999,
  },
  card: {
    width: '520px', maxHeight: '90vh', overflowY: 'auto',
    backgroundColor: '#fff', borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1,
  },
  body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  footer: {
    padding: '16px 24px', borderTop: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    position: 'sticky', bottom: 0, backgroundColor: '#fff',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: {
    padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  select: {
    padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
    cursor: 'pointer', backgroundColor: '#fff',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  errorBox: {
    display: 'flex', gap: '8px', backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px',
    color: '#991b1b', fontSize: '13px',
  },
};

export default function ResourceFormModal({ recurso, onClose, onSuccess }) {
  const isEditing = !!recurso;
  const [form, setForm] = useState({
    nombre: '', codigo: '', tipo: 'SALON', ubicacion: '',
    capacidad: '', descripcion: '', estado: 'AVAILABLE',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recurso) {
      setForm({
        nombre: recurso.nombre || '',
        codigo: recurso.codigo || '',
        tipo: recurso.tipo || 'SALON',
        ubicacion: recurso.ubicacion || '',
        capacidad: recurso.capacidad ? String(recurso.capacidad) : '',
        descripcion: recurso.descripcion || '',
        estado: recurso.estado || 'AVAILABLE',
      });
    }
  }, [recurso]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es requerido';
    if (!form.codigo.trim()) return 'El código es requerido';
    if (form.capacidad && (isNaN(form.capacidad) || Number(form.capacidad) <= 0)) {
      return 'La capacidad debe ser un número mayor a 0';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        capacidad: form.capacidad ? Number(form.capacidad) : null,
      };

      if (isEditing) {
        await updateRecurso(recurso.id, payload);
      } else {
        await createRecurso(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el recurso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            {isEditing ? 'Editar Recurso' : 'Nuevo Recurso'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} placeholder="Ej: Laboratorio de Computación 1" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Código *</label>
                <input name="codigo" value={form.codigo} onChange={handleChange} style={styles.input} placeholder="Ej: LAB-C01" />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Tipo *</label>
                <select name="tipo" value={form.tipo} onChange={handleChange} style={styles.select}>
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} style={styles.select}>
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Ubicación</label>
                <input name="ubicacion" value={form.ubicacion} onChange={handleChange} style={styles.input} placeholder="Ej: Edificio B - Segundo Piso" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Capacidad</label>
                <input name="capacidad" type="number" min="1" value={form.capacidad} onChange={handleChange} style={styles.input} placeholder="Ej: 30" />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} style={{ ...styles.input, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Descripción opcional del recurso" />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#475569',
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: saving ? '#a5b4fc' : '#6366f1', color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px',
            }}>
              <Save size={16} /> {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Recurso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
