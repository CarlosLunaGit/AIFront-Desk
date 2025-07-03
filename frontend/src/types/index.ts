export type RoomStatus = 'available' | 'reserved' | 'partially-reserved' | 'occupied' | 'partially-occupied' | 'cleaning' | 'maintenance' | 'deoccupied' | 'partially-deoccupied';

// Enhanced reservation business statuses
export type ReservationStatus = 'active' | 'cancelled' | 'no-show' | 'terminated' | 'completed';

export type ReservationAction = 'cancel' | 'no-show' | 'terminate' | 'complete';

export interface ReservationFinancials {
  originalAmount: number;
  cancellationFee?: number;
  refundAmount?: number;
  paidAmount?: number;
  outstandingAmount?: number;
}

export interface ReservationAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy?: string;
  // Status change history
  statusHistory: Array<{
    status: ReservationStatus;
    timestamp: string;
    performedBy: string;
    reason?: string;
    notes?: string;
  }>;
}

export interface Reservation {
  id: string;
  hotelId: string;
  guestIds: string[];
  rooms: string; // Room ID
  dates: string; // "YYYY-MM-DD to YYYY-MM-DD"
  price: number;
  notes?: string;
  
  // Enhanced business fields
  status: ReservationStatus;
  confirmationNumber?: string;
  
  // Financial tracking
  financials: ReservationFinancials;
  
  // Audit trail
  audit: ReservationAudit;
  
  // Cancellation/termination details
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'guest' | 'hotel' | 'system';
  
  // No-show tracking
  noShowMarkedAt?: string;
  noShowGracePeriod?: number; // hours
  
  // Termination details
  terminatedAt?: string;
  terminationReason?: string;
  earlyCheckoutFee?: number;
}

// Re-export communication types
export * from './communication';