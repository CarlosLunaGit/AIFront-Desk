import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as guestApi from '../api/guest';

export const useGuests = () => {
  return useQuery({
    queryKey: ['guests'],
    queryFn: guestApi.getGuests,
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.createGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useUpdateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...guest }: any) => guestApi.updateGuest(id, guest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useDeleteGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useCheckInGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.checkInGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useCheckOutGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestApi.checkOutGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useToggleKeepOpen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, keepOpen }: { id: string; keepOpen: boolean }) => guestApi.toggleKeepOpen(id, keepOpen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}; 