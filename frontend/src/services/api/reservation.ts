import { api } from '../axios';

export const getReservations = async () => {
  const { data } = await api.get('/api/reservations');
  return data;
};

export const createReservation = async (reservation: any) => {
  const { data } = await api.post('/api/reservations', reservation);
  return data;
};

export const updateReservation = async (id: string, reservation: any) => {
  const { data } = await api.patch(`/api/reservations/${id}`, reservation);
  return data;
};

export const deleteReservation = async (params: string | { id: string; reason?: string }) => {
  // Handle both old string format and new object format for backward compatibility
  if (typeof params === 'string') {
    await api.delete(`/api/reservations/${params}`);
  } else {
    // For DELETE requests, we can pass the reason as a query parameter
    const queryParams = params.reason ? `?reason=${encodeURIComponent(params.reason)}` : '';
    await api.delete(`/api/reservations/${params.id}${queryParams}`);
  }
}; 