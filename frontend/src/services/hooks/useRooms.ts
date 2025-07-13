import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, getRoom, getRoomStats, updateRoom, createRoomAction, updateRoomAction, aiAssignRoom } from '../api/room';
import type { Room, RoomAction, RoomFilter } from '../../types/room';

export const useRooms = (filter?: RoomFilter & { hotelId?: string; date?: string }) => {
  return useQuery({
    queryKey: ['rooms', filter?.hotelId || '', filter?.date || ''],
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
    mutationFn: ({ _id, ...room }: Partial<Room> & { _id: string }) => updateRoom(_id, room),
    onSuccess: (updatedRoom) => {
      queryClient.setQueryData(['rooms', updatedRoom._id], updatedRoom);
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
    mutationFn: ({ _id, ...action }: Partial<RoomAction> & { _id: string }) => updateRoomAction(_id, action),
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