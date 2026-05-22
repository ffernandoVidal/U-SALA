import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [errorMsg, setErrorMsg] = useState("");

  const responseMessage = async (response) => {
    setErrorMsg("");
    try {
      const res = await axios.post('http://localhost:3000/api/auth/google', {
        token: response.credential
      });
      
      // Notificamos al App.jsx que el login fue exitoso
      onLoginSuccess(res.data.user); 
    } catch (error) {
      console.error("Error en login:", error);
      if (error.response && error.response.status === 403) {
        setErrorMsg("Acceso fallido. Usa tu correo institucional @miumg.edu.gt");
      } else {
        setErrorMsg("Problema técnico. Verifica tu conexión.");
      }
    }
  };

  const errorMessage = () => {
    setErrorMsg("Falla en la autenticación con Google.");
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 className="text-2xl font-bold text-indigo-900">Sistema de Reservas U-SALA</h1>
      <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
        
        {errorMsg && (
          <div style={{ 
            marginTop: '20px', color: '#721c24', backgroundColor: '#f8d7da', 
            padding: '10px', borderRadius: '5px', border: '1px solid #f5c6cb' 
          }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;