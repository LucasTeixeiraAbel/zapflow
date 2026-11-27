import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Interceptor para injetar o tenantId (para o MVP usaremos um fixo ou do localStorage)
api.interceptors.request.use((config) => {
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'test-tenant-id' : 'test-tenant-id';
  config.headers['x-tenant-id'] = tenantId;
  return config;
});
