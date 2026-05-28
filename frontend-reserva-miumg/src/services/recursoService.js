import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/recursos`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getRecursos = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.activo !== undefined && filters.activo !== '') params.append('activo', filters.activo);
  if (filters.search) params.append('search', filters.search);
  const qs = params.toString();
  const res = await api.get(qs ? `/?${qs}` : '/');
  return res.data;
};

export const getRecursosActivos = async () => {
  const res = await api.get('/activos');
  return res.data;
};

export const getRecurso = async (id) => {
  const res = await api.get(`/${id}`);
  return res.data;
};

export const createRecurso = async (data) => {
  const res = await api.post('/', data);
  return res.data;
};

export const updateRecurso = async (id, data) => {
  const res = await api.put(`/${id}`, data);
  return res.data;
};

export const cambiarEstado = async (id, estado) => {
  const res = await api.patch(`/${id}/status`, { estado });
  return res.data;
};

export const toggleActivo = async (id) => {
  const res = await api.patch(`/${id}/active`);
  return res.data;
};
