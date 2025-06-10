import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Room, RoomAction, RoomFilter, RoomStats } from '../types/room';
import { api } from './api';

// API endpoints
const ROOMS_ENDPOINT = '/api/rooms';
const ROOM_ACTIONS_ENDPOINT = '/api/rooms/actions';
const ROOM_STATS_ENDPOINT = '/api/rooms/stats';

// Room queries
export const useRooms = (filter?: RoomFilter) => {
  return useQuery({
    queryKey: ['rooms', filter],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(ROOMS_ENDPOINT, { params: filter });
      return data;
    },
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const { data } = await api.get<Room>(`${ROOMS_ENDPOINT}/${id}`);
      return data;
    },
  });
};

export const useRoomStats = () => {
  return useQuery({
    queryKey: ['rooms', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<RoomStats>(ROOM_STATS_ENDPOINT);
      return data;
    },
  });
};

// Room mutations
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...room }: Partial<Room> & { id: string }) => {
      const { data } = await api.patch<Room>(`${ROOMS_ENDPOINT}/${id}`, room);
      return data;
    },
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['rooms', updatedRoom.id], updatedRoom);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'stats'] });
    },
  });
};

export const useCreateRoomAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: Omit<RoomAction, 'id' | 'requestedAt' | 'status'>) => {
      const { data } = await api.post<RoomAction>(ROOM_ACTIONS_ENDPOINT, action);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'actions'] });
    },
  });
};

export const useUpdateRoomAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...action }: Partial<RoomAction> & { id: string }) => {
      const { data } = await api.patch<RoomAction>(`${ROOM_ACTIONS_ENDPOINT}/${id}`, action);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'actions'] });
    },
  });
};

// AI-specific mutations
export const useAIAssignRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, guestId, checkIn, checkOut }: {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'stats'] });
    },
  });
};

export const useAIRequestCleaning = () => {
  return useCreateRoomAction();
};

export const useAIRequestMaintenance = () => {
  return useCreateRoomAction();
}; 