import { mockGuests } from './guests';
import { mockRooms } from './rooms';

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
  reservationStatus: 'active' | 'cancelled' | 'no-show' | 'terminated' | 'completed'; // Make required, not optional
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
  
  // Financial tracking structure - make required, not optional
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
  
  // Audit trail structure - make required, not optional
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

// Helper function to calculate nights between dates
const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper function to determine reservation status based on guest statuses
const calculateReservationStatus = (guestIds: string[]): 'active' | 'completed' => {
  const guests = mockGuests.filter(g => guestIds.includes(g._id));
  
  const hasCheckedIn = guests.some(g => g.status === 'checked-in');
  const allCheckedOut = guests.every(g => g.status === 'checked-out');
  const hasBooked = guests.some(g => g.status === 'booked');
  
  if (allCheckedOut) return 'completed';
  if (hasCheckedIn || hasBooked) return 'active';
  return 'active'; // Default fallback
};

// Generate confirmation number
const generateConfirmationNumber = (hotelId: string, reservationIndex: number): string => {
  const hotelCode = hotelId.slice(-4).toUpperCase();
  return `${hotelCode}${String(reservationIndex).padStart(4, '0')}`;
};

// Create actual reservation data based on current room + guest assignments
const createReservationsFromCurrentData = (): Reservation[] => {
  const reservations: Reservation[] = [];
  let reservationIndex = 1;
  
  // Group guests by room and hotel
  const roomGuestGroups = new Map<string, string[]>();
  
  mockGuests.forEach(guest => {
    if (guest.roomId) {
      const key = `${guest.hotelId}-${guest.roomId}`;
      if (!roomGuestGroups.has(key)) {
        roomGuestGroups.set(key, []);
      }
      roomGuestGroups.get(key)!.push(guest._id);
    }
  });
  
  // Create reservations for each room-guest group
  roomGuestGroups.forEach((guestIds, roomKey) => {
    const [hotelId, roomId] = roomKey.split('-');
    const room = mockRooms.find(r => r._id === roomId && r.hotelId === hotelId);
    const guests = mockGuests.filter(g => guestIds.includes(g._id));
    
    if (!room || guests.length === 0) return;
    
    // Use guest reservation dates
    const checkInDates = guests.map(g => g.reservationStart).filter(Boolean).sort();
    const checkOutDates = guests.map(g => g.reservationEnd).filter(Boolean).sort();
    
    const checkInDate = checkInDates[0] || new Date().toISOString();
    const checkOutDate = checkOutDates[checkOutDates.length - 1] || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const nights = calculateNights(checkInDate, checkOutDate);
    
    const reservation: Reservation = {
      _id: `res-${hotelId.slice(-4)}-${String(reservationIndex++).padStart(4, '0')}`,
      hotelId,
      roomId,
      guestIds,
      confirmationNumber: generateConfirmationNumber(hotelId, reservationIndex - 1),
      reservationStart: checkInDate,
      reservationEnd: checkOutDate,
      checkInDate,
      checkOutDate,
      nights,
      
      // Financial data
      roomRate: room.rate || 100,
      totalAmount: (room.rate || 100) * nights,
      paidAmount: 0,
      currency: 'USD',
      
      // Status management
      status: calculateReservationStatus(guestIds),
      reservationStatus: calculateReservationStatus(guestIds), // For compatibility
      bookingStatus: 'confirmed',
      
      // Timestamps
      createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      
      // Business-specific fields
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      noShowMarkedAt: null,
      terminatedAt: null,
      
      // Additional data
      specialRequests: '',
      notes: `Reservation for ${guests.map(g => g.name).join(', ')} in room ${room.number}`,
      source: 'direct',
      
      // Financial tracking structure expected by handlers
      financials: {
        totalAmount: (room.rate || 100) * nights,
        paidAmount: 0,
        refundAmount: 0,
        cancellationFee: 0,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        transactions: []
      },
      
      // Audit trail structure expected by handlers
      audit: {
        statusHistory: [
          {
            status: calculateReservationStatus(guestIds),
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            reason: 'Initial reservation creation'
          }
        ],
        actions: [
          {
            action: 'create',
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            details: {
              guestCount: guestIds.length,
              roomNumber: room.number
            }
          }
        ]
      },
      
      // Simple audit trail
      statusHistory: [
        {
          status: calculateReservationStatus(guestIds),
          timestamp: new Date().toISOString(),
          performedBy: 'system',
          reason: 'Initial reservation creation from guest data'
        }
      ]
    };
    
    reservations.push(reservation);
  });
  
  return reservations;
};

// Export the generated reservations
export const mockReservations: Reservation[] = createReservationsFromCurrentData();

// Function to recalculate reservation status when guest status changes
export const recalculateReservationStatus = (reservationId: string, reason: string = 'Guest status change'): Reservation | null => {
  const reservation = mockReservations.find(r => r._id === reservationId);
  if (!reservation) return null;
  
  const newStatus = calculateReservationStatus(reservation.guestIds);
  
  if (newStatus !== reservation.status) {
    reservation.status = newStatus;
    reservation.updatedAt = new Date().toISOString();
    reservation.lastStatusChange = new Date().toISOString();
    
    // Add to status history
    reservation.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      performedBy: 'system',
      reason
    });
    
    console.log(`🔄 Reservation ${reservationId} status updated: ${newStatus} - ${reason}`);
  }
  
  return reservation;
};

// Function to recalculate all reservations for a specific room
export const recalculateReservationsForRoom = (roomId: string, reason: string = 'Room status change'): void => {
  const roomReservations = mockReservations.filter(r => r.roomId === roomId);
  
  roomReservations.forEach(reservation => {
    recalculateReservationStatus(reservation._id, reason);
  });
  
  console.log(`🔄 Recalculated ${roomReservations.length} reservations for room ${roomId}`);
};

// Function to recalculate all reservations for a specific guest
export const recalculateReservationsForGuest = (guestId: string, reason: string = 'Guest status change'): void => {
  const guestReservations = mockReservations.filter(r => r.guestIds.includes(guestId));
  
  guestReservations.forEach(reservation => {
    recalculateReservationStatus(reservation._id, reason);
  });
  
  console.log(`🔄 Recalculated ${guestReservations.length} reservations for guest ${guestId}`);
};

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log(`📋 Generated Reservations: ${mockReservations.length}`);
  console.log(`📊 Active Reservations: ${mockReservations.filter(r => r.status === 'active').length}`);
  console.log(`✅ Completed Reservations: ${mockReservations.filter(r => r.status === 'completed').length}`);
} 