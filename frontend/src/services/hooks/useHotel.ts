import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as hotelApi from '../api/hotel';
import type { HotelConfigFormData } from '../../types/hotel';

// NEW: Proper hotel business hooks (use these instead of config hooks)
export const useCurrentHotel = () => {
  return useQuery({
    queryKey: ['hotel', 'current'],
    queryFn: hotelApi.getCurrentHotel,
  });
};

export const useAllHotels = () => {
  return useQuery({
    queryKey: ['hotels', 'all'],
    queryFn: hotelApi.getAllHotels,
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: hotelApi.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// NEW: Hook for unified dashboard data (hotel + roomTypes + stats)
export const useHotelDashboardData = (hotelId: string | undefined) => {
  return useQuery({
    queryKey: ['hotel', 'dashboardData', hotelId],
    queryFn: () => hotelApi.getHotelDashboardData(hotelId!),
    enabled: !!hotelId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// OLD: Legacy config hooks (deprecated - use hotel hooks above)
export const useCurrentConfig = () => {
  return useQuery({
    queryKey: ['hotelConfig', 'current'],
    queryFn: hotelApi.getCurrentConfig,
  });
};

export const useSetCurrentConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hotelApi.setCurrentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelConfig', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['hotelConfig', 'all'] });
    },
  });
};

export const useAllConfigs = () => {
  return useQuery({
    queryKey: ['hotelConfig', 'all'],
    queryFn: hotelApi.getConfigs,
  });
};

export const useCreateConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hotelApi.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelConfig', 'all'] });
    },
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...config }: Partial<HotelConfigFormData> & { id: string }) => hotelApi.updateConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelConfig', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['hotelConfig', 'current'] });
    },
  });
};

export const useSetCurrentHotel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hotelApi.setCurrentHotel,
    onSuccess: () => {
      // Invalidate all hotel-related queries when hotel is switched
      queryClient.invalidateQueries({ queryKey: ['hotel'] });
      queryClient.invalidateQueries({ queryKey: ['hotelConfig'] });
      queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // CRITICAL: Invalidate all guest queries since guests are hotel-specific
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      // Also invalidate any room-related data that depends on guest assignments
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

// Add similar hooks for features, room types, floors, templates, and dashboard stats as needed. 