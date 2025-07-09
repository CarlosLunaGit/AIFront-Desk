import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios';
import { RoomType } from '../../types/room';

interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  baseRate: number;
  capacity: {
    adults: number;
    children?: number;
    total: number;
  };
  features: string[];
  amenities: string[];
}

interface UpdateRoomTypeRequest extends Partial<CreateRoomTypeRequest> {}

// API functions
const roomTypeApi = {
  getHotelRoomTypes: async (hotelId: string): Promise<RoomType[]> => {
    const response = await api.get(`/api/hotel/${hotelId}/room-types`);
    return response.data;
  },

  createRoomType: async (hotelId: string, data: CreateRoomTypeRequest): Promise<RoomType> => {
    const response = await api.post(`/api/hotel/${hotelId}/room-types`, data);
    return response.data;
  },

  updateRoomType: async (hotelId: string, roomTypeId: string, data: UpdateRoomTypeRequest): Promise<RoomType> => {
    const response = await api.patch(`/api/hotel/${hotelId}/room-types/${roomTypeId}`, data);
    return response.data;
  },

  deleteRoomType: async (hotelId: string, roomTypeId: string): Promise<void> => {
    await api.delete(`/api/hotel/${hotelId}/room-types/${roomTypeId}`);
  },
};

// Hooks
export const useHotelRoomTypes = (hotelId: string | undefined) => {
  return useQuery({
    queryKey: ['roomTypes', hotelId],
    queryFn: () => roomTypeApi.getHotelRoomTypes(hotelId!),
    enabled: !!hotelId,
  });
};

export const useCreateRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, data }: { hotelId: string; data: CreateRoomTypeRequest }) =>
      roomTypeApi.createRoomType(hotelId, data),
    onSuccess: (_, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
};

export const useUpdateRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, roomTypeId, data }: { hotelId: string; roomTypeId: string; data: UpdateRoomTypeRequest }) =>
      roomTypeApi.updateRoomType(hotelId, roomTypeId, data),
    onSuccess: (_, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
};

export const useDeleteRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, roomTypeId }: { hotelId: string; roomTypeId: string }) =>
      roomTypeApi.deleteRoomType(hotelId, roomTypeId),
    onSuccess: (_, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
};

export type { RoomType, CreateRoomTypeRequest, UpdateRoomTypeRequest }; 