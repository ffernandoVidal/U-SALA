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

export const getReservas = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.recurso_id) params.append('recurso_id', filters.recurso_id);
  if (filters.usuario_id) params.append('usuario_id', filters.usuario_id);
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
  if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
  const qs = params.toString();
  const res = await api.get(qs ? `/?${qs}` : '/');
  return res.data;
};

export const getAllReservas = async () => {
  const res = await api.get('/all');
  return res.data;
};

export const getReserva = async (id) => {
  const res = await api.get(`/${id}`);
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

export const updateReserva = async (id, data) => {
  const res = await api.put(`/${id}`, data);
  return res.data;
};

export const aprobarReserva = async (id) => {
  const res = await api.patch(`/${id}/approve`);
  return res.data;
};

export const rechazarReserva = async (id, motivo) => {
  const res = await api.patch(`/${id}/reject`, { motivo });
  return res.data;
};

export const cancelarReserva = async (id, motivo) => {
  const res = await api.patch(`/${id}/cancel`, { motivo });
  return res.data;
};

export const eliminarReserva = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};

export const checkAvailability = async (recursoId, fecha) => {
  const res = await api.get(`/availability?recurso_id=${recursoId}&fecha=${fecha}`);
  return res.data;
};
