import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
const baseURL = envUrl
  ? envUrl.replace(/\/+$/, '') + (envUrl.endsWith('/api') ? '' : '/api')
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ttm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('ttm_token');
      localStorage.removeItem('ttm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
