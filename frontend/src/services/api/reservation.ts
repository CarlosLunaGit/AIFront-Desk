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

export const deleteReservation = async (id: string) => {
  await api.delete(`/api/reservations/${id}`);
}; 