import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/reservas`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getReservas = async () => {
  const res = await api.get('/');
  return res.data;
};

export const getMisReservas = async (usuarioId) => {
  const res = await api.get(`/usuario/${usuarioId}`);
  return res.data;
};

export const crearReserva = async (data) => {
  const res = await api.post('/', data);
  return res.data;
};

export const eliminarReserva = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};
