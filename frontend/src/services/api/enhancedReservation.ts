// Enhanced Reservation API Services
// API functions for room availability, pricing, and multi-room reservations

import { api } from '../axios';
import type {
  AvailabilityQuery,
  AvailabilityResponse,
  PricingCalculationRequest,
  PricingCalculationResponse,
  MultiRoomReservation,
  RoomAssignmentSuggestion
} from '../../types/reservation';

// Room Availability APIs
export const checkRoomAvailability = async (query: AvailabilityQuery): Promise<AvailabilityResponse> => {
  const response = await api.get('/api/rooms/availability', {
    params: {
      checkInDate: query.checkInDate,
      checkOutDate: query.checkOutDate,
      totalGuests: query.totalGuests,
      hotelId: query.hotelId,
      ...(query.roomPreferences && { preferences: JSON.stringify(query.roomPreferences) })
    }
  });
  return response.data;
};

// Get available rooms with detailed information
export const getAvailableRoomsDetailed = async (
  checkInDate: string,
  checkOutDate: string,
  guestCount: number,
  hotelId: string
) => {
  const response = await api.get('/api/rooms/available-detailed', {
    params: {
      checkInDate,
      checkOutDate,
      guestCount,
      hotelId
    }
  });
  return response.data;
};

// Pricing Calculation APIs
export const calculateReservationPricing = async (
  request: PricingCalculationRequest
): Promise<PricingCalculationResponse> => {
  const response = await api.post('/api/pricing/calculate', request);
  return response.data;
};

// Get pricing for specific rooms and dates
export const getRoomPricing = async (
  roomIds: string[],
  checkInDate: string,
  checkOutDate: string,
  hotelId: string
) => {
  const response = await api.post('/api/pricing/rooms', {
    roomIds,
    checkInDate,
    checkOutDate,
    hotelId
  });
  return response.data;
};

// Room Assignment Suggestions
export const getRoomAssignmentSuggestions = async (
  availableRoomIds: string[],
  totalGuests: number,
  preferences?: any
): Promise<RoomAssignmentSuggestion[]> => {
  const response = await api.post('/api/rooms/assignment-suggestions', {
    availableRoomIds,
    totalGuests,
    preferences
  });
  return response.data;
};

// Multi-Room Reservation APIs
export const createMultiRoomReservation = async (
  reservation: Omit<MultiRoomReservation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MultiRoomReservation> => {
  const response = await api.post('/api/reservations/multi-room', reservation);
  return response.data;
};

// Update multi-room reservation
export const updateMultiRoomReservation = async (
  id: string,
  updates: Partial<MultiRoomReservation>
): Promise<MultiRoomReservation> => {
  const response = await api.patch(`/api/reservations/multi-room/${id}`, updates);
  return response.data;
};

// Get multi-room reservation by ID
export const getMultiRoomReservation = async (id: string): Promise<MultiRoomReservation> => {
  const response = await api.get(`/api/reservations/multi-room/${id}`);
  return response.data;
};

// Get all multi-room reservations for a hotel
export const getMultiRoomReservations = async (
  hotelId: string,
  filters?: {
    status?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guestName?: string;
  }
): Promise<MultiRoomReservation[]> => {
  const response = await api.get('/api/reservations/multi-room', {
    params: {
      hotelId,
      ...filters
    }
  });
  return response.data;
};

// Guest Management for Reservations
export const addGuestToReservation = async (
  reservationId: string,
  roomId: string,
  guest: any
) => {
  const response = await api.post(`/api/reservations/${reservationId}/guests`, {
    roomId,
    guest
  });
  return response.data;
};

// Remove guest from reservation
export const removeGuestFromReservation = async (
  reservationId: string,
  guestId: string
) => {
  const response = await api.delete(`/api/reservations/${reservationId}/guests/${guestId}`);
  return response.data;
};

// Update guest information in reservation
export const updateGuestInReservation = async (
  reservationId: string,
  guestId: string,
  updates: any
) => {
  const response = await api.patch(`/api/reservations/${reservationId}/guests/${guestId}`, updates);
  return response.data;
};

// Room Assignment Management
export const updateRoomAssignment = async (
  reservationId: string,
  roomId: string,
  assignment: {
    guests: string[];
    roomSpecificNotes?: string;
  }
) => {
  const response = await api.patch(`/api/reservations/${reservationId}/rooms/${roomId}`, assignment);
  return response.data;
};

// Add room to existing reservation
export const addRoomToReservation = async (
  reservationId: string,
  roomId: string,
  guests: string[]
) => {
  const response = await api.post(`/api/reservations/${reservationId}/rooms`, {
    roomId,
    guests
  });
  return response.data;
};

// Remove room from reservation
export const removeRoomFromReservation = async (
  reservationId: string,
  roomId: string
) => {
  const response = await api.delete(`/api/reservations/${reservationId}/rooms/${roomId}`);
  return response.data;
};

// Pricing Updates
export const recalculateReservationPricing = async (
  reservationId: string
): Promise<PricingCalculationResponse> => {
  const response = await api.post(`/api/reservations/${reservationId}/recalculate-pricing`);
  return response.data;
};

// Validation APIs
export const validateReservationData = async (
  reservationData: Partial<MultiRoomReservation>
) => {
  const response = await api.post('/api/reservations/validate', reservationData);
  return response.data;
};

// Check for conflicts before creating reservation
export const checkReservationConflicts = async (
  roomIds: string[],
  checkInDate: string,
  checkOutDate: string,
  excludeReservationId?: string
) => {
  const response = await api.post('/api/reservations/check-conflicts', {
    roomIds,
    checkInDate,
    checkOutDate,
    excludeReservationId
  });
  return response.data;
};

// Upgrade Recommendations
export const getUpgradeRecommendations = async (
  reservationId: string
) => {
  const response = await api.get(`/api/reservations/${reservationId}/upgrade-recommendations`);
  return response.data;
};

// Apply upgrade to reservation
export const applyUpgrade = async (
  reservationId: string,
  currentRoomId: string,
  upgradeRoomId: string,
  reason?: string
) => {
  const response = await api.post(`/api/reservations/${reservationId}/upgrade`, {
    currentRoomId,
    upgradeRoomId,
    reason
  });
  return response.data;
};

// Reservation Analytics
export const getReservationAnalytics = async (
  hotelId: string,
  dateRange: {
    start: string;
    end: string;
  }
) => {
  const response = await api.get('/api/reservations/analytics', {
    params: {
      hotelId,
      startDate: dateRange.start,
      endDate: dateRange.end
    }
  });
  return response.data;
};

// Export all functions
export default {
  // Availability
  checkRoomAvailability,
  getAvailableRoomsDetailed,
  
  // Pricing
  calculateReservationPricing,
  getRoomPricing,
  recalculateReservationPricing,
  
  // Room Assignments
  getRoomAssignmentSuggestions,
  updateRoomAssignment,
  addRoomToReservation,
  removeRoomFromReservation,
  
  // Reservations
  createMultiRoomReservation,
  updateMultiRoomReservation,
  getMultiRoomReservation,
  getMultiRoomReservations,
  
  // Guests
  addGuestToReservation,
  removeGuestFromReservation,
  updateGuestInReservation,
  
  // Validation
  validateReservationData,
  checkReservationConflicts,
  
  // Upgrades
  getUpgradeRecommendations,
  applyUpgrade,
  
  // Analytics
  getReservationAnalytics
}; 