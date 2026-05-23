import axios from 'axios';

const API_URL = 'http://localhost:3000/api/usuarios';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsuarios = async () => {
  const res = await api.get('/');
  return res.data;
};

export const updateUsuario = async (id, data) => {
  const res = await api.put(`/${id}`, data);
  return res.data;
};
