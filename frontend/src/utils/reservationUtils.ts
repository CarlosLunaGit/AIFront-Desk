import type { Guest } from '../types/guest';
import type { Room } from '../types/room';

export interface ReservationStatus {
  isActive: boolean;
  reason: string;
  category: 'active' | 'inactive';
}

/**
 * Determines if a reservation is active or inactive based on room status and guest statuses
 * 
 * ACTIVE RESERVATIONS:
 * - Guests are booked (future reservation)
 * - Guests are checked-in (current stay)
 * - Mixed booked and checked-in guests
 * - Room statuses: available, reserved, partially-reserved, occupied, partially-occupied
 * 
 * INACTIVE RESERVATIONS:
 * - All guests are checked-out
 * - Room needs cleaning or maintenance
 * - Room statuses: cleaning, deoccupied, partially-deoccupied, maintenance
 */
export function determineReservationStatus(
  guests: Guest[],
  room: Room
): ReservationStatus {
  
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
 * Get reservation status display information
 */
export function getReservationStatusDisplay(status: ReservationStatus) {
  return {
    color: status.isActive ? 'success.main' : 'error.main',
    label: status.isActive ? 'Active' : 'Inactive',
    description: status.reason
  };
}

/**
 * Truth table for reservation statuses:
 * 
 * | Guest Status(es) | Room Status | Reservation | Reason |
 * |-----------------|-------------|-------------|---------|
 * | booked | available | ACTIVE | Future reservation |
 * | booked | reserved | ACTIVE | Room reserved |
 * | booked | partially-reserved | ACTIVE | Room partially booked |
 * | checked-in | occupied | ACTIVE | Current stay |
 * | checked-in | partially-occupied | ACTIVE | Current stay with space |
 * | checked-out | cleaning | INACTIVE | Needs cleaning |
 * | checked-out | deoccupied | INACTIVE | All guests left |
 * | mixed (some checked-out) | partially-deoccupied | ACTIVE | Some guests remain |
 * | any | maintenance | INACTIVE | Room maintenance |
 */ 