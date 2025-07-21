// Mock Reservation History Data
export interface ReservationHistoryEntry {
  id: string;
  roomId: string;
  reservationId?: string; // Link to actual reservation
  hotelId: string; // Direct hotel linking for better filtering
  timestamp: string;
  action:
    | 'status_change'
    | 'guest_assigned'
    | 'guest_removed'
    | 'guest_status_change'
    | 'reservation_created'
    | 'reservation_edited'
    | 'reservation_deleted'
    | 'check_in'
    | 'check_out'
    | 'cancellation'
    | 'no_show';
  previousState: {
    roomStatus?: string;
    guestStatus?: string;
    guestId?: string;
    guestIds?: string[];
    status?: string;
    reservationStatus?: string;
    dates?: string[] | string;
    rooms?: string;
    roomId?: string;
    price?: number;
    notes?: string;
    specialRequests?: string | string[];
  };
  newState: {
    roomStatus?: string;
    guestStatus?: string;
    guestId?: string;
    guestIds?: string[];
    status?: string;
    reservationStatus?: string;
    dates?: string[] | string;
    rooms?: string;
    roomId?: string;
    price?: number;
    notes?: string;
    specialRequests?: string | string[];
  };
  performedBy: string;
  notes?: string;
}

export const mockReservationHistory: ReservationHistoryEntry[] = [
  // AI Front Desk Hotel (65a000000000000000000001) History
  {
    id: 'HIST-001',
    roomId: '65b000000000000000000001', // Room 101
    reservationId: 'res-0001-0001',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-01T08:00:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000001', '65d000000000000000000002'],
      status: 'active',
      dates: ['2024-01-15 to 2024-01-18'],
      rooms: '65b000000000000000000001',
      price: 450,
      notes: 'Reservation for Alice Johnson and Liam in room 101'
    },
    performedBy: 'front-desk',
    notes: 'Initial reservation created for Alice Johnson party of 2',
  },
  {
    id: 'HIST-002',
    roomId: '65b000000000000000000002', // Room 102
    reservationId: 'res-0001-0002',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-01T09:15:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000003'],
      status: 'active',
      dates: ['2024-01-10 to 2024-01-15'],
      rooms: '65b000000000000000000002',
      price: 750,
      notes: 'Bob Smith reservation with late checkout'
    },
    performedBy: 'online-booking',
    notes: 'Online booking for Bob Smith - 5 nights',
  },
  {
    id: 'HIST-003',
    roomId: '65b000000000000000000003', // Room 201
    reservationId: 'res-0001-0003',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-02T14:30:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000004'],
      status: 'active',
      dates: ['2024-01-20 to 2024-01-25'],
      rooms: '65b000000000000000000003',
      price: 2000,
      notes: 'Premium deluxe reservation'
    },
    performedBy: 'front-desk',
    notes: 'Premium booking for Carol Wilson',
  },
  {
    id: 'HIST-004',
    roomId: '65b000000000000000000002', // Room 102
    reservationId: 'res-0001-0002',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-10T15:30:00Z',
    action: 'check_in',
    previousState: { guestStatus: 'booked' },
    newState: { guestStatus: 'checked-in' },
    performedBy: 'front-desk',
    notes: 'Bob Smith checked in - late arrival',
  },
  {
    id: 'HIST-005',
    roomId: '65b000000000000000000001', // Room 101  
    reservationId: 'res-0001-0001',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-15T15:00:00Z',
    action: 'check_in',
    previousState: { guestStatus: 'booked' },
    newState: { guestStatus: 'checked-in' },
    performedBy: 'front-desk',
    notes: 'Alice Johnson party checked in on time',
  },
  {
    id: 'HIST-006',
    roomId: '65b000000000000000000002', // Room 102
    reservationId: 'res-0001-0002',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-15T11:00:00Z',
    action: 'check_out',
    previousState: { guestStatus: 'checked-in' },
    newState: { guestStatus: 'checked-out' },
    performedBy: 'front-desk',
    notes: 'Bob Smith checked out - standard time',
  },
  {
    id: 'HIST-007',
    roomId: '65b000000000000000000003', // Room 201
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-16T10:15:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'occupied' },
    newState: { roomStatus: 'cleaning' },
    performedBy: 'housekeeping',
    notes: 'Room cleaning started after checkout',
  },
  {
    id: 'HIST-008',
    roomId: '65b000000000000000000003', // Room 201
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-16T14:30:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'cleaning' },
    newState: { roomStatus: 'available' },
    performedBy: 'housekeeping',
    notes: 'Room cleaning completed and ready for next guest',
  },
  {
    id: 'HIST-009',
    roomId: '65b000000000000000000004', // Room 202
    reservationId: 'res-0001-0004',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-05T11:45:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000005'],
      status: 'active',
      dates: ['2024-01-25 to 2024-01-28'],
      rooms: '65b000000000000000000004',
      price: 1200,
      notes: 'Business traveler reservation'
    },
    performedBy: 'online-booking',
    notes: 'Corporate booking for Emma Wilson',
  },
  {
    id: 'HIST-010',
    roomId: '65b000000000000000000005', // Room 203
    reservationId: 'res-0001-0005',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-06T16:20:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000006'],
      status: 'active',
      dates: ['2024-01-30 to 2024-02-02'],
      rooms: '65b000000000000000000005',
      price: 1200,
      notes: 'Weekend getaway reservation'
    },
    performedBy: 'phone-booking',
    notes: 'Phone reservation for Michael Davis',
  },

  // Seaside Resort (65a000000000000000000002) History
  {
    id: 'HIST-011',
    roomId: '65b000000000000000000010', // Room 101 Seaside
    reservationId: 'res-0002-0001',
    hotelId: '65a000000000000000000002',
    timestamp: '2024-01-03T12:00:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000008'],
      status: 'active',
      dates: ['2024-02-01 to 2024-02-05'],
      rooms: '65b000000000000000000010',
      price: 600,
      notes: 'Seaside standard room reservation'
    },
    performedBy: 'online-booking',
    notes: 'Seaside resort booking for David Chen',
  },
  {
    id: 'HIST-012',
    roomId: '65b000000000000000000011', // Room 102 Seaside
    reservationId: 'res-0002-0002',
    hotelId: '65a000000000000000000002',
    timestamp: '2024-01-04T14:15:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000009'],
      status: 'active',
      dates: ['2024-02-10 to 2024-02-14'],
      rooms: '65b000000000000000000011',
      price: 1600,
      notes: 'Valentine week seaside getaway'
    },
    performedBy: 'front-desk',
    notes: 'Romantic getaway for Jennifer Lopez',
  },
  {
    id: 'HIST-013',
    roomId: '65b000000000000000000012', // Room 103 Seaside
    reservationId: 'res-0002-0003',
    hotelId: '65a000000000000000000002',
    timestamp: '2024-01-07T09:30:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000010'],
      status: 'active',
      dates: ['2024-02-15 to 2024-02-18'],
      rooms: '65b000000000000000000012',
      price: 1350,
      notes: 'Beach vacation reservation'
    },
    performedBy: 'travel-agent',
    notes: 'Travel agency booking for Mark Johnson',
  },
  {
    id: 'HIST-014',
    roomId: '65b000000000000000000010', // Room 101 Seaside
    reservationId: 'res-0002-0001',
    hotelId: '65a000000000000000000002',
    timestamp: '2024-02-01T15:00:00Z',
    action: 'check_in',
    previousState: { guestStatus: 'booked' },
    newState: { guestStatus: 'checked-in' },
    performedBy: 'front-desk',
    notes: 'David Chen checked in for seaside stay',
  },
  {
    id: 'HIST-015',
    roomId: '65b000000000000000000013', // Room 104 Seaside
    hotelId: '65a000000000000000000002',
    timestamp: '2024-01-20T11:15:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'available' },
    newState: { roomStatus: 'maintenance' },
    performedBy: 'maintenance',
    notes: 'AC unit repair needed',
  },
  {
    id: 'HIST-016',
    roomId: '65b000000000000000000013', // Room 104 Seaside
    hotelId: '65a000000000000000000002',
    timestamp: '2024-01-21T16:45:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'maintenance' },
    newState: { roomStatus: 'available' },
    performedBy: 'maintenance',
    notes: 'AC repair completed - room ready',
  },

  // Recent activity examples
  {
    id: 'HIST-017',
    roomId: '65b000000000000000000006', // Room 301 AI Front Desk
    reservationId: 'res-0001-0006',
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-25T10:00:00Z',
    action: 'reservation_created',
    previousState: {},
    newState: { 
      guestIds: ['65d000000000000000000007'],
      status: 'active',
      dates: ['2024-02-20 to 2024-02-25'],
      rooms: '65b000000000000000000006',
      price: 3000,
      notes: 'Family suite reservation for extended stay'
    },
    performedBy: 'front-desk',
    notes: 'Premium family suite booking',
  },
  {
    id: 'HIST-018',
    roomId: '65b000000000000000000007', // Room 302 AI Front Desk
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-26T13:20:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'cleaning' },
    newState: { roomStatus: 'available' },
    performedBy: 'housekeeping',
    notes: 'Deep cleaning completed',
  },
  {
    id: 'HIST-019',
    roomId: '65b000000000000000000008', // Room 303 AI Front Desk
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-27T14:00:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'available' },
    newState: { roomStatus: 'cleaning' },
    performedBy: 'housekeeping',
    notes: 'Routine maintenance cleaning',
  },
  {
    id: 'HIST-020',
    roomId: '65b000000000000000000009', // Room 304 AI Front Desk
    hotelId: '65a000000000000000000001',
    timestamp: '2024-01-28T09:00:00Z',
    action: 'status_change',
    previousState: { roomStatus: 'available' },
    newState: { roomStatus: 'maintenance' },
    performedBy: 'maintenance',
    notes: 'Plumbing issue reported',
  }
]; 