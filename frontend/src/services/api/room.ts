import { api } from '../axios';
import type { Room, RoomAction, RoomFilter, RoomStats } from '../../types/room';

const ROOMS_ENDPOINT = '/api/rooms';
const ROOM_ACTIONS_ENDPOINT = '/api/rooms/actions';
const ROOM_STATS_ENDPOINT = '/api/rooms/stats';

export const getRooms = async (filter?: RoomFilter & { hotelId?: string }) => {
  const { data } = await api.get<Room[]>(ROOMS_ENDPOINT, { params: filter });
  return data;
};

export const getRoom = async (id: string) => {
  const { data } = await api.get<Room>(`${ROOMS_ENDPOINT}/${id}`);
  return data;
};

export const getRoomStats = async () => {
  const { data } = await api.get<RoomStats>(ROOM_STATS_ENDPOINT);
  return data;
};

export const updateRoom = async (id: string, room: Partial<Room>) => {
  const { data } = await api.patch<Room>(`${ROOMS_ENDPOINT}/${id}`, room);
  return data;
};

export const createRoomAction = async (action: Omit<RoomAction, 'id' | 'requestedAt' | 'status'>) => {
  const { data } = await api.post<RoomAction>(ROOM_ACTIONS_ENDPOINT, action);
  return data;
};

export const updateRoomAction = async (id: string, action: Partial<RoomAction>) => {
  const { data } = await api.patch<RoomAction>(`${ROOM_ACTIONS_ENDPOINT}/${id}`, action);
  return data;
};

export const aiAssignRoom = async ({ roomId, guestId, checkIn, checkOut }: {
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
}) => {
  const { data } = await api.post<Room>(`${ROOMS_ENDPOINT}/${roomId}/assign`, {
    guestId,
    checkIn,
    checkOut,
    assignedBy: 'ai',
  });
  return data;
};

export const bulkCreateRooms = async (rooms: any[]) => {
  const { data } = await api.post('/api/rooms/bulk', { rooms });
  return data;
};

export const updateRoomStatus = async (id: string, status: string) => {
  const { data } = await api.patch(`/api/rooms/${id}/status`, { status });
  return data;
};

export const requestMaintenance = async (id: string) => {
  const { data } = await api.patch(`/api/rooms/${id}/maintenance`);
  return data;
};

export const requestCleaning = async (id: string) => {
  const { data } = await api.patch(`/api/rooms/${id}/cleaning`);
  return data;
};

export const terminateRoom = async (id: string) => {
  const { data } = await api.post(`/api/rooms/${id}/terminate`);
  return data;
}; 