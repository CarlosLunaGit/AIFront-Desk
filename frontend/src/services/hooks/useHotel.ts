import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as hotelApi from '../api/hotel';
import type { HotelConfigFormData } from '../../types/hotel';

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
    queryFn: hotelApi.getAllConfigs,
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

// Add similar hooks for features, room types, floors, templates, and dashboard stats as needed. 