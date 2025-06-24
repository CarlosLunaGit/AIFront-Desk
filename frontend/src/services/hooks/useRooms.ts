import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, getRoom, getRoomStats, updateRoom, createRoomAction, updateRoomAction, aiAssignRoom } from '../api/room';
import type { Room, RoomAction, RoomFilter, RoomStats } from '../../types/room';

export const useRooms = (filter?: RoomFilter & { hotelConfigId?: string }) => {
  return useQuery({
    queryKey: ['rooms', filter?.hotelConfigId || ''],
    queryFn: () => getRooms(filter),
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => getRoom(id),
  });
};

export const useRoomStats = () => {
  return useQuery({
    queryKey: ['rooms', 'stats'],
    queryFn: getRoomStats,
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...room }: Partial<Room> & { id: string }) => updateRoom(id, room),
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
    mutationFn: (action: Omit<RoomAction, 'id' | 'requestedAt' | 'status'>) => createRoomAction(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'actions'] });
    },
  });
};

export const useUpdateRoomAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...action }: Partial<RoomAction> & { id: string }) => updateRoomAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'actions'] });
    },
  });
};

export const useAIAssignRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiAssignRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'stats'] });
    },
  });
};

export const useAIRequestCleaning = () => useCreateRoomAction();
export const useAIRequestMaintenance = () => useCreateRoomAction(); 