// Enhanced Reservations React Query Hooks
// Hooks for room availability, pricing, and multi-room reservations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import enhancedReservationApi from '../api/enhancedReservation';
import type {
  AvailabilityQuery,
  PricingCalculationRequest,
  MultiRoomReservation
} from '../../types/reservation';

// Query Keys
export const enhancedReservationKeys = {
  all: ['enhanced-reservations'] as const,
  availability: (query: AvailabilityQuery) => ['availability', query] as const,
  pricing: (request: PricingCalculationRequest) => ['pricing', request] as const,
  reservations: (hotelId: string) => ['enhanced-reservations', hotelId] as const,
  reservation: (id: string) => ['enhanced-reservation', id] as const,
  suggestions: (roomIds: string[], guests: number) => ['room-suggestions', roomIds, guests] as const,
  upgrades: (reservationId: string) => ['upgrade-recommendations', reservationId] as const,
};

// Room Availability Hooks
export const useRoomAvailability = (query: AvailabilityQuery, enabled = true) => {
  return useQuery({
    queryKey: enhancedReservationKeys.availability(query),
    queryFn: () => enhancedReservationApi.checkRoomAvailability(query),
    enabled: enabled && !!query.checkInDate && !!query.checkOutDate && !!query.hotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useAvailableRoomsDetailed = (
  checkInDate: string,
  checkOutDate: string,
  guestCount: number,
  hotelId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['available-rooms-detailed', checkInDate, checkOutDate, guestCount, hotelId],
    queryFn: () => enhancedReservationApi.getAvailableRoomsDetailed(checkInDate, checkOutDate, guestCount, hotelId),
    enabled: enabled && !!checkInDate && !!checkOutDate && !!hotelId,
    staleTime: 5 * 60 * 1000,
  });
};

// Pricing Hooks
export const useReservationPricing = (request: PricingCalculationRequest, enabled = true) => {
  return useQuery({
    queryKey: enhancedReservationKeys.pricing(request),
    queryFn: () => enhancedReservationApi.calculateReservationPricing(request),
    enabled: enabled && !!request.roomIds.length && !!request.checkInDate && !!request.checkOutDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRoomPricing = (
  roomIds: string[],
  checkInDate: string,
  checkOutDate: string,
  hotelId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['room-pricing', roomIds, checkInDate, checkOutDate, hotelId],
    queryFn: () => enhancedReservationApi.getRoomPricing(roomIds, checkInDate, checkOutDate, hotelId),
    enabled: enabled && roomIds.length > 0 && !!checkInDate && !!checkOutDate && !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
};

// Room Assignment Suggestions
export const useRoomAssignmentSuggestions = (
  availableRoomIds: string[],
  totalGuests: number,
  preferences?: any,
  enabled = true
) => {
  return useQuery({
    queryKey: enhancedReservationKeys.suggestions(availableRoomIds, totalGuests),
    queryFn: () => enhancedReservationApi.getRoomAssignmentSuggestions(availableRoomIds, totalGuests, preferences),
    enabled: enabled && availableRoomIds.length > 0 && totalGuests > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Multi-Room Reservations Hooks
export const useMultiRoomReservations = (hotelId: string, filters?: any) => {
  return useQuery({
    queryKey: enhancedReservationKeys.reservations(hotelId),
    queryFn: () => enhancedReservationApi.getMultiRoomReservations(hotelId, filters),
    enabled: !!hotelId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useMultiRoomReservation = (id: string) => {
  return useQuery({
    queryKey: enhancedReservationKeys.reservation(id),
    queryFn: () => enhancedReservationApi.getMultiRoomReservation(id),
    enabled: !!id,
  });
};

// Upgrade Recommendations
export const useUpgradeRecommendations = (reservationId: string) => {
  return useQuery({
    queryKey: enhancedReservationKeys.upgrades(reservationId),
    queryFn: () => enhancedReservationApi.getUpgradeRecommendations(reservationId),
    enabled: !!reservationId,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation Hooks
export const useCreateMultiRoomReservation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: enhancedReservationApi.createMultiRoomReservation,
    onSuccess: (data) => {
      // Invalidate and refetch reservations
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservations(data.hotelId) });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      enqueueSnackbar('Reservation created successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to create reservation',
        { variant: 'error' }
      );
    },
  });
};

export const useUpdateMultiRoomReservation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MultiRoomReservation> }) =>
      enhancedReservationApi.updateMultiRoomReservation(id, updates),
    onSuccess: (data) => {
      // Update specific reservation in cache
      queryClient.setQueryData(enhancedReservationKeys.reservation(data.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservations(data.hotelId) });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      enqueueSnackbar('Reservation updated successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to update reservation',
        { variant: 'error' }
      );
    },
  });
};

// Guest Management Mutations
export const useAddGuestToReservation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ reservationId, roomId, guest }: { reservationId: string; roomId: string; guest: any }) =>
      enhancedReservationApi.addGuestToReservation(reservationId, roomId, guest),
    onSuccess: (_, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      enqueueSnackbar('Guest added to reservation!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to add guest',
        { variant: 'error' }
      );
    },
  });
};

export const useRemoveGuestFromReservation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ reservationId, guestId }: { reservationId: string; guestId: string }) =>
      enhancedReservationApi.removeGuestFromReservation(reservationId, guestId),
    onSuccess: (_, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      enqueueSnackbar('Guest removed from reservation!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to remove guest',
        { variant: 'error' }
      );
    },
  });
};

// Room Assignment Mutations
export const useUpdateRoomAssignment = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ 
      reservationId, 
      roomId, 
      assignment 
    }: { 
      reservationId: string; 
      roomId: string; 
      assignment: { guests: string[]; roomSpecificNotes?: string } 
    }) =>
      enhancedReservationApi.updateRoomAssignment(reservationId, roomId, assignment),
    onSuccess: (_, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      enqueueSnackbar('Room assignment updated!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to update room assignment',
        { variant: 'error' }
      );
    },
  });
};

export const useAddRoomToReservation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ reservationId, roomId, guests }: { reservationId: string; roomId: string; guests: string[] }) =>
      enhancedReservationApi.addRoomToReservation(reservationId, roomId, guests),
    onSuccess: (_, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      enqueueSnackbar('Room added to reservation!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to add room',
        { variant: 'error' }
      );
    },
  });
};

// Pricing Mutations
export const useRecalculateReservationPricing = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: enhancedReservationApi.recalculateReservationPricing,
    onSuccess: (data, reservationId) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      enqueueSnackbar('Pricing recalculated!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to recalculate pricing',
        { variant: 'error' }
      );
    },
  });
};

// Upgrade Mutations
export const useApplyUpgrade = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ 
      reservationId, 
      currentRoomId, 
      upgradeRoomId, 
      reason 
    }: { 
      reservationId: string; 
      currentRoomId: string; 
      upgradeRoomId: string; 
      reason?: string 
    }) =>
      enhancedReservationApi.applyUpgrade(reservationId, currentRoomId, upgradeRoomId, reason),
    onSuccess: (_, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: enhancedReservationKeys.reservation(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      enqueueSnackbar('Room upgrade applied successfully!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to apply upgrade',
        { variant: 'error' }
      );
    },
  });
};

// Validation Hooks
export const useValidateReservationData = () => {
  return useMutation({
    mutationFn: enhancedReservationApi.validateReservationData,
  });
};

export const useCheckReservationConflicts = () => {
  return useMutation({
    mutationFn: ({ 
      roomIds, 
      checkInDate, 
      checkOutDate, 
      excludeReservationId 
    }: { 
      roomIds: string[]; 
      checkInDate: string; 
      checkOutDate: string; 
      excludeReservationId?: string 
    }) =>
      enhancedReservationApi.checkReservationConflicts(roomIds, checkInDate, checkOutDate, excludeReservationId),
  });
}; 