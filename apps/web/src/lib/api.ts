import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Interceptor para injetar o JWT Token nas requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zapflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para redirecionar em caso de 401 não autenticado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Se não estiver na página de login, redireciona
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('zapflow_token');
        localStorage.removeItem('zapflow_user');
        localStorage.removeItem('zapflow_tenant');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
