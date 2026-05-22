import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  // Cambiamos el ID alfanumérico por un ID numérico entero (INT)
  const [usuario, setUsuario] = useState({
    id: 1, // <-- ID de tipo entero para cumplir con la FK de la base de datos
    nombre_completo: "Dianne Russell",
    email: "drussell@miumg.edu.gt",
    rol: "admin",
    picture: null
  });

  const handleLogout = () => {
    setUsuario(null);
  };

  return (
    <div className="app-viewport" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {usuario ? (
        <Dashboard user={usuario} onLogout={handleLogout} />
      ) : (
        <div style={{ display: 'grid', placeItems: 'center', height: '100vh', backgroundColor: '#f4f5f6' }}>
          <button 
            onClick={() => setUsuario({ id: 1, nombre_completo: "Dianne Russell", email: "drussell@miumg.edu.gt", rol: "admin" })}
            style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Volver a Ingresar (Mock)
          </button>
        </div>
      )}
    </div>
  );
}

export default App;