import { api } from '../axios';

export const login = async (email: string, password: string) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
}; 