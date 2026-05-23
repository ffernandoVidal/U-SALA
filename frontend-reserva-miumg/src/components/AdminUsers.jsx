import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, AlertCircle } from 'lucide-react';
import { getUsuarios, updateUsuario } from '../services/userService';

const ROLE_NAMES = {
  1: 'Administrador',
  2: 'Docente',
  3: 'Usuario',
};

const ROLE_COLORS = {
  1: { bg: '#e0e7ff', color: '#4338ca' },
  2: { bg: '#dbeafe', color: '#2563eb' },
  3: { bg: '#f3e8ff', color: '#7c3aed' },
};

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre_completo: '', email: '', role_id: 3 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const abrirEdicion = (usuario) => {
    setEditando(usuario.id);
    setFormData({
      nombre_completo: usuario.nombre_completo || '',
      email: usuario.email || '',
      role_id: usuario.role_id,
    });
    setError('');
    setSuccess('');
  };

  const cerrarEdicion = () => {
    setEditando(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre_completo.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return;
    }

    try {
      const updated = await updateUsuario(editando, {
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim(),
        role_id: Number(formData.role_id),
      });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === editando ? { ...u, ...updated } : u))
      );
      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => cerrarEdicion(), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const modalOverlay = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)',
    display: 'grid', placeItems: 'center', zIndex: 999,
  };
  const modalCard = {
    width: '480px', backgroundColor: '#fff', borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0', overflow: 'hidden',
  };
  const modalHeader = {
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const modalBody = { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' };
  const formGroup = { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' };
  const label = { fontSize: '13px', fontWeight: '600', color: '#475569' };
  const input = {
    padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const select = { ...input, cursor: 'pointer' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Gestión de Usuarios</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Administra los usuarios registrados en el sistema</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '14px' }}>Cargando usuarios...</p>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Rol</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < usuarios.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                >
                  <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500' }}>{u.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#0f172a' }}>{u.nombre_completo}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: ROLE_COLORS[u.role_id]?.bg || '#f1f5f9',
                      color: ROLE_COLORS[u.role_id]?.color || '#475569',
                    }}>
                      {ROLE_NAMES[u.role_id] || 'Desconocido'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => abrirEdicion(u)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                        backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500',
                        fontSize: '12px', color: '#475569',
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editando !== null && (
        <div style={modalOverlay} onClick={cerrarEdicion}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Editar Usuario
              </h3>
              <button onClick={cerrarEdicion} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={guardarCambios}>
              <div style={modalBody}>
                {error && (
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '13px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', color: '#166534', fontSize: '13px' }}>
                    <Save size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{success}</span>
                  </div>
                )}

                <div style={formGroup}>
                  <label style={label}><User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Nombre Completo</label>
                  <input
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    style={input}
                    placeholder="Nombre completo"
                  />
                </div>

                <div style={formGroup}>
                  <label style={label}><Mail size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Correo Electrónico</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={input}
                    placeholder="correo@miumg.edu.gt"
                  />
                </div>

                <div style={formGroup}>
                  <label style={label}><Shield size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Rol</label>
                  <select name="role_id" value={formData.role_id} onChange={handleChange} style={select}>
                    <option value={1}>Administrador</option>
                    <option value={2}>Docente</option>
                    <option value={3}>Usuario</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={cerrarEdicion} style={{
                    padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px',
                  }}>
                    <Save size={16} /> Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
