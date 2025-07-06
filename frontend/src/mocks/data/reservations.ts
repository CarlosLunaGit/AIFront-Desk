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

// Static mock reservations data
export const mockReservations: Reservation[] = [
  // Grand Plaza Hotel Reservations
  {
    _id: 'res-0001-0001',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000001',
    guestIds: ['65d000000000000000000001', '65d000000000000000000002'],
    confirmationNumber: 'PLAZ0001',
    reservationStart: '2024-01-15T15:00:00Z',
    reservationEnd: '2024-01-18T11:00:00Z',
    checkInDate: '2024-01-15T15:00:00Z',
    checkOutDate: '2024-01-18T11:00:00Z',
    nights: 3,
    roomRate: 150,
    totalAmount: 450,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastStatusChange: '2024-01-15T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Early check-in preferred',
    notes: 'Reservation for Alice Johnson and Liam in room 101',
    source: 'direct',
    financials: {
      totalAmount: 450,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 2, roomNumber: '101' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  },
  {
    _id: 'res-0001-0002',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000002',
    guestIds: ['65d000000000000000000003'],
    confirmationNumber: 'PLAZ0002',
    reservationStart: '2024-01-10T15:00:00Z',
    reservationEnd: '2024-01-15T11:00:00Z',
    checkInDate: '2024-01-10T15:30:00Z',
    checkOutDate: '2024-01-15T11:00:00Z',
    nights: 5,
    roomRate: 150,
    totalAmount: 750,
    paidAmount: 750,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
    lastStatusChange: '2024-01-10T15:30:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Late check-out requested',
    notes: 'Reservation for Bob Smith in room 102 - Checked in',
    source: 'online',
    financials: {
      totalAmount: 750,
      paidAmount: 750,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        },
        {
          status: 'active',
          timestamp: '2024-01-10T15:30:00Z',
          performedBy: 'system',
          reason: 'Guest checked in'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '102' }
        },
        {
          action: 'check_in',
          timestamp: '2024-01-10T15:30:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000003' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      },
      {
        status: 'active',
        timestamp: '2024-01-10T15:30:00Z',
        performedBy: 'system',
        reason: 'Guest checked in'
      }
    ]
  },
  {
    _id: 'res-0001-0003',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000003',
    guestIds: ['65d000000000000000000004'],
    confirmationNumber: 'PLAZ0003',
    reservationStart: '2024-01-05T15:00:00Z',
    reservationEnd: '2024-01-08T11:00:00Z',
    checkInDate: '2024-01-05T15:30:00Z',
    checkOutDate: '2024-01-08T10:30:00Z',
    nights: 3,
    roomRate: 400,
    totalAmount: 1200,
    paidAmount: 1200,
    currency: 'USD',
    status: 'completed',
    reservationStatus: 'completed',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-08T10:30:00Z',
    lastStatusChange: '2024-01-08T10:30:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    completedAt: '2024-01-08T10:30:00Z',
    specialRequests: 'High floor preferred',
    notes: 'Reservation for Charlie Brown in room 201 - Completed',
    source: 'phone',
    financials: {
      totalAmount: 1200,
      paidAmount: 1200,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        },
        {
          status: 'active',
          timestamp: '2024-01-05T15:30:00Z',
          performedBy: 'system',
          reason: 'Guest checked in'
        },
        {
          status: 'completed',
          timestamp: '2024-01-08T10:30:00Z',
          performedBy: 'system',
          reason: 'Guest checked out'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '201' }
        },
        {
          action: 'check_in',
          timestamp: '2024-01-05T15:30:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000004' }
        },
        {
          action: 'check_out',
          timestamp: '2024-01-08T10:30:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000004' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      },
      {
        status: 'active',
        timestamp: '2024-01-05T15:30:00Z',
        performedBy: 'system',
        reason: 'Guest checked in'
      },
      {
        status: 'completed',
        timestamp: '2024-01-08T10:30:00Z',
        performedBy: 'system',
        reason: 'Guest checked out'
      }
    ]
  },
  {
    _id: 'res-0001-0004',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000004',
    guestIds: ['65d000000000000000000005'],
    confirmationNumber: 'PLAZ0004',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T15:00:00Z',
    checkOutDate: '2024-01-05T11:00:00Z',
    nights: 4,
    roomRate: 400,
    totalAmount: 1600,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastStatusChange: '2024-01-01T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Quiet room preferred',
    notes: 'Reservation for George Wilson in room 202',
    source: 'online',
    financials: {
      totalAmount: 1600,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '202' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  },
  {
    _id: 'res-0001-0005',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000005',
    guestIds: ['65d000000000000000000006'],
    confirmationNumber: 'PLAZ0005',
    reservationStart: '2024-06-25T15:00:00Z',
    reservationEnd: '2024-06-30T11:00:00Z',
    checkInDate: '2024-06-25T16:00:00Z',
    checkOutDate: '2024-06-30T11:00:00Z',
    nights: 5,
    roomRate: 400,
    totalAmount: 2000,
    paidAmount: 2000,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-06-25T00:00:00Z',
    updatedAt: '2024-06-25T16:00:00Z',
    lastStatusChange: '2024-06-25T16:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Ocean view preferred',
    notes: 'Reservation for Hannah Miller in room 203 - Checked in',
    source: 'direct',
    financials: {
      totalAmount: 2000,
      paidAmount: 2000,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-06-25T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        },
        {
          status: 'active',
          timestamp: '2024-06-25T16:00:00Z',
          performedBy: 'system',
          reason: 'Guest checked in'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-06-25T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '203' }
        },
        {
          action: 'check_in',
          timestamp: '2024-06-25T16:00:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000006' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-06-25T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      },
      {
        status: 'active',
        timestamp: '2024-06-25T16:00:00Z',
        performedBy: 'system',
        reason: 'Guest checked in'
      }
    ]
  },
  {
    _id: 'res-0001-0006',
    hotelId: '65a000000000000000000001',
    roomId: '65b000000000000000000006',
    guestIds: ['65d000000000000000000007'],
    confirmationNumber: 'PLAZ0006',
    reservationStart: '2024-08-10T15:00:00Z',
    reservationEnd: '2024-08-15T11:00:00Z',
    checkInDate: '2024-08-10T15:00:00Z',
    checkOutDate: '2024-08-15T11:00:00Z',
    nights: 5,
    roomRate: 600,
    totalAmount: 3000,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
    lastStatusChange: '2024-08-01T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Family suite with kitchenette',
    notes: 'Reservation for Ian Thompson in room 301',
    source: 'online',
    financials: {
      totalAmount: 3000,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-08-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-08-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '301' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-08-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  },
  
  // Seaside Resort Reservations
  {
    _id: 'res-0002-0001',
    hotelId: '65a000000000000000000002',
    roomId: '65b000000000000000000010',
    guestIds: ['65d000000000000000000008'],
    confirmationNumber: 'SEAS0001',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T15:00:00Z',
    checkOutDate: '2024-01-05T11:00:00Z',
    nights: 4,
    roomRate: 150,
    totalAmount: 600,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastStatusChange: '2024-01-01T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Beach view preferred',
    notes: 'Reservation for Diana Prince in room 101',
    source: 'direct',
    financials: {
      totalAmount: 600,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '101' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  },
  {
    _id: 'res-0002-0002',
    hotelId: '65a000000000000000000002',
    roomId: '65b000000000000000000011',
    guestIds: ['65d000000000000000000009'],
    confirmationNumber: 'SEAS0002',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T15:00:00Z',
    checkOutDate: '2024-01-05T11:00:00Z',
    nights: 4,
    roomRate: 400,
    totalAmount: 1600,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastStatusChange: '2024-01-01T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Balcony room preferred',
    notes: 'Reservation for Liam in room 102',
    source: 'online',
    financials: {
      totalAmount: 1600,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '102' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  },
  {
    _id: 'res-0002-0003',
    hotelId: '65a000000000000000000002',
    roomId: '65b000000000000000000012',
    guestIds: ['65d000000000000000000010'],
    confirmationNumber: 'SEAS0003',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T16:00:00Z',
    checkOutDate: '2024-01-05T11:00:00Z',
    nights: 4,
    roomRate: 450,
    totalAmount: 1800,
    paidAmount: 1800,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T16:00:00Z',
    lastStatusChange: '2024-01-01T16:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Suite with ocean view',
    notes: 'Reservation for Evan Lee in room 103 - Checked in',
    source: 'phone',
    financials: {
      totalAmount: 1800,
      paidAmount: 1800,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        },
        {
          status: 'active',
          timestamp: '2024-01-01T16:00:00Z',
          performedBy: 'system',
          reason: 'Guest checked in'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '103' }
        },
        {
          action: 'check_in',
          timestamp: '2024-01-01T16:00:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000010' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      },
      {
        status: 'active',
        timestamp: '2024-01-01T16:00:00Z',
        performedBy: 'system',
        reason: 'Guest checked in'
      }
    ]
  },
  {
    _id: 'res-0002-0004',
    hotelId: '65a000000000000000000002',
    roomId: '65b000000000000000000013',
    guestIds: ['65d000000000000000000011'],
    confirmationNumber: 'SEAS0004',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T16:00:00Z',
    checkOutDate: '2024-01-05T10:30:00Z',
    nights: 4,
    roomRate: 600,
    totalAmount: 2400,
    paidAmount: 2400,
    currency: 'USD',
    status: 'completed',
    reservationStatus: 'completed',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-05T10:30:00Z',
    lastStatusChange: '2024-01-05T10:30:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    completedAt: '2024-01-05T10:30:00Z',
    specialRequests: 'Family suite with kitchenette',
    notes: 'Reservation for Fiona Green in room 104 - Completed',
    source: 'direct',
    financials: {
      totalAmount: 2400,
      paidAmount: 2400,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        },
        {
          status: 'active',
          timestamp: '2024-01-01T16:00:00Z',
          performedBy: 'system',
          reason: 'Guest checked in'
        },
        {
          status: 'completed',
          timestamp: '2024-01-05T10:30:00Z',
          performedBy: 'system',
          reason: 'Guest checked out'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 1, roomNumber: '104' }
        },
        {
          action: 'check_in',
          timestamp: '2024-01-01T16:00:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000011' }
        },
        {
          action: 'check_out',
          timestamp: '2024-01-05T10:30:00Z',
          performedBy: 'system',
          details: { guestId: '65d000000000000000000011' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      },
      {
        status: 'active',
        timestamp: '2024-01-01T16:00:00Z',
        performedBy: 'system',
        reason: 'Guest checked in'
      },
      {
        status: 'completed',
        timestamp: '2024-01-05T10:30:00Z',
        performedBy: 'system',
        reason: 'Guest checked out'
      }
    ]
  },
  {
    _id: 'res-0002-0005',
    hotelId: '65a000000000000000000002',
    roomId: '65b000000000000000000014',
    guestIds: ['65d000000000000000000012', '65d000000000000000000013', '65d000000000000000000014'],
    confirmationNumber: 'SEAS0005',
    reservationStart: '2024-01-01T15:00:00Z',
    reservationEnd: '2024-01-05T11:00:00Z',
    checkInDate: '2024-01-01T15:00:00Z',
    checkOutDate: '2024-01-05T11:00:00Z',
    nights: 4,
    roomRate: 150,
    totalAmount: 600,
    paidAmount: 0,
    currency: 'USD',
    status: 'active',
    reservationStatus: 'active',
    bookingStatus: 'confirmed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastStatusChange: '2024-01-01T00:00:00Z',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    noShowMarkedAt: null,
    terminatedAt: null,
    specialRequests: 'Adjoining rooms preferred',
    notes: 'Reservation for Liam, Julia Anderson, and Kevin Martinez in room 201',
    source: 'online',
    financials: {
      totalAmount: 600,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: {
      statusHistory: [
        {
          status: 'active',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          reason: 'Initial reservation creation'
        }
      ],
      actions: [
        {
          action: 'create',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          details: { guestCount: 3, roomNumber: '201' }
        }
      ]
    },
    statusHistory: [
      {
        status: 'active',
        timestamp: '2024-01-01T00:00:00Z',
        performedBy: 'system',
        reason: 'Initial reservation creation'
      }
    ]
  }
];

// Helper function to calculate nights between dates
const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// Function to recalculate reservation status when guest status changes
export const recalculateReservationStatus = (reservationId: string, reason: string = 'Guest status change'): Reservation | null => {
  const reservation = mockReservations.find(r => r._id === reservationId);
  if (!reservation) return null;
  
  // Get all guests for this reservation
  const guests = mockGuests.filter(g => reservation.guestIds.includes(g._id));
  
  // Determine new status based on guest statuses
  const hasCheckedIn = guests.some(g => g.status === 'checked-in');
  const allCheckedOut = guests.every(g => g.status === 'checked-out');
  const hasBooked = guests.some(g => g.status === 'booked');
  
  let newStatus: 'active' | 'completed' = 'active';
  if (allCheckedOut) {
    newStatus = 'completed';
  } else if (hasCheckedIn || hasBooked) {
    newStatus = 'active';
  }
  
  if (newStatus !== reservation.status) {
    reservation.status = newStatus;
    reservation.reservationStatus = newStatus;
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
  console.log(`📋 Static Reservations: ${mockReservations.length}`);
  console.log(`📊 Active Reservations: ${mockReservations.filter(r => r.status === 'active').length}`);
  console.log(`✅ Completed Reservations: ${mockReservations.filter(r => r.status === 'completed').length}`);
} 