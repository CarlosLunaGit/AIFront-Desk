import axios from 'axios';

const ENABLE_MOCK_API = process.env.REACT_APP_ENABLE_MOCK_API === 'true';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: ENABLE_MOCK_API ? '' : API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      mockMode: ENABLE_MOCK_API,
    });
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [${response.status}] ${response.config.url}`, {
        data: response.data,
        mockMode: ENABLE_MOCK_API,
      });
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [${error.response?.status || 'NO RESPONSE'}] ${error.config?.url}`, {
        error: error.message,
        response: error.response?.data,
        mockMode: ENABLE_MOCK_API,
      });
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (process.env.NODE_ENV === 'development' && !error.response) {
      if (ENABLE_MOCK_API) {
        console.warn('⚠️ No response received. Make sure the mock service worker is running.');
      } else {
        console.warn('⚠️ No response received. Make sure the backend server is running at:', API_URL);
      }
    }
    return Promise.reject(error);
  }
); 