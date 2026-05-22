import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layers, Plus, Trash2 } from 'lucide-react';

const ListaRecursos = ({ fechaFiltro, usuarioActual, alCambiarReserva }) => {
  const [recursos, setRecursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerRecursosInstalados = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/recursos');
        setRecursos(response.data);
      } catch (error) {
        console.error("Error en la capa de transporte al traer recursos:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerRecursosInstalados();
  }, []);

  const handleCrearReservaRapida = async (recursoId) => {
    // Generación de payload por bloque por defecto (Ej: 08:00 a 10:00 del día seleccionado)
    const inicio = `${fechaFiltro}T08:00:00`;
    const fin = `${fechaFiltro}T10:00:00`;

    try {
      await axios.post('http://localhost:3000/api/reservas', {
        usuario_id: usuarioActual.id,
        recurso_id: recursoId,
        inicio,
        fin,
        notas: "Reserva automatizada desde Panel Central U-SALA"
      });
      alert("Reserva registrada exitosamente en la base de datos.");
      alCambiarReserva(); // Forzar re-render del calendario maestro
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Conflicto de Coerción Temporal: El recurso ya está ocupado en esta franja horaria.");
      } else {
        alert("Error del servidor al procesar la reserva.");
      }
    }
  };

  if (cargando) return <p style={{ fontSize: '14px', color: 'var(--text)' }}>Sincronizando con base de datos UMG...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {recursos.map(recurso => (
        <div key={recurso.id} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: '700' }}>
                {recurso.tipo}
              </span>
              <h4 style={{ margin: '8px 0 4px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-h)' }}>{recurso.nombre}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>Capacidad Máxima: {recurso.capacidad} personas</p>
            </div>
          </div>
          
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleCrearReservaRapida(recurso.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              <Plus size={14} /> Reservar 08:00 - 10:00
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaRecursos;