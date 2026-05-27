import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const googleLogin = async (token) => {
  const res = await api.post('/google', { token });
  return res.data;
};

export const register = async ({ email, nombre_completo, password }) => {
  const res = await api.post('/register', { email, nombre_completo, password });
  return res.data;
};

export const login = async ({ email, password }) => {
  const res = await api.post('/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/me');
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post('/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await api.post(`/reset-password/${token}`, { password });
  return res.data;
};
