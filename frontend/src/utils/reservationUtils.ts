import type { Guest } from '../types/guest';
import type { Room } from '../types/room';
import type { Reservation, ReservationStatus as BusinessReservationStatus, ReservationAction } from '../types/index';

// Re-export types for convenience
export type { ReservationAction } from '../types/index';

export interface ReservationStatus {
  isActive: boolean;
  reason: string;
  category: 'active' | 'inactive';
}

/**
 * Hotel cancellation policies
 */
export interface CancellationPolicy {
  freeCancel: number; // hours before arrival
  partialFee: number; // hours before arrival  
  fullCharge: number; // hours before arrival
  noShowGracePeriod: number; // hours after check-in time
}

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  freeCancel: 24, // 24 hours free cancellation
  partialFee: 12, // 12 hours partial fee
  fullCharge: 2,  // 2 hours full charge
  noShowGracePeriod: 4 // 4 hours grace period for no-show
};

/**
 * Calculate cancellation fee based on hotel policy and timing
 */
export function calculateCancellationFee(
  reservation: Reservation,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY
): number {
  const checkInDate = new Date(reservation.dates.split(' to ')[0]);
  const now = new Date();
  const hoursUntilArrival = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilArrival > policy.freeCancel) {
    return 0; // Free cancellation
  } else if (hoursUntilArrival > policy.partialFee) {
    return reservation.financials.originalAmount * 0.5; // 50% fee
  } else if (hoursUntilArrival > policy.fullCharge) {
    return reservation.financials.originalAmount * 0.8; // 80% fee
  } else {
    return reservation.financials.originalAmount; // Full charge
  }
}

/**
 * Determine if a reservation can be cancelled based on business rules
 */
export function canCancelReservation(reservation: Reservation): { canCancel: boolean; reason?: string } {
  if (reservation.status !== 'active') {
    return { canCancel: false, reason: 'Reservation is not active' };
  }
  
  const hasCheckedInGuests = reservation.guestIds.some(guestId => {
    // This would need to be checked against actual guest data
    // For now, assume we can cancel if not past check-in time
    return false;
  });
  
  if (hasCheckedInGuests) {
    return { canCancel: false, reason: 'Some guests have already checked in. Use terminate instead.' };
  }
  
  return { canCancel: true };
}

/**
 * Determine if a reservation can be marked as no-show
 */
export function canMarkNoShow(
  reservation: Reservation,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY
): { canMarkNoShow: boolean; reason?: string } {
  if (reservation.status !== 'active') {
    return { canMarkNoShow: false, reason: 'Reservation is not active' };
  }
  
  const checkInDate = new Date(reservation.dates.split(' to ')[0]);
  const now = new Date();
  const hoursAfterCheckIn = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursAfterCheckIn < 0) {
    return { canMarkNoShow: false, reason: 'Check-in time has not passed yet' };
  }
  
  if (hoursAfterCheckIn < policy.noShowGracePeriod) {
    return { canMarkNoShow: false, reason: `Grace period of ${policy.noShowGracePeriod} hours not yet passed` };
  }
  
  return { canMarkNoShow: true };
}

/**
 * Create reservation action payload for business operations
 */
export function createReservationAction(
  action: ReservationAction,
  reservation: Reservation,
  reason?: string,
  performedBy: string = 'system'
): Partial<Reservation> {
  const timestamp = new Date().toISOString();
  
  const baseUpdate: Partial<Reservation> = {
    audit: {
      ...reservation.audit,
      updatedAt: timestamp,
      lastModifiedBy: performedBy,
      statusHistory: [
        ...reservation.audit.statusHistory,
        {
          status: reservation.status,
          timestamp,
          performedBy,
          reason,
        }
      ]
    }
  };
  
  switch (action) {
    case 'cancel':
      const cancellationFee = calculateCancellationFee(reservation);
      return {
        ...baseUpdate,
        status: 'cancelled' as BusinessReservationStatus,
        cancellationReason: reason,
        cancelledAt: timestamp,
        cancelledBy: 'hotel',
        financials: {
          ...reservation.financials,
          cancellationFee,
          refundAmount: reservation.financials.originalAmount - cancellationFee
        }
      };
      
    case 'no-show':
      return {
        ...baseUpdate,
        status: 'no-show' as BusinessReservationStatus,
        noShowMarkedAt: timestamp,
        financials: {
          ...reservation.financials,
          cancellationFee: reservation.financials.originalAmount, // Full charge for no-show
          refundAmount: 0
        }
      };
      
    case 'terminate':
      const earlyCheckoutFee = reservation.financials.originalAmount * 0.1; // 10% early checkout fee
      return {
        ...baseUpdate,
        status: 'terminated' as BusinessReservationStatus,
        terminatedAt: timestamp,
        terminationReason: reason,
        earlyCheckoutFee,
        financials: {
          ...reservation.financials,
          refundAmount: Math.max(0, reservation.financials.originalAmount - earlyCheckoutFee)
        }
      };
      
    case 'complete':
      return {
        ...baseUpdate,
        status: 'completed' as BusinessReservationStatus
      };
      
    default:
      return baseUpdate;
  }
}

/**
 * Determines if a reservation is active or inactive based on room status and guest statuses
 * Updated to handle new business statuses
 */
export function determineReservationStatus(
  guests: Guest[],
  room: Room,
  reservationStatus?: BusinessReservationStatus
): ReservationStatus {
  
  // Business status takes precedence
  if (reservationStatus) {
    switch (reservationStatus) {
      case 'active':
        break; // Continue with guest/room logic
      case 'cancelled':
        return {
          isActive: false,
          reason: 'Reservation has been cancelled',
          category: 'inactive'
        };
      case 'no-show':
        return {
          isActive: false,
          reason: 'Guest marked as no-show',
          category: 'inactive'
        };
      case 'terminated':
        return {
          isActive: false,
          reason: 'Reservation was terminated',
          category: 'inactive'
        };
      case 'completed':
        return {
          isActive: false,
          reason: 'Reservation completed successfully',
          category: 'inactive'
        };
    }
  }
  
  if (!guests || guests.length === 0) {
    return {
      isActive: false,
      reason: 'No guests assigned',
      category: 'inactive'
    };
  }

  // Check guest statuses
  const allCheckedOut = guests.every(g => g.status === 'checked-out');
  const hasCheckedOut = guests.some(g => g.status === 'checked-out');
  const hasActive = guests.some(g => g.status === 'booked' || g.status === 'checked-in');

  // Room status determines final state
  const roomStatus = room.status;

  // INACTIVE scenarios
  if (allCheckedOut) {
    return {
      isActive: false,
      reason: 'All guests have checked out',
      category: 'inactive'
    };
  }

  if (['cleaning', 'deoccupied', 'partially-deoccupied'].includes(roomStatus)) {
    return {
      isActive: false,
      reason: `Room is ${roomStatus.replace('-', ' ')}`,
      category: 'inactive'
    };
  }

  if (roomStatus === 'maintenance') {
    return {
      isActive: false,
      reason: 'Room is under maintenance',
      category: 'inactive'
    };
  }

  // ACTIVE scenarios
  if (hasActive) {
    if (hasCheckedOut) {
      return {
        isActive: true,
        reason: 'Some guests remain (partially deoccupied)',
        category: 'active'
      };
    } else {
      return {
        isActive: true,
        reason: 'Guests are booked or checked in',
        category: 'active'
      };
    }
  }

  // Default fallback
  return {
    isActive: false,
    reason: 'Unknown status',
    category: 'inactive'
  };
}

/**
 * Get reservation status display information with business logic
 */
export function getReservationStatusDisplay(status: ReservationStatus, businessStatus?: BusinessReservationStatus) {
  // Business status display takes precedence
  if (businessStatus) {
    switch (businessStatus) {
      case 'active':
        return {
          color: 'success.main',
          label: 'Active',
          description: status.reason
        };
      case 'cancelled':
        return {
          color: 'warning.main',
          label: 'Cancelled',
          description: 'Reservation cancelled by hotel or guest'
        };
      case 'no-show':
        return {
          color: 'error.main',
          label: 'No-Show',
          description: 'Guest did not arrive for reservation'
        };
      case 'terminated':
        return {
          color: 'error.main',
          label: 'Terminated',
          description: 'Reservation terminated early'
        };
      case 'completed':
        return {
          color: 'info.main',
          label: 'Completed',
          description: 'Reservation completed successfully'
        };
    }
  }
  
  return {
    color: status.isActive ? 'success.main' : 'error.main',
    label: status.isActive ? 'Active' : 'Inactive',
    description: status.reason
  };
}

/**
 * Generate confirmation number for reservations
 */
export function generateConfirmationNumber(hotelId: string, reservationId: string): string {
  const hotelCode = hotelId.substring(hotelId.length - 4).toUpperCase();
  const resCode = reservationId.substring(reservationId.length - 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${hotelCode}-${resCode}-${timestamp}`;
}

/**
 * Truth table for reservation statuses:
 * 
 * | Business Status | Guest Status(es) | Room Status | Reservation | Reason |
 * |----------------|-----------------|-------------|-------------|---------|
 * | active | booked | available | ACTIVE | Future reservation |
 * | active | booked | reserved | ACTIVE | Room reserved |
 * | active | checked-in | occupied | ACTIVE | Current stay |
 * | active | checked-out | cleaning | INACTIVE | Needs cleaning |
 * | cancelled | any | any | INACTIVE | Cancelled by hotel/guest |
 * | no-show | any | any | INACTIVE | Guest did not arrive |
 * | terminated | any | any | INACTIVE | Early termination |
 * | completed | checked-out | cleaning | INACTIVE | Normal completion |
 */ 