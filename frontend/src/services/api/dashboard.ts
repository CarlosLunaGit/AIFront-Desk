import { api } from '../axios';

export const getDashboardStats = async () => {
  const { data } = await api.get('/api/dashboard/stats');
  return data;
}; 