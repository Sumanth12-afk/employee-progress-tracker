import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (token) => api.post('/auth/login', { token })
};

export const logsAPI = {
  createLog: (payload, attachment) => {
    if (!attachment) {
      return Promise.reject(new Error('Attachment file is required.'));
    }
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    formData.append('attachment', attachment);
    return api.post('/logs', formData);
  },
  getMyLogs: () => api.get('/logs/me'),
  getAnalytics: () => api.get('/logs/analytics')
};

export default api;

