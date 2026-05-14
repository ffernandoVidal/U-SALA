import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(""); // Estado para el mensaje de error

  const responseMessage = async (response) => {
    setErrorMsg(""); // Limpiamos errores previos al intentar de nuevo
    try {
      const res = await axios.post('http://localhost:3000/api/auth/google', {
        token: response.credential
      });
      
      console.log("Login exitoso:", res.data);
      setUser(res.data.user);
    } catch (error) {
      console.error("Error en login:", error);
      
      // Lógica de mensajes de error personalizados
      if (error.response && error.response.status === 403) {
        setErrorMsg("Acceso fallido. Por favor, vuelve a intentarlo con un correo institucional @miumg.edu.gt");
      } else {
        setErrorMsg("Ocurrió un problema técnico. Intenta más tarde o verifica tu conexión.");
      }
    }
  };

  const errorMessage = () => {
    setErrorMsg("Falla en la autenticación con Google. Intenta más tarde.");
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Sistema de Reservas USALA - UMG</h1>
      
      {!user ? (
        <div style={{ marginTop: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
          </div>

          {/* Renderizado del mensaje de error solicitado */}
          {errorMsg && (
            <div style={{ 
              marginTop: '20px', 
              color: '#721c24', 
              backgroundColor: '#f8d7da', 
              padding: '10px', 
              borderRadius: '5px',
              display: 'inline-block',
              border: '1px solid #f5c6cb'
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Bienvenido, {user.nombre_completo}</h2>
          <img src={user.picture || 'https://via.placeholder.com/100'} alt="perfil" style={{ borderRadius: '50%' }} />
          <p>Correo: {user.email}</p>
          <button onClick={() => { setUser(null); setErrorMsg(""); }}>Cerrar Sesión</button>
        </div>
      )}
    </div>
  )
}

export default App