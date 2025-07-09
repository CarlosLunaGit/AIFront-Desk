import type { RoomType } from './room';
import type { Room } from './room';
import { Guest } from './guest';

export interface Reservation {
  _id: string;
  hotelId: string;
  roomId: string;
  guestIds: string[];
  confirmationNumber: string;
  reservationStart: string;
  reservationEnd: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  
  // Financial data
  roomRate: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  
  // Status management
  status: 'active' | 'cancelled' | 'no-show' | 'terminated' | 'completed';
  reservationStatus: 'active' | 'cancelled' | 'no-show' | 'terminated' | 'completed';
  bookingStatus: 'confirmed' | 'pending' | 'waitlist';
  
  // Business logic fields
  createdAt: string;
  updatedAt: string;
  lastStatusChange: string;
  
  // Business-specific fields for handlers
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  noShowMarkedAt?: string | null;
  noShowReason?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  completedAt?: string | null;
  
  // Additional data
  specialRequests?: string;
  notes?: string;
  source: 'direct' | 'online' | 'phone' | 'walk-in';
  
  // Financial tracking structure
  financials: {
    totalAmount: number;
    paidAmount: number;
    refundAmount: number;
    cancellationFee: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    transactions: any[];
  };
  
  // Audit trail structure
  audit: {
    statusHistory: {
      status: string;
      timestamp: string;
      performedBy: string;
      reason: string;
    }[];
    actions: {
      action: string;
      timestamp: string;
      performedBy: string;
      details: any;
    }[];
  };
  
  // Simple audit trail
  statusHistory: {
    status: string;
    timestamp: string;
    performedBy: string;
    reason?: string;
  }[];
}

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

export interface GuestPreferences {
  bedType?: 'single' | 'double' | 'twin' | 'king' | 'queen';
  floorPreference?: 'low' | 'high' | 'any';
  smokingPreference?: 'smoking' | 'non-smoking';
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  specialRequests?: string[];
}



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
  reasonsUnavailable: string[]; // Made required instead of optional
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
export interface EnhancedRoom extends Omit<Room, 'assignedGuests'> {
  // Enhanced guest tracking - override the assignedGuests property
  assignedGuests?: Guest[];
  checkoutPendingGuests?: Guest[];
  expectedCheckouts?: string[];  // ISO date strings
  expectedCheckins?: string[];   // ISO date strings
  
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