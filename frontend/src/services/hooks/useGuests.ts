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
      // Invalidate guest queries for the current hotel
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      // CRITICAL: Also invalidate room queries since adding guests affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      // Invalidate dashboard data since room statistics may have changed
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...guest }: any) => guestApi.updateGuest(id, guest),
    onSuccess: () => {
      // Invalidate guest queries for the current hotel
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      // CRITICAL: Also invalidate room queries since guest keepOpen status affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      // Invalidate dashboard data since room statistics may have changed
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteGuest = (hotelId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.deleteGuest,
    onSuccess: () => {
      // Invalidate guest queries for the current hotel
      if (hotelId) {
        queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
      }
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      // CRITICAL: Also invalidate room queries since removing guests affects room status
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      // Invalidate dashboard data since room statistics may have changed  
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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