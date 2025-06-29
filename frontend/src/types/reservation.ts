// Enhanced Reservation System Types
// Multi-room, multi-guest reservation support with detailed pricing

export interface MultiRoomReservation {
  id: string;
  primaryGuest: Guest;           // Main booker/contact person
  roomAssignments: RoomAssignment[];
  checkInDate: string;           // ISO date string
  checkOutDate: string;          // ISO date string
  pricing: ReservationPricing;
  status: ReservationStatus;
  notes?: string;
  specialRequests?: string[];
  hotelId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAssignment {
  roomId: string;
  room?: Room;                   // Populated room data
  guests: Guest[];               // All guests assigned to this room
  roomSpecificNotes?: string;
  checkInStatus: RoomCheckInStatus;
}

export interface Guest {
  _id?: string;                  // For existing guests
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  idDocument?: {
    type: 'passport' | 'license' | 'id-card';
    number: string;
    expiryDate?: string;
  };
  preferences?: GuestPreferences;
  status: GuestStatus;
  roomId?: string;               // Current room assignment
  reservationStart?: string;
  reservationEnd?: string;
  checkIn?: string;
  checkOut?: string;
  hotelId: string;
  keepOpen?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestPreferences {
  bedType?: 'single' | 'double' | 'twin' | 'king' | 'queen';
  floorPreference?: 'low' | 'high' | 'any';
  smokingPreference?: 'smoking' | 'non-smoking';
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  specialRequests?: string[];
}

export type GuestStatus = 'booked' | 'checked-in' | 'checked-out' | 'no-show' | 'cancelled';

export type RoomCheckInStatus = 'pending' | 'partial' | 'complete' | 'checkout-pending';

export type ReservationStatus = 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

// Enhanced Room Status Types
export type EnhancedRoomStatus = 
  // Existing statuses (keep current logic)
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'cleaning'
  | 'partially-occupied'
  | 'partially-reserved'
  // New operational statuses
  | 'checkout-pending'
  | 'maintenance'
  | 'out-of-order'
  | 'blocked';

// Pricing System Types
export interface ReservationPricing {
  breakdown: PricingBreakdown[];
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
}

export interface PricingBreakdown {
  roomId: string;
  roomNumber: string;
  roomType: string;
  description: string;           // "Deluxe Room - 3 nights"
  baseAmount: number;           // Base rate × nights
  adjustments: PriceAdjustment[];
  finalAmount: number;
}

export interface PriceAdjustment {
  type: 'seasonal' | 'weekend' | 'length-of-stay' | 'tax' | 'fee' | 'discount';
  description: string;          // "Weekend surcharge", "3+ nights discount"
  amount: number;              // Positive for charges, negative for discounts
  percentage?: number;         // If percentage-based
}

// Room Availability Types
export interface AvailabilityQuery {
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  hotelId: string;
  roomPreferences?: RoomPreferences;
}

export interface RoomPreferences {
  roomTypeIds?: string[];
  bedType?: string;
  maxPrice?: number;
  amenities?: string[];
  floorPreference?: 'low' | 'high' | 'any';
  accessibility?: boolean;
}

export interface AvailableRoom {
  room: Room;
  roomType: RoomType;
  isAvailable: boolean;
  unavailableDates: string[];   // ISO date strings
  pricing: RoomPricing;
  recommendationScore: number;  // 0-100, based on capacity match, preferences
  reasonsUnavailable?: string[];
}

export interface RoomPricing {
  baseRate: number;            // Per night base rate
  totalNights: number;
  subtotal: number;           // Base rate × nights
  adjustments: PriceAdjustment[];
  finalAmount: number;        // After all adjustments
}

// Room Assignment Strategy
export interface RoomAssignmentSuggestion {
  assignments: SuggestedRoomAssignment[];
  totalPrice: number;
  matchScore: number;         // How well it matches guest preferences
  reasoning: string;          // Why this assignment was suggested
}

export interface SuggestedRoomAssignment {
  roomId: string;
  room: Room;
  suggestedGuests: Guest[];
  capacityUtilization: number; // 0-1, how full the room will be
  preferenceMatch: number;     // 0-1, how well it matches guest preferences
}

// Date Range Utility Type
export interface DateRange {
  start: string;              // ISO date string
  end: string;                // ISO date string
  nights: number;
}

// Enhanced Room Type with Operational Fields
export interface EnhancedRoom extends Room {
  // Operational status fields
  maintenanceScheduled?: {
    start: string;
    end: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  outOfOrder?: {
    since: string;
    reason: string;
    estimatedRepair?: string;
  };
  manuallyBlocked?: {
    since: string;
    reason: string;
    blockedBy: string;
    until?: string;
  };
  needsCleaning?: boolean;
  lastCleaned?: string;
  lastInspected?: string;
  
  // Enhanced guest tracking
  assignedGuests?: Guest[];
  checkoutPendingGuests?: Guest[];
  expectedCheckouts?: string[];  // ISO date strings
  expectedCheckins?: string[];   // ISO date strings
}

// Reservation Wizard State
export interface ReservationWizardState {
  currentStep: number;
  data: Partial<MultiRoomReservation>;
  availableRooms?: AvailableRoom[];
  selectedRooms?: string[];
  roomAssignments?: Partial<RoomAssignment>[];
  pricing?: ReservationPricing;
  errors?: Record<string, string>;
  isValid?: boolean;
}

// API Response Types
export interface AvailabilityResponse {
  query: AvailabilityQuery;
  availableRooms: AvailableRoom[];
  totalAvailable: number;
  suggestions: RoomAssignmentSuggestion[];
  unavailableReasons: Record<string, string[]>;
}

export interface PricingCalculationRequest {
  roomIds: string[];
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  hotelId: string;
}

export interface PricingCalculationResponse {
  pricing: ReservationPricing;
  breakdown: PricingBreakdown[];
  recommendations?: {
    savings?: PriceAdjustment[];
    upgrades?: {
      roomId: string;
      additionalCost: number;
      benefits: string[];
    }[];
  };
}

// Import existing types for compatibility
import type { Room, RoomType } from './index'; 