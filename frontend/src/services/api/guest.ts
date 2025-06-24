import { api } from '../axios';

export const getGuests = async () => {
  const { data } = await api.get('/api/guests');
  return data;
};

export const createGuest = async (guest: any) => {
  const { data } = await api.post('/api/guests', guest);
  return data;
};

export const updateGuest = async (id: string, guest: any) => {
  const { data } = await api.patch(`/api/guests/${id}`, guest);
  return data;
};

export const deleteGuest = async (id: string) => {
  await api.delete(`/api/guests/${id}`);
};

export const checkInGuest = async (id: string) => {
  const { data } = await api.patch(`/api/guests/${id}`, { status: 'checked-in', checkIn: new Date().toISOString() });
  return data;
};

export const checkOutGuest = async (id: string) => {
  const { data } = await api.patch(`/api/guests/${id}`, { status: 'checked-out', checkOut: new Date().toISOString() });
  return data;
};

export const toggleKeepOpen = async (id: string, keepOpen: boolean) => {
  const { data } = await api.patch(`/api/guests/${id}`, { keepOpen });
  return data;
}; 