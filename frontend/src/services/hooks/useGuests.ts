import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as guestApi from '../api/guest';

export const useGuests = (hotelId?: string) => {
  return useQuery({
    queryKey: ['guests', hotelId],
    queryFn: () => guestApi.getGuests(hotelId),
    enabled: !!hotelId, // Only fetch when we have a valid hotelId
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
  });
};

export const useCreateGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.createGuest,
    onSuccess: () => {
      // Invalidate both the specific hotel's guests and any general guest queries
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Also invalidate room data since guest assignments affect room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useUpdateGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...guest }: any) => guestApi.updateGuest(id, guest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Invalidate room data since guest status changes affect room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useDeleteGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Invalidate room data since guest removal affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useCheckInGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.checkInGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Invalidate room data since check-in affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useCheckOutGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.checkOutGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Invalidate room data since check-out affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useToggleKeepOpen = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, keepOpen }: { id: string; keepOpen: boolean }) => guestApi.toggleKeepOpen(id, keepOpen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      // Invalidate room data since keepOpen affects room availability
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}; 