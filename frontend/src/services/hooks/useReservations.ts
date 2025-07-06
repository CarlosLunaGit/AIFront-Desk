import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reservationApi from '../api/reservation';

export const useReservations = (hotelId?: string) => {
  return useQuery({
    queryKey: ['reservations', hotelId],
    queryFn: () => reservationApi.getReservations(hotelId),
    enabled: !!hotelId,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...reservation }: any) => reservationApi.updateReservation(id, reservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationApi.deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}; 