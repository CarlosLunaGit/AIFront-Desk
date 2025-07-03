// TypeScript fixes applied for room.assignedGuests logic
import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import type { Room, RoomAction, RoomStats, RoomStatus } from '../types/room';
import type { HotelConfigDocument, HotelConfigFormData } from '../types/hotel';
import { mockHotels, SIMULATE_NEW_USER } from './data/hotels';
import { mockRooms } from './data/rooms';

// Mock Communications (matching backend structure)
const mockCommunications: any[] = [
  {
    _id: '65b000000000000000000001',
    guestId: '65d000000000000000000001',
    hotelId: '65a000000000000000000001',
    content: 'Hello, I would like to check in early',
    channel: 'whatsapp',
    type: 'inbound',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    _id: '65b000000000000000000002',
    guestId: '65d000000000000000000001',
    hotelId: '65a000000000000000000001',
    content: 'Of course! We can accommodate early check-in at 1 PM. Would that work for you?',
    channel: 'whatsapp',
    type: 'outbound',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  }
];



// Mock room types for the new backend schema
const mockRoomTypes = [
  // AI Front Desk Hotel room types
  {
    _id: 'roomtype-std-001',
    name: 'Standard Room',
    description: 'Comfortable standard room with essential amenities',
    baseRate: 150,
    capacity: {
      adults: 2,
      children: 0,
      total: 2
    },
    features: ['feature-1', 'feature-3'], // References to hotel features
    amenities: ['coffee-maker', 'hair-dryer'],
    hotelId: '65a000000000000000000001', // Reference to AI Front Desk Hotel
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'roomtype-dlx-001', 
    name: 'Deluxe Room',
    description: 'Spacious deluxe room with premium amenities',
    baseRate: 250,
    capacity: {
      adults: 2,
      children: 1,
      total: 2
    },
    features: ['feature-1', 'feature-3', 'feature-13', 'feature-14'], // WiFi, AC, Balcony, Minibar
    amenities: ['coffee-maker', 'hair-dryer', 'bathrobes', 'slippers'],
    hotelId: '65a000000000000000000001',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'roomtype-ste-001',
    name: 'Family Suite',
    description: 'Large family suite with separate living area',
    baseRate: 450,
    capacity: {
      adults: 4,
      children: 2,
      total: 4
    },
    features: ['feature-1', 'feature-3', 'feature-13', 'feature-14'], // WiFi, AC, Balcony, Minibar
    amenities: ['coffee-maker', 'hair-dryer', 'bathrobes', 'slippers', 'kitchenette'],
    hotelId: '65a000000000000000000001',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  // Seaside Resort room types
  {
    _id: 'roomtype-ocean-001',
    name: 'Ocean View Room',
    description: 'Room with beautiful ocean views',
    baseRate: 300,
    capacity: {
      adults: 2,
      children: 1,
      total: 2
    },
    features: ['feature-beach-2'], // Ocean view
    amenities: ['beach-towels', 'sun-screen'],
    hotelId: '65b000000000000000000002', // Reference to Seaside Resort
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'roomtype-ocean-ste-001',
    name: 'Ocean Suite',
    description: 'Luxury suite with panoramic ocean views',
    baseRate: 600,
    capacity: {
      adults: 4,
      children: 2,
      total: 4
    },
    features: ['feature-beach-2'], // Ocean view
    amenities: ['beach-towels', 'sun-screen', 'jacuzzi', 'champagne'],
    hotelId: '65b000000000000000000002',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockRoomActions: RoomAction[] = [
  {
    id: '1',
    roomId: '2',
    type: 'cleaning',
    status: 'pending',
    requestedBy: 'ai',
    requestedAt: '2024-03-09T09:00:00Z',
    notes: 'Requested by AI based on guest check-out time',
  },
];

const mockRoomStats: RoomStats = {
  total: 50,
  available: 30,
  occupied: 15,
  maintenance: 2,
  cleaning: 3,
  reserved: 0,
  byType: {
    standard: 30,
    deluxe: 15,
    suite: 4,
    presidential: 1,
  },
  byFloor: {
    1: 10,
    2: 10,
    3: 10,
    4: 10,
    5: 10,
  },
  occupancyRate: 0.3,
  averageStayDuration: 2.5,
};

// Request interfaces for API handlers
interface RoomActionRequest {
  roomId: string;
  type: RoomAction['type'];
  notes?: string;
}

interface SetCurrentConfigRequest {
  configId: string;
}

// Track the current configuration
let currentConfigId = 'mock-hotel-1';

// Mock guest data  
const mockGuests = [
  // Grand Plaza Hotel (65a000000000000000000001)
  {
    _id: '65d000000000000000000001',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1 (555) 111-2222',
    status: 'booked',
    roomId: '65b000000000000000000001',
    reservationStart: '2024-07-01T15:00:00',
    reservationEnd: '2024-07-05T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000002',
    name: 'Liam (Room 101)',
    email: 'liam@example.com',
    phone: '+1 (555) 111-2223',
    status: 'booked',
    roomId: '65b000000000000000000001',
    reservationStart: '2024-07-01T15:00:00',
    reservationEnd: '2024-07-05T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: false,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000003',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    phone: '+1 (555) 333-4444',
    status: 'checked-in',
    roomId: '65b000000000000000000002',
    reservationStart: '2024-06-10T15:00:00',
    reservationEnd: '2024-06-15T11:00:00',
    checkIn: '2024-06-10T16:00:00',
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: true,
    createdAt: '2024-06-10T00:00:00Z',
    updatedAt: '2024-06-10T16:00:00Z'
  },
  {
    _id: '65d000000000000000000004',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '+1 (555) 777-8888',
    status: 'checked-out',
    roomId: '65b000000000000000000003',
    reservationStart: '2024-05-20T15:00:00',
    reservationEnd: '2024-05-25T11:00:00',
    checkIn: '2024-05-20T15:30:00',
    checkOut: '2024-05-25T10:00:00',
    hotelId: '65a000000000000000000001',
    keepOpen: false,
    createdAt: '2024-05-20T00:00:00Z',
    updatedAt: '2024-05-25T10:00:00Z'
  },
  // Seaside Resort (65b000000000000000000002)
  {
    _id: '65d000000000000000000008',
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    phone: '+1 (555) 222-3333',
    status: 'booked',
    roomId: 'room-301',
    reservationStart: '2024-08-01T15:00:00',
    reservationEnd: '2024-08-05T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: true,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000009',
    name: 'Liam (Room 301)',
    email: 'liam2@example.com',
    phone: '+1 (555) 222-3334',
    status: 'booked',
    roomId: 'room-301',
    reservationStart: '2024-08-01T15:00:00',
    reservationEnd: '2024-08-05T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: false,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000010',
    name: 'Evan Lee',
    email: 'evan.lee@example.com',
    phone: '+1 (555) 444-5555',
    status: 'checked-in',
    roomId: 'room-302',
    reservationStart: '2024-07-10T15:00:00',
    reservationEnd: '2024-07-15T11:00:00',
    checkIn: '2024-07-10T16:00:00',
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: true,
    createdAt: '2024-07-10T00:00:00Z',
    updatedAt: '2024-07-10T16:00:00Z'
  },
  {
    _id: '65d000000000000000000011',
    name: 'Fiona Green',
    email: 'fiona.green@example.com',
    phone: '+1 (555) 666-7777',
    status: 'checked-out',
    roomId: 'room-401',
    reservationStart: '2024-06-20T15:00:00',
    reservationEnd: '2024-06-25T11:00:00',
    checkIn: '2024-06-20T15:30:00',
    checkOut: '2024-06-25T10:00:00',
    hotelId: '65b000000000000000000002',
    keepOpen: false,
    createdAt: '2024-06-20T00:00:00Z',
    updatedAt: '2024-06-25T10:00:00Z'
  },
  {
    _id: '65d000000000000000000012',
    name: 'Liam (Room 401)',
    email: 'liam3@example.com',
    phone: '+1 (555) 666-7778',
    status: 'booked',
    roomId: 'room-401',
    reservationStart: '2024-06-20T15:00:00',
    reservationEnd: '2024-06-25T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: false,
    createdAt: '2024-06-20T00:00:00Z',
    updatedAt: '2024-06-20T00:00:00Z'
  },
  {
    _id: '65d000000000000000000005',
    name: 'George Wilson',
    email: 'george.wilson@example.com',
    phone: '+1 (555) 888-9999',
    status: 'booked',
    roomId: '65b000000000000000000004',
    reservationStart: '2024-07-15T15:00:00',
    reservationEnd: '2024-07-20T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: true,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000006',
    name: 'Hannah Miller',
    email: 'hannah.miller@example.com',
    phone: '+1 (555) 999-0000',
    status: 'checked-in',
    roomId: '65b000000000000000000005',
    reservationStart: '2024-06-25T15:00:00',
    reservationEnd: '2024-06-30T11:00:00',
    checkIn: '2024-06-25T16:00:00',
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: true,
    createdAt: '2024-06-25T00:00:00Z',
    updatedAt: '2024-06-25T16:00:00Z'
  },
  {
    _id: '65d000000000000000000007',
    name: 'Ian Thompson',
    email: 'ian.thompson@example.com',
    phone: '+1 (555) 000-1111',
    status: 'booked',
    roomId: 'room-302',
    reservationStart: '2024-08-10T15:00:00',
    reservationEnd: '2024-08-15T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65a000000000000000000001',
    keepOpen: true,
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000013',
    name: 'Julia Anderson',
    email: 'julia.anderson@example.com',
    phone: '+1 (555) 111-2222',
    status: 'booked',
    roomId: 'room-501',
    reservationStart: '2024-08-20T15:00:00',
    reservationEnd: '2024-08-25T11:00:00',
    checkIn: null,
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: true,
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z'
  },
  {
    _id: '65d000000000000000000014',
    name: 'Kevin Martinez',
    email: 'kevin.martinez@example.com',
    phone: '+1 (555) 222-3333',
    status: 'checked-in',
    roomId: 'room-502',
    reservationStart: '2024-07-20T15:00:00',
    reservationEnd: '2024-07-25T11:00:00',
    checkIn: '2024-07-20T16:00:00',
    checkOut: null,
    hotelId: '65b000000000000000000002',
    keepOpen: true,
    createdAt: '2024-07-20T00:00:00Z',
    updatedAt: '2024-07-20T16:00:00Z'
  }
];

// Sync assignedGuests for all rooms on startup
mockRooms.forEach(room => {
        room.assignedGuests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId).map(g => g._id);
});

// Initialize mock arrays for reservations and history
const mockReservations: any[] = [];
const reservationHistory: any[] = [];

// Generate aligned mockReservations and reservationHistory from mockGuests and mockRooms
// Only run this if we have rooms and guests but no reservations yet
function generateMockReservationsAndHistory() {
  if (mockReservations.length === 0 && mockRooms.length > 0 && mockGuests.length > 0) {
    let reservationCount = 1;
    const reservations: any[] = [];
    const history: any[] = [];
    
    // For each room, collect all guests assigned to it by roomId and hotelId
    mockRooms.forEach(room => {
      const guests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
      if (guests.length === 0) return;
      
      const guestIds = guests.map(g => g._id);
      const startDates = guests.map(g => g.reservationStart);
      const endDates = guests.map(g => g.reservationEnd);
      const getEarliestDate = (dates: string[]) => dates.filter(Boolean).sort()[0] || '';
      const getLatestDate = (dates: string[]) => dates.filter(Boolean).sort().slice(-1)[0] || '';
      
      // Determine business status based on guest statuses
      const hasCheckedIn = guests.some(g => g.status === 'checked-in');
      const hasCheckedOut = guests.some(g => g.status === 'checked-out');
      const allBooked = guests.every(g => g.status === 'booked');
      const allCheckedOut = guests.every(g => g.status === 'checked-out');
      
      console.log('🏨 Reservation generation for room:', room.number, 'guests:', guests.map(g => `${g.name}(${g.status})`).join(', '));
      console.log('📊 Status analysis:', { hasCheckedIn, hasCheckedOut, allBooked, allCheckedOut });
      
      let reservationStatus: 'active' | 'cancelled' | 'no-show' | 'terminated' | 'completed';
      if (allCheckedOut) {
        // If ALL guests have checked out, mark as completed
        reservationStatus = 'completed';
        console.log('✅ Setting reservation to COMPLETED - all guests checked out');
      } else if (hasCheckedOut && !hasCheckedIn) {
        // If some have checked out but none checked in, mark as completed
        reservationStatus = 'completed';
        console.log('✅ Setting reservation to COMPLETED - guests checked out, none checked in');
      } else if (hasCheckedIn) {
        reservationStatus = 'active';
        console.log('🟡 Setting reservation to ACTIVE - some guests checked in');
      } else if (allBooked) {
        reservationStatus = 'active';
        console.log('🟡 Setting reservation to ACTIVE - all guests booked');
      } else {
        reservationStatus = 'active';
        console.log('🟡 Setting reservation to ACTIVE - default fallback');
      }

      // Generate confirmation number
      const confirmationNumber = `${room.hotelId?.slice(-4) || 'HTLX'}${String(reservationCount).padStart(4, '0')}`;
      
      const basePrice = 100 * guestIds.length;
      const now = new Date().toISOString();
      
      const reservation = {
        id: `mock-res-${reservationCount++}`,
        hotelId: room.hotelId,
        rooms: room._id,
        guestIds,
        dates: `${getEarliestDate(startDates)} to ${getLatestDate(endDates)}`,
        price: basePrice,
        
        // Legacy status for compatibility
        status: 'booked',
        
        // New business fields
        reservationStatus,
        confirmationNumber,
        
        // Financial tracking
        financials: {
          totalAmount: basePrice,
          paidAmount: 0,
          refundAmount: 0,
          cancellationFee: 0,
          currency: 'USD',
          paymentMethod: 'credit_card',
          paymentStatus: 'pending',
          transactions: []
        },
        
        // Audit trail
        audit: {
          statusHistory: [
            {
              status: reservationStatus,
              timestamp: now,
              performedBy: 'system',
              reason: 'Initial reservation creation'
            }
          ],
          actions: [
            {
              action: 'create',
              timestamp: now,
              performedBy: 'system',
              details: {
                guestCount: guestIds.length,
                roomNumber: room.number
              }
            }
          ]
        },
        
        // Business-specific fields
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        noShowMarkedAt: null,
        terminatedAt: null,
        
        notes: `Generated reservation for ${guests.map(g => g.name).join(', ')}`,
        createdAt: now,
        updatedAt: now
      };
      
      reservations.push(reservation);
      console.log('🏨 Generated reservation:', reservation.id, 'for room:', room.number, 'guests:', guests.map(g => g.name).join(', '));
      
      // Add a reservation_created action for this reservation
      history.push({
        id: `mock-history-${reservation.id}`,
        roomId: room._id,
        timestamp: now,
        action: 'reservation_created',
        previousState: {},
        newState: { guestIds: Array.from(new Set(guestIds)) },
        performedBy: 'System',
        notes: 'Auto-generated from guest assignments',
      });
    });
    
    // Update the module-level arrays
    mockReservations.push(...reservations);
    reservationHistory.push(...history);
    console.log('📋 Total reservations generated:', reservations.length);
  }
  
  return { reservations: mockReservations, history: reservationHistory };
}

const { reservations: finalMockReservations, history: finalReservationHistory } = generateMockReservationsAndHistory();

// Mock handlers
export const handlers: HttpHandler[] = [

  

  // Room endpoints  

  // Room actions endpoints
  http.get('/api/rooms/actions', () => {
    console.log('Debug Rooms /api/rooms/actions Line 991');
    return HttpResponse.json(mockRoomActions);
  }),

  http.post('/api/rooms/actions', async ({ request }: any) => {
    console.log('Debug Rooms /api/rooms/actions Line 996');
    const action = await request.json() as RoomActionRequest;
    const newAction: RoomAction = {
      id: Date.now().toString(),
      ...action,
      status: 'pending',
      requestedBy: 'staff',
      requestedAt: new Date().toISOString(),
    };
    mockRoomActions.push(newAction);
    return HttpResponse.json(newAction);
  }),

  http.patch('/api/rooms/actions/:id', async ({ params, request }: any) => {
    console.log('Debug Rooms /api/rooms/actions/:id Line 1010');
    const action = mockRoomActions.find(a => a.id === params.id);
    if (!action) {
      return new HttpResponse(null, { status: 404 });
    }

    const updates = await request.json() as Partial<RoomAction>;
    const updatedAction: RoomAction = { ...action, ...updates };
    const index = mockRoomActions.findIndex(a => a.id === params.id);
    mockRoomActions[index] = updatedAction;

    return HttpResponse.json(updatedAction);
  }),

  http.post('/api/rooms/:id/assign', async ({ params, request }) => {
    console.log('Debug Rooms /api/rooms/:id/assign Line 1025');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = await request.json() as { guestId: string };
    if (!body || typeof body.guestId !== 'string') {
      return new HttpResponse('Missing or invalid guestId', { status: 400 });
    }
    // Log the guest assignment
    // Add guest to assignedGuests if not already present - Fixed TypeScript errors
    room.assignedGuests = room.assignedGuests || [];
    if (!room.assignedGuests.includes(body.guestId)) {
      room.assignedGuests.push(body.guestId);
    }
    
    // Update status based on capacity and assigned guests
    const assignedCount = room.assignedGuests?.length || 0;
    if (assignedCount === 0) {
      room.status = 'available' as RoomStatus;
    } else if (assignedCount < (room.capacity || 1)) {
      room.status = (room.status.startsWith('occupied') ? 'partially-occupied' : 'partially-reserved') as RoomStatus;
    } else {
      room.status = (room.status.startsWith('reserved') ? 'reserved' : 'occupied') as RoomStatus;
    }
    return HttpResponse.json(room);
  }),

  

  // Mock GET /api/hotel/config
  // http.get('/api/hotel/config', () => {
  //   console.log('Debug Hotel Config /api/hotel/config Line 1057');
  //   return HttpResponse.json(mockHotelConfigs);
  // }),

  // // Mock GET /api/hotel/config/:id
  // http.get('/api/hotel/config/:id', ({ params }: any) => {
  //   console.log('Debug Hotel Config /api/hotel/config/:id Line 1063');
  //   if (params.id === 'current') {
  //     const currentConfig = mockHotelConfigs.find(config => config.id === currentConfigId);
  //     if (!currentConfig) {
  //       return new HttpResponse(null, { status: 404 });
  //     }
  //     return HttpResponse.json(currentConfig);
  //   }
  //   const config = mockHotelConfigs.find(config => config.id === params.id);
  //   if (!config) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
  //   return HttpResponse.json(config);
  // }),

  // Mock POST /api/hotel/config
  // http.post('/api/hotel/config', async ({ request }: any) => {
  //   console.log('Debug Hotel Config /api/hotel/config Line 1080');
  //   const data = await request.json() as HotelConfigFormData;
  //   const newConfig: HotelConfigDocument = {
  //     id: `mock-hotel-${mockHotelConfigs.length + 1}`,
  //     ...data,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     ownerId: 'owner-1',
  //     isActive: true,
  //   } as HotelConfigDocument;
  //   mockHotelConfigs.push(newConfig);
  //   return HttpResponse.json(newConfig);
  // }),

  // Mock PATCH /api/hotel/config/:id
  // http.patch('/api/hotel/config/:id', async ({ params, request }: any) => {
  //   console.log('Debug Hotel Config /api/hotel/config/:id Line 1096');
  //   const config = mockHotelConfigs.find(config => config.id === params.id);
  //   if (!config) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
  //   const updates = await request.json() as Partial<HotelConfigFormData>;
  //   const updatedConfig = {
  //     ...config,
  //     ...updates,
  //     updatedAt: new Date(),
  //   } as HotelConfigDocument;
  //   const index = mockHotelConfigs.findIndex(c => c.id === params.id);
  //   mockHotelConfigs[index] = updatedConfig;
  //   return HttpResponse.json(updatedConfig);
  // }),

  // Mock POST /api/hotel/config/current
  // http.post('/api/hotel/config/current', async ({ request }: any) => {
  //   console.log('Debug Hotel Config /api/hotel/config/current Line 1114');
  //   const { configId } = await request.json() as SetCurrentConfigRequest;
  //   const config = mockHotelConfigs.find(config => config.id === configId);
  //   if (!config) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
  //   currentConfigId = configId;
  //   return HttpResponse.json(config);
  // }),

  http.post('/api/rooms/bulk', async ({ request }) => {
    console.log('Debug Rooms /api/rooms/bulk Line 1125');
    const data = await request.json();
    if (!Array.isArray(data)) {
      return new HttpResponse('Invalid payload', { status: 400 });
    }
    const createdRooms = data.map((room) => {
      const newRoom = ensureRoomDefaults({
        id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        number: typeof room.number === 'string' ? room.number : '',
        typeId: typeof room.typeId === 'string' ? room.typeId : '',
        floorId: typeof room.floorId === 'string' ? room.floorId : '',
        status: typeof room.status === 'string' ? room.status : 'available',
        features: Array.isArray(room.features) ? room.features : [],
        capacity: typeof room.capacity === 'number' ? room.capacity : 1,
        rate: typeof room.rate === 'number' ? room.rate : 0,
        notes: typeof room.notes === 'string' ? room.notes : '',
        hotelId: currentConfigId,
        assignedGuests: [],
      });
      mockRooms.push(newRoom);
      return newRoom;
    });
    return HttpResponse.json(createdRooms, { status: 201 });
  }),

  // Guests endpoints
  http.get('/api/hotel/guests', () => {
    console.log('Debug Guests /api/hotel/guests Line 1152');
    return HttpResponse.json(mockGuests.filter(g => g.hotelId === currentConfigId));
  }),
  http.get('/api/hotel/guests/:id', ({ params }) => {
    console.log('Debug Guests /api/hotel/guests/:id Line 1157');
    const guest = mockGuests.find(g => g._id === params.id && g.hotelId === currentConfigId);
    if (!guest) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(guest);
  }),
  http.post('/api/hotel/guests', async ({ request }) => {
    console.log('Debug Guests /api/hotel/guests Line 1164');
    const guestData = await request.json() as any;
    const newGuest = {
      _id: `guest-${Date.now()}`,
      ...guestData,
      hotelId: currentConfigId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockGuests.push(newGuest);
    
    // Update room status based on new guest assignment
    recalculateRoomStatus(mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest assignment');
    
    return HttpResponse.json(newGuest);
  }),
  http.patch('/api/hotel/guests/:id', async ({ params, request }) => {
    console.log('Debug Guests /api/hotel/guests/:id Line 1181');
    const updates = await request.json() as any;
    const guest = mockGuests.find(g => g._id === params.id);
    if (!guest) {
      return new HttpResponse(null, { status: 404 });
    }

    Object.assign(guest, updates, { updatedAt: new Date().toISOString() });
    
    // Update room status based on guest status change
    recalculateRoomStatus(mockRooms.find(r => r._id === guest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest status change');
    
    return HttpResponse.json(guest);
  }),
  http.delete('/api/hotel/guests/:id', ({ params }) => {
    console.log('Debug Guests /api/hotel/guests/:id Line 1196');
    const idx = mockGuests.findIndex(g => g._id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Remove guest from rooms before deleting - Fix line 2112
    mockRooms.forEach(r => {
      if (r.assignedGuests) {
        r.assignedGuests = r.assignedGuests.filter((gid: string) => gid !== params.id);
      }
    });
    
    mockGuests.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('/api/rooms/:id/maintenance', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/maintenance Line 1214');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    room.status = 'maintenance';
    return HttpResponse.json(room);
  }),

  http.post('/api/rooms/:id/terminate', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/terminate Line 1221');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    // Remove all assigned guests from this room and delete them
    const guestsToRemove = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
    guestsToRemove.forEach(g => {
      const idx = mockGuests.findIndex(gg => gg._id === g._id);
      if (idx !== -1) mockGuests.splice(idx, 1);
    });
    room.assignedGuests = [];
    room.status = 'available';
    (room as Room).keepOpen = false;
    return HttpResponse.json(room);
  }),

  // Get all reservation history
  http.get('/api/reservation-history', () => {
    console.log('Debug Reservation History /api/reservation-history Line 1239');
    // Get current hotel ID from the global state
    let currentHotelId: string = '';
    if (currentConfigId === 'mock-hotel-1') {
      currentHotelId = '65a000000000000000000001';
    } else if (currentConfigId === 'mock-hotel-2') {
      currentHotelId = '65b000000000000000000002';
    }
    
    // If no hotel ID found, return empty array
    if (!currentHotelId) {
      console.log('📋 No current hotel ID found, returning empty history');
      return HttpResponse.json([]);
    }
    
    // Filter history by rooms that belong to the current hotel
    const roomIdsForHotel = mockRooms.filter(r => r.hotelId === currentHotelId).map(r => r._id);
    const filtered = finalReservationHistory.filter((h: any) => roomIdsForHotel.includes(h.roomId));
    
    console.log('📋 Reservation History - Current Hotel ID:', currentHotelId);
    console.log('📋 Room IDs for Hotel:', roomIdsForHotel);
    console.log('📋 Total History Entries:', finalReservationHistory.length);
    console.log('📋 Filtered History Entries:', filtered.length);
    
    return HttpResponse.json(filtered);
  }),

  // Get room-specific reservation history
  http.get('/api/reservation-history/room/:roomId', ({ params }) => {
    console.log('Debug Reservation History /api/reservation-history/room/:roomId Line 1267');
    const roomId = typeof params.roomId === 'string' ? params.roomId : undefined;
    if (!roomId) {
      return new HttpResponse('Invalid room ID', { status: 400 });
    }
    return HttpResponse.json(finalReservationHistory.filter((h: any) => h.roomId === roomId));
  }),

  // Room status change handler
  http.patch('/api/rooms/:id/status', async ({ params, request }) => {
    console.log('Debug Rooms /api/rooms/:id/status Line 1278');
    const roomId = typeof params.id === 'string' ? params.id : undefined;
    if (!roomId) {
      return new HttpResponse('Invalid room ID', { status: 400 });
    }
    const room = mockRooms.find(r => r._id === roomId);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = await request.json() as { status: RoomStatus };
    if (!body || typeof body.status !== 'string' || !['available', 'occupied', 'maintenance', 'cleaning', 'reserved', 'partially-reserved', 'partially-occupied'].includes(body.status)) {
      return new HttpResponse('Invalid status', { status: 400 });
    }
    room.status = body.status;
    // Log the status change
    recalculateRoomStatus(room, 'system', 'Status updated via API');
    return HttpResponse.json(room);
  }),

  // Guest removal handler
  http.delete('/api/rooms/:id/guests/:guestId', async ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/guests/:guestId Line 1299');
    const roomId = typeof params.id === 'string' ? params.id : undefined;
    const guestId = typeof params.guestId === 'string' ? params.guestId : undefined;
    if (!roomId || !guestId) {
      return new HttpResponse('Invalid room or guest ID', { status: 400 });
    }
    const room = mockRooms.find(r => r._id === roomId);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    // ... rest of existing removal logic ...
    return HttpResponse.json(room);
  }),

  // Set room to cleaning
  http.patch('/api/rooms/:id/cleaning', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/cleaning Line 1315');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    // Only allow if not already cleaning
    if (room.status === 'cleaning') {
      return new HttpResponse('Room is already being cleaned', { status: 400 });
    }
    room.status = 'cleaning';
    recalculateRoomStatus(room, 'system', 'Room set to cleaning via API');
    return HttpResponse.json(room);
  }),

  // Reservation endpoints
  http.get('/api/reservations', () => {
    console.log('Debug Reservations /api/reservations Line 1329');
    // Return all reservations - filtering will be done on frontend based on current hotel
    console.log('📋 Reservations endpoint called, returning all reservations:', finalMockReservations.length);
    return HttpResponse.json(finalMockReservations);
  }),

  // PATCH /api/reservations/:id - Handle business actions (cancel, no-show, terminate, etc.)
  http.patch('/api/reservations/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/:id Line 1337');
    const reservationId = params.id as string;
    const idx = finalMockReservations.findIndex((r: any) => r.id === reservationId);
    
    if (idx === -1) {
      console.log('❌ Reservation not found:', reservationId);
      return new HttpResponse(JSON.stringify({ error: 'Reservation not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = finalMockReservations[idx];
    const now = new Date().toISOString();
    
    console.log('🎯 Processing reservation action:', reservationId, 'action:', safeData.action, 'data:', safeData);
    
    // Handle business actions
    if (safeData.action) {
      // Initialize audit trail if needed
      if (!reservation.audit) {
        reservation.audit = { statusHistory: [], actions: [] };
      }
      
      // Record the action
      reservation.audit.actions.push({
        action: safeData.action,
        timestamp: now,
        performedBy: safeData.performedBy || 'hotel-staff',
        details: {
          previousStatus: reservation.reservationStatus,
          reason: safeData.reason || `${safeData.action} action performed`
        }
      });
      
      // Handle specific business actions
      switch (safeData.action) {
        case 'cancel':
          reservation.reservationStatus = 'cancelled';
          reservation.cancelledAt = now;
          reservation.cancelledBy = safeData.cancelledBy || 'hotel';
          reservation.cancellationReason = safeData.cancellationReason || safeData.reason || 'Cancelled by hotel';
          
          // Update financials with cancellation fee if provided
          if (safeData.cancellationFee !== undefined) {
            if (!reservation.financials) reservation.financials = { totalAmount: 0 };
            reservation.financials.cancellationFee = safeData.cancellationFee;
            reservation.financials.refundAmount = (reservation.financials.totalAmount || 0) - safeData.cancellationFee;
          }
          break;
          
        case 'no-show':
          reservation.reservationStatus = 'no-show';
          reservation.noShowMarkedAt = now;
          reservation.noShowReason = safeData.reason || 'Guest did not arrive';
          break;
          
        case 'terminate':
          reservation.reservationStatus = 'terminated';
          reservation.terminatedAt = now;
          reservation.terminationReason = safeData.reason || 'Early termination by hotel';
          break;
          
        case 'complete':
          reservation.reservationStatus = 'completed';
          reservation.completedAt = now;
          break;
          
        case 'delete':
          // For delete action, we'll handle it separately below
          break;
      }
      
      // Update status history
      reservation.audit.statusHistory.push({
        status: reservation.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'hotel-staff',
        reason: safeData.reason || `${safeData.action} action performed`
      });
    }
    
    // Apply any other updates
    Object.assign(reservation, { ...safeData, updatedAt: now });
    
    console.log('✅ Updated reservation:', reservation.id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),

  // DELETE /api/reservations/:id - Remove reservation from system
  http.delete('/api/reservations/:id', ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/:id Line 1431');
    const reservationId = params.id as string;
    const idx = finalMockReservations.findIndex((r: any) => r.id === reservationId);
    
    if (idx === -1) {
      console.log('❌ Reservation not found for deletion:', reservationId);
      return new HttpResponse(JSON.stringify({ error: 'Reservation not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const reservation = finalMockReservations[idx];
    
    // Extract reason from query parameters
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || 'Removed from system';
    
    console.log('🗑️ Deleting reservation from system:', reservationId, 'Reason:', reason);
    
    // Add deletion to reservation history BEFORE removing the reservation
    finalReservationHistory.push({
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId: reservation.rooms,
      timestamp: new Date().toISOString(),
      action: 'reservation_deleted' as const,
      previousState: {
        guestIds: reservation.guestIds,
        dates: [reservation.dates],
        rooms: reservation.rooms,
        status: reservation.reservationStatus || 'active',
        price: reservation.totalPrice,
        notes: reservation.notes
      },
      newState: {
        guestIds: [],
        dates: [],
        rooms: '',
        status: 'deleted',
        price: 0,
        notes: ''
      },
      performedBy: 'hotel-staff',
      notes: reason // Use the custom reason instead of hardcoded message
    });
    
    console.log('📝 Added deletion to reservation history with reason:', reason);
    console.log('📋 History entry created:', finalReservationHistory[finalReservationHistory.length - 1]);
    
    // Clear room assignments for associated guests
    if (Array.isArray(reservation.guestIds)) {
      reservation.guestIds.forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          guest.roomId = '';
          guest.keepOpen = false;
          console.log('🧹 Cleared room assignment for guest:', guest.name);
        }
      });
    }
    
    // Remove reservation from array
    finalMockReservations.splice(idx, 1);
    
    console.log('✅ Reservation deleted successfully:', reservationId);
    return HttpResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
  }),

  http.post('/api/reservations', async ({ request }) => {
    console.log('Debug Reservations /api/reservations Line 1499');
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    // Create new guests if needed
    let guestIds = Array.isArray(safeData.guestIds) ? safeData.guestIds : [];
    if (Array.isArray(safeData.newGuests)) {
      safeData.newGuests.forEach((g: any) => {
        const newGuestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        mockGuests.push({
          _id: newGuestId,
          name: g.name,
          email: g.email || '',
          phone: g.phone || '',
          status: 'booked',
          roomId: safeData.rooms || '',
          reservationStart: safeData.dates.split(' to ')[0],
          reservationEnd: safeData.dates.split(' to ')[1],
          checkIn: null,
          checkOut: null,
          hotelId: currentConfigId,
          keepOpen: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        guestIds.push(newGuestId);
      });
    }
    const price = typeof safeData.price === 'number' ? safeData.price : Number(safeData.price);
    const newReservation = {
      id: `R-${(finalMockReservations.length + 1).toString().padStart(3, '0')}`,
      guestIds,
      guests: guestIds.map(id => mockGuests.find(g => g._id === id)?.name || ''),
      rooms: safeData.rooms || '',
      dates: safeData.dates || '',
      status: safeData.status || 'Pending',
      notes: safeData.notes || '',
      price: !isNaN(price) ? price : 0,
      createdDate: new Date().toISOString().split('T')[0],
    };
    finalMockReservations.push(newReservation);
    // Update guests' reservation info
    guestIds.forEach((gid: string) => {
      const guest = mockGuests.find(g => g._id === gid);
      if (guest) {
        guest.roomId = newReservation.rooms;
        guest.reservationStart = newReservation.dates.split(' to ')[0];
        guest.reservationEnd = newReservation.dates.split(' to ')[1];
      }
    });
    // Add to reservation history: reservation_created
    finalReservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: newReservation.rooms,
      timestamp: new Date().toISOString(),
      action: 'reservation_created',
      previousState: {},
      newState: { guestIds: newReservation.guestIds },
      performedBy: 'system',
      notes: 'Reservation created via API',
    });
    return HttpResponse.json(newReservation, { status: 201 });
  }),
  http.patch('/api/hotel/reservations/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 1563');
    const idx = finalMockReservations.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = finalMockReservations[idx];
    const now = new Date().toISOString();
    
    // Handle business actions
    if (safeData.reservationStatus && safeData.reservationStatus !== reservation.reservationStatus) {
      // Update audit trail
      if (!reservation.audit) {
        reservation.audit = { statusHistory: [], actions: [] };
      }
      
      reservation.audit.statusHistory.push({
        status: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        reason: safeData.reason || 'Status updated'
      });
      
      reservation.audit.actions.push({
        action: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        details: {
          previousStatus: reservation.reservationStatus,
          newStatus: safeData.reservationStatus,
          reason: safeData.reason
        }
      });
      
      // Handle specific business status updates
      if (safeData.reservationStatus === 'cancelled') {
        reservation.cancelledAt = now;
        reservation.cancelledBy = safeData.cancelledBy || 'hotel';
        reservation.cancellationReason = safeData.cancellationReason || safeData.reason;
        
        // Update financials with cancellation fee
        if (safeData.cancellationFee !== undefined) {
          reservation.financials.cancellationFee = safeData.cancellationFee;
          reservation.financials.refundAmount = reservation.financials.totalAmount - safeData.cancellationFee;
        }
      } else if (safeData.reservationStatus === 'no-show') {
        reservation.noShowMarkedAt = now;
      } else if (safeData.reservationStatus === 'terminated') {
        reservation.terminatedAt = now;
      }
    }
    
    // Apply all updates
    Object.assign(reservation, safeData, { updatedAt: now });
    
    // Update associated guests if dates or rooms changed
    if (safeData.dates || safeData.rooms) {
      (reservation.guestIds || []).forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          if (safeData.rooms && reservation.rooms !== safeData.rooms) reservation.rooms = safeData.rooms;
          if (safeData.dates) {
            reservation.reservationStart = safeData.dates.split(' to ')[0];
            reservation.reservationEnd = safeData.dates.split(' to ')[1];
          }
        }
      });
    }
    
    console.log('✅ Updated reservation:', reservation.id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),
  http.delete('/api/hotel/reservations/:id', ({ params }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 1637');
    const idx = finalMockReservations.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const reservation = finalMockReservations[idx];
    
    // Clear room assignments for associated guests
    if (Array.isArray(reservation.guestIds)) {
      reservation.guestIds.forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          guest.roomId = '';
          guest.keepOpen = false;
        }
      });
    }
    
    finalMockReservations.splice(idx, 1);
    return HttpResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
  }),

  

  // NEW: Set current hotel (for testing/MSW environment)
  http.post('/api/hotel/set-current', async ({ request }) => {
    console.log('Debug Hotel /api/hotel/set-current Line 1713');
    const { hotelId } = await request.json() as { hotelId: string };
    
    // Find the hotel
    const hotel = mockHotels.find(h => h._id === hotelId);
    if (!hotel) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Update the global currentConfigId based on hotel selection
    if (hotelId === '65a000000000000000000001') {
      currentConfigId = 'mock-hotel-1';
    } else if (hotelId === '65b000000000000000000002') {
      currentConfigId = 'mock-hotel-2';
    }
    
    console.log('🔄 Hotel switched to:', hotel.name, 'Config ID:', currentConfigId);
    return HttpResponse.json(hotel);
  }),

  // Update hotel (matches backend PATCH /api/hotel/:id)
  http.patch('/api/hotel/:id', async ({ params, request }) => {
    console.log('Debug Hotel /api/hotel/:id Line 1735');
    const hotelId = params.id as string;
    const updates = await request.json() as any;
    const hotelIndex = mockHotels.findIndex((h: any) => h._id === hotelId);
    
    if (hotelIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockHotels[hotelIndex] = {
      ...mockHotels[hotelIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockHotels[hotelIndex]);
  }),


  http.post('/api/hotel/:hotelId/room-types', async ({ params, request }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types Line 1766');
    const hotelId = params.hotelId as string;
    const newRoomType = await request.json() as any;
    
    const roomType = {
      _id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newRoomType,
      hotelId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockRoomTypes.push(roomType);
    return HttpResponse.json(roomType, { status: 201 });
  }),

  http.patch('/api/hotel/:hotelId/room-types/:id', async ({ params, request }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types/:id Line 1784');
    const roomTypeId = params.id as string;
    const updates = await request.json() as any;
    
    const roomTypeIndex = mockRoomTypes.findIndex(rt => rt._id === roomTypeId);
    if (roomTypeIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRoomTypes[roomTypeIndex] = {
      ...mockRoomTypes[roomTypeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockRoomTypes[roomTypeIndex]);
  }),

  http.delete('/api/hotel/:hotelId/room-types/:id', ({ params }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types/:id Line 1803');
    const roomTypeId = params.id as string;
    const roomTypeIndex = mockRoomTypes.findIndex(rt => rt._id === roomTypeId);
    
    if (roomTypeIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Soft delete
    mockRoomTypes[roomTypeIndex].isActive = false;
    mockRoomTypes[roomTypeIndex].updatedAt = new Date().toISOString();
    
    return HttpResponse.json({ message: 'Room type deleted successfully' });
  }),

  // Hotel stats (matches backend GET /api/hotel/stats)
  http.get('/api/hotel/stats', () => {
    console.log('Debug Hotel /api/hotel/stats Line 1820');
    // For new users with no hotel, return empty stats
    if (mockHotels.length === 0) {
      return HttpResponse.json({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        occupancyRate: 0,
        isNewUser: true
      });
    }
    
    const totalRooms = mockRooms.length;
    const availableRooms = mockRooms.filter(r => r.status === 'available').length;
    const totalGuests = mockGuests.length;
    const checkedInGuests = mockGuests.filter(g => g.status === 'checked-in').length;
    
    return HttpResponse.json({
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
      totalGuests,
      checkedInGuests,
      occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
      isNewUser: false
    });
  }),

  // Hotel rooms endpoints (matches backend /api/hotel/rooms)
  http.get('/api/hotel/rooms', () => {
    console.log('Debug Rooms /api/hotel/rooms Line 1853');
    // Return empty array for new users - they'll add rooms after hotel setup
    return HttpResponse.json(mockHotels.length === 0 ? [] : mockRooms);
  }),

  http.post('/api/hotel/rooms', async ({ request }) => {
    console.log('Debug Rooms /api/hotel/rooms Line 1859');
    const newRoom = await request.json() as any;
    const room = {
      id: `room-${mockRooms.length + 1}`,
      ...newRoom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockRooms.push(room);
    return HttpResponse.json(room, { status: 201 });
  }),

  http.patch('/api/hotel/rooms/:id', async ({ params, request }) => {
    console.log('Debug Rooms /api/hotel/rooms/:id Line 1872');
    const roomId = params.id as string;
    const updates = await request.json() as any;
    const roomIndex = mockRooms.findIndex(r => r._id === roomId);
    
    if (roomIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRooms[roomIndex] = {
      ...mockRooms[roomIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockRooms[roomIndex]);
  }),

  http.delete('/api/hotel/rooms/:id', ({ params }) => {
    console.log('Debug Rooms /api/hotel/rooms/:id Line 1881');
    const roomId = params.id as string;
    const roomIndex = mockRooms.findIndex(r => r._id === roomId);
    
    if (roomIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRooms.splice(roomIndex, 1);
    return HttpResponse.json({ message: 'Room deleted successfully' });
  }),

  // Communication endpoints (matches backend /api/communications/*)
  http.get('/api/communications/guest/:guestId', ({ params }) => {
    console.log('Debug Rooms /api/communications/guest/:guestId Line 1895');
    const guestId = params.guestId as string;
    const communications = mockCommunications.filter((c: any) => c.guestId === guestId);
    return HttpResponse.json(communications);
  }),

  http.post('/api/communications/send', async ({ request }) => {
    console.log('Debug Rooms /api/communications/send Line 1902');
    const body = await request.json() as any;
    const communication = {
      _id: `65c00000000000000000000${mockCommunications.length + 1}`,
      guestId: body.guestId,
      hotelId: body.hotelId || (mockHotels.length > 0 ? mockHotels[0]._id : 'no-hotel'),
      content: body.content,
      channel: body.channel,
      type: 'outbound',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCommunications.push(communication);
    return HttpResponse.json(communication, { status: 201 });
  }),

  // Subscription plans (matches backend GET /api/subscription/plans)
  http.get('/api/subscription/plans', () => {
    console.log('Debug Rooms /api/subscription/plans Line 1920');
    return HttpResponse.json([
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        features: [
          'Up to 50 rooms',
          'Basic AI responses', 
          'WhatsApp integration',
          'Email support'
        ],
        limits: {
          rooms: 50,
          aiResponses: 1000,
          channels: ['whatsapp']
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 99,
        features: [
          'Up to 200 rooms',
          'Advanced AI responses',
          'Multi-channel communication',
          'Priority support',
          'Analytics dashboard'
        ],
        limits: {
          rooms: 200,
          aiResponses: 5000,
          channels: ['whatsapp', 'email', 'sms']
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        features: [
          'Unlimited rooms',
          'Custom AI training',
          'All communication channels',
          '24/7 phone support',
          'Custom integrations',
          'White-label solution'
        ],
        limits: {
          rooms: -1,
          aiResponses: -1,
          channels: ['whatsapp', 'email', 'sms', 'phone']
        }
      }
    ]);
  }),

  // =============================================================================
  // HOTEL CONFIGURATION ENDPOINTS (Complex Hotel Setup)
  // =============================================================================

  // Get all hotel configurations (matches backend GET /api/hotel/config)
  // http.get('/api/hotel/config', () => {
  //   console.log('Debug Rooms /api/hotel/config Line 1954');
  //   // Return empty array for new users - triggers configuration wizard
  //   return HttpResponse.json(mockHotelConfigs);
  // }),

  // // Create hotel configuration (matches backend POST /api/hotel/config)
  // http.post('/api/hotel/config', async ({ request }) => {
  //   console.log('Debug Rooms /api/hotel/config Line 1961');
  //   const newConfig = await request.json() as any;
    
  //   // Generate IDs for nested items if not provided
  //   const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
  //   const config = {
  //     _id: `65d00000000000000000000${mockHotelConfigs.length + 1}`,
  //     ...newConfig,
  //     hotelId: newConfig.hotelId || (mockHotels.length > 0 ? mockHotels[0]._id : '65a000000000000000000001'),
  //     features: newConfig.features?.map((f: any) => ({
  //       ...f,
  //       id: f.id || generateId('feature')
  //     })) || [],
  //     roomTypes: newConfig.roomTypes?.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('roomtype')
  //     })) || [],
  //     floors: newConfig.floors?.map((fl: any) => ({
  //       ...fl,
  //       id: fl.id || generateId('floor')
  //     })) || [],
  //     roomTemplates: newConfig.roomTemplates?.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('template')
  //     })) || [],
  //     isActive: true,
  //     createdBy: '65a000000000000000000002',
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   };
    
  //   mockHotelConfigs.push(config);
  //   return HttpResponse.json(config, { status: 201 });
  // }),

  // Update hotel configuration (matches backend PATCH /api/hotel/config/:id)
  // http.patch('/api/hotel/config/:id', async ({ params, request }) => {
  //   console.log('Debug Rooms /api/hotel/config/:id Line 1999');
  //   const configId = params.id as string;
  //   const updates = await request.json() as any;
  //   const configIndex = mockHotelConfigs.findIndex((c: any) => c._id === configId);
    
  //   if (configIndex === -1) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
    
  //   // Update nested item IDs if needed
  //   const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
  //   if (updates.features) {
  //     updates.features = updates.features.map((f: any) => ({
  //       ...f,
  //       id: f.id || generateId('feature')
  //     }));
  //   }
    
  //   if (updates.roomTypes) {
  //     updates.roomTypes = updates.roomTypes.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('roomtype')
  //     }));
  //   }
    
  //   mockHotelConfigs[configIndex] = {
  //     ...mockHotelConfigs[configIndex],
  //     ...updates,
  //     updatedAt: new Date().toISOString()
  //   };
    
  //   return HttpResponse.json(mockHotelConfigs[configIndex]);
  // }),

  // Get hotel configuration by ID (matches backend GET /api/hotel/config/:id)
  // http.get('/api/hotel/config/:id', ({ params }) => {
  //   console.log('Debug Rooms /api/hotel/config/:id Line 2036');
  //   const configId = params.id as string;
  //   const config = mockHotelConfigs.find((c: any) => c._id === configId);
    
  //   if (!config) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
    
  //   return HttpResponse.json(config);
  // }),

  // Room endpoints  
  http.post('/api/rooms/:id/assign', async ({ params, request }) => {
    console.log('Debug Rooms /api/rooms/:id/assign Line 2145');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = await request.json() as { guestId: string };
    if (!body || typeof body.guestId !== 'string') {
      return new HttpResponse('Missing or invalid guestId', { status: 400 });
    }
    // Log the guest assignment
    // Add guest to assignedGuests if not already present - Fixed TypeScript errors
    room.assignedGuests = room.assignedGuests || [];
    if (!room.assignedGuests.includes(body.guestId)) {
      room.assignedGuests.push(body.guestId);
    }
    
    // Update status based on capacity and assigned guests
    const assignedCount = room.assignedGuests?.length || 0;
    if (assignedCount === 0) {
      room.status = 'available' as RoomStatus;
    } else if (assignedCount < (room.capacity || 1)) {
      room.status = (room.status.startsWith('occupied') ? 'partially-occupied' : 'partially-reserved') as RoomStatus;
    } else {
      room.status = (room.status.startsWith('reserved') ? 'reserved' : 'occupied') as RoomStatus;
    }
    return HttpResponse.json(room);
  }),


  http.post('/api/rooms/bulk', async ({ request }) => {
    console.log('Debug Rooms /api/rooms/bulk Line 2114');
    const data = await request.json();
    if (!Array.isArray(data)) {
      return new HttpResponse('Invalid payload', { status: 400 });
    }
    const createdRooms = data.map((room) => {
      const newRoom = ensureRoomDefaults({
        id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        number: typeof room.number === 'string' ? room.number : '',
        typeId: typeof room.typeId === 'string' ? room.typeId : '',
        floorId: typeof room.floorId === 'string' ? room.floorId : '',
        status: typeof room.status === 'string' ? room.status : 'available',
        features: Array.isArray(room.features) ? room.features : [],
        capacity: typeof room.capacity === 'number' ? room.capacity : 1,
        rate: typeof room.rate === 'number' ? room.rate : 0,
        notes: typeof room.notes === 'string' ? room.notes : '',
        hotelId: currentConfigId,
        assignedGuests: [],
      });
      mockRooms.push(newRoom);
      return newRoom;
    });
    return HttpResponse.json(createdRooms, { status: 201 });
  }),

  // Guests endpoints
  http.get('/api/hotel/guests', () => {
    console.log('Debug Rooms /api/hotel/guests Line 2141');
    return HttpResponse.json(mockGuests.filter(g => g.hotelId === currentConfigId));
  }),
  http.get('/api/hotel/guests/:id', ({ params }) => {
    console.log('Debug Rooms /api/hotel/guests/:id Line 2145');
    const guest = mockGuests.find(g => g._id === params.id && g.hotelId === currentConfigId);
    if (!guest) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(guest);
  }),
  http.post('/api/hotel/guests', async ({ request }) => {
    console.log('Debug Rooms /api/hotel/guests Line 2153');
    const guestData = await request.json() as any;
    const newGuest = {
      _id: `guest-${Date.now()}`,
      ...guestData,
      hotelId: currentConfigId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockGuests.push(newGuest);
    
    // Update room status based on new guest assignment
    recalculateRoomStatus(mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest assignment');
    
    return HttpResponse.json(newGuest);
  }),
  http.patch('/api/hotel/guests/:id', async ({ params, request }) => {
    console.log('Debug Rooms /api/hotel/guests/:id Line 2170');
    const updates = await request.json() as any;
    const guest = mockGuests.find(g => g._id === params.id);
    if (!guest) {
      return new HttpResponse(null, { status: 404 });
    }

    Object.assign(guest, updates, { updatedAt: new Date().toISOString() });
    
    // Update room status based on guest status change
    recalculateRoomStatus(mockRooms.find(r => r._id === guest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest status change');
    
    return HttpResponse.json(guest);
  }),
  http.delete('/api/hotel/guests/:id', ({ params }) => {
    console.log('Debug Rooms /api/hotel/guests/:id Line 2185');
    const idx = mockGuests.findIndex(g => g._id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Remove guest from rooms before deleting - Fix line 2112
    mockRooms.forEach(r => {
      if (r.assignedGuests) {
        r.assignedGuests = r.assignedGuests.filter((gid: string) => gid !== params.id);
      }
    });
    
    mockGuests.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('/api/rooms/:id/maintenance', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/maintenance Line 2206');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    room.status = 'maintenance';
    return HttpResponse.json(room);
  }),

  http.post('/api/rooms/:id/terminate', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/terminate Line 2214');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    // Remove all assigned guests from this room and delete them
    const guestsToRemove = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
    guestsToRemove.forEach(g => {
      const idx = mockGuests.findIndex(gg => gg._id === g._id);
      if (idx !== -1) mockGuests.splice(idx, 1);
    });
    room.assignedGuests = [];
    room.status = 'available';
    (room as Room).keepOpen = false;
    return HttpResponse.json(room);
  }),

  // Get all reservation history
  http.get('/api/reservation-history', () => {
    console.log('Debug Reservation History /api/reservation-history Line 2231');
    // Only return history for the current hotel config
    const roomIdsForConfig = mockRooms.filter(r => r.hotelId === currentConfigId).map(r => r._id);
    const filtered = finalReservationHistory.filter((h: any) => roomIdsForConfig.includes(h.roomId));
    return HttpResponse.json(filtered);
  }),

  // Get room-specific reservation history
  http.get('/api/reservation-history/room/:roomId', ({ params }) => {
    console.log('Debug Reservation History /api/reservation-history/room/:roomId Line 2240');
    const roomId = typeof params.roomId === 'string' ? params.roomId : undefined;
    if (!roomId) {
      return new HttpResponse('Invalid room ID', { status: 400 });
    }
    return HttpResponse.json(finalReservationHistory.filter((h: any) => h.roomId === roomId));
  }),

  // Room status change handler
  http.patch('/api/rooms/:id/status', async ({ params, request }) => {
    console.log('Debug Rooms /api/rooms/:id/status Line 2250');
    const roomId = typeof params.id === 'string' ? params.id : undefined;
    if (!roomId) {
      return new HttpResponse('Invalid room ID', { status: 400 });
    }
    const room = mockRooms.find(r => r._id === roomId);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = await request.json() as { status: RoomStatus };
    if (!body || typeof body.status !== 'string' || !['available', 'occupied', 'maintenance', 'cleaning', 'reserved', 'partially-reserved', 'partially-occupied'].includes(body.status)) {
      return new HttpResponse('Invalid status', { status: 400 });
    }
    room.status = body.status;
    // Log the status change
    recalculateRoomStatus(room, 'system', 'Status updated via API');
    return HttpResponse.json(room);
  }),

  // Guest removal handler
  http.delete('/api/rooms/:id/guests/:guestId', async ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/guests/:guestId Line 2271');
    const roomId = typeof params.id === 'string' ? params.id : undefined;
    const guestId = typeof params.guestId === 'string' ? params.guestId : undefined;
    if (!roomId || !guestId) {
      return new HttpResponse('Invalid room or guest ID', { status: 400 });
    }
    const room = mockRooms.find(r => r._id === roomId);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    // ... rest of existing removal logic ...
    return HttpResponse.json(room);
  }),

  // Set room to cleaning
  http.patch('/api/rooms/:id/cleaning', ({ params }) => {
    console.log('Debug Rooms /api/rooms/:id/cleaning Line 2287');
    const room = mockRooms.find(r => r._id === params.id);
    if (!room) return new HttpResponse(null, { status: 404 });
    // Only allow if not already cleaning
    if (room.status === 'cleaning') {
      return new HttpResponse('Room is already being cleaned', { status: 400 });
    }
    room.status = 'cleaning';
    recalculateRoomStatus(room, 'system', 'Room set to cleaning via API');
    return HttpResponse.json(room);
  }),

  // Reservation endpoints
  http.get('/api/reservations', () => {
    console.log('Debug Reservations /api/reservations Line 2301');
    // Only return reservations for the current hotel config
    const roomIdsForConfig = mockRooms.filter(r => r.hotelId === currentConfigId).map(r => r._id);
    const filtered = finalMockReservations.filter((r: any) => roomIdsForConfig.includes(r.rooms));
    return HttpResponse.json(filtered);
  }),
  http.post('/api/reservations', async ({ request }) => {
    console.log('Debug Reservations /api/reservations Line 2308');
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    // Create new guests if needed
    let guestIds = Array.isArray(safeData.guestIds) ? safeData.guestIds : [];
    if (Array.isArray(safeData.newGuests)) {
      safeData.newGuests.forEach((g: any) => {
        const newGuestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        mockGuests.push({
          _id: newGuestId,
          name: g.name,
          email: g.email || '',
          phone: g.phone || '',
          status: 'booked',
          roomId: safeData.rooms || '',
          reservationStart: safeData.dates.split(' to ')[0],
          reservationEnd: safeData.dates.split(' to ')[1],
          checkIn: null,
          checkOut: null,
          hotelId: currentConfigId,
          keepOpen: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        guestIds.push(newGuestId);
      });
    }
    const price = typeof safeData.price === 'number' ? safeData.price : Number(safeData.price);
    const newReservation = {
      id: `R-${(finalMockReservations.length + 1).toString().padStart(3, '0')}`,
      guestIds,
      guests: guestIds.map(id => mockGuests.find(g => g._id === id)?.name || ''),
      rooms: safeData.rooms || '',
      dates: safeData.dates || '',
      status: safeData.status || 'Pending',
      notes: safeData.notes || '',
      price: !isNaN(price) ? price : 0,
      createdDate: new Date().toISOString().split('T')[0],
    };
    finalMockReservations.push(newReservation);
    // Update guests' reservation info
    guestIds.forEach((gid: string) => {
      const guest = mockGuests.find(g => g._id === gid);
      if (guest) {
        guest.roomId = newReservation.rooms;
        guest.reservationStart = newReservation.dates.split(' to ')[0];
        guest.reservationEnd = newReservation.dates.split(' to ')[1];
      }
    });
    // Add to reservation history: reservation_created
    finalReservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: newReservation.rooms,
      timestamp: new Date().toISOString(),
      action: 'reservation_created',
      previousState: {},
      newState: { guestIds: newReservation.guestIds },
      performedBy: 'system',
      notes: 'Reservation created via API',
    });
    return HttpResponse.json(newReservation, { status: 201 });
  }),
  http.patch('/api/hotel/reservations/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 2371');
    const idx = finalMockReservations.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = finalMockReservations[idx];
    const now = new Date().toISOString();
    
    // Handle business actions
    if (safeData.reservationStatus && safeData.reservationStatus !== reservation.reservationStatus) {
      // Update audit trail
      if (!reservation.audit) {
        reservation.audit = { statusHistory: [], actions: [] };
      }
      
      reservation.audit.statusHistory.push({
        status: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        reason: safeData.reason || 'Status updated'
      });
      
      reservation.audit.actions.push({
        action: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        details: {
          previousStatus: reservation.reservationStatus,
          newStatus: safeData.reservationStatus,
          reason: safeData.reason
        }
      });
      
      // Handle specific business status updates
      if (safeData.reservationStatus === 'cancelled') {
        reservation.cancelledAt = now;
        reservation.cancelledBy = safeData.cancelledBy || 'hotel';
        reservation.cancellationReason = safeData.cancellationReason || safeData.reason;
        
        // Update financials with cancellation fee
        if (safeData.cancellationFee !== undefined) {
          reservation.financials.cancellationFee = safeData.cancellationFee;
          reservation.financials.refundAmount = reservation.financials.totalAmount - safeData.cancellationFee;
        }
      } else if (safeData.reservationStatus === 'no-show') {
        reservation.noShowMarkedAt = now;
      } else if (safeData.reservationStatus === 'terminated') {
        reservation.terminatedAt = now;
      }
    }
    
    // Apply all updates
    Object.assign(reservation, safeData, { updatedAt: now });
    
    // Update associated guests if dates or rooms changed
    if (safeData.dates || safeData.rooms) {
      (reservation.guestIds || []).forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          if (safeData.rooms && reservation.rooms !== safeData.rooms) reservation.rooms = safeData.rooms;
          if (safeData.dates) {
            reservation.reservationStart = safeData.dates.split(' to ')[0];
            reservation.reservationEnd = safeData.dates.split(' to ')[1];
          }
        }
      });
    }
    
    console.log('✅ Updated reservation:', reservation.id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),
  http.delete('/api/hotel/reservations/:id', ({ params }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 2445');
    const idx = finalMockReservations.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const reservation = finalMockReservations[idx];
    
    // Clear room assignments for associated guests
    if (Array.isArray(reservation.guestIds)) {
      reservation.guestIds.forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          guest.roomId = '';
          guest.keepOpen = false;
        }
      });
    }
    
    finalMockReservations.splice(idx, 1);
    return HttpResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
  }),

  // NEW USER ONBOARDING: Hotel endpoints that handle empty state
  http.get('/api/hotel', () => {
    console.log('Debug Hotel /api/hotel Line 2468');
    // Return empty array for new users - triggers onboarding flow in frontend
    return HttpResponse.json(mockHotels);
  }),

  // Create hotel (matches backend POST /api/hotel)
  http.post('/api/hotel', async ({ request }) => {
    console.log('Debug Hotel /api/hotel Line 2504');
    const newHotel = await request.json() as any;
    const hotel = {
      _id: `65b00000000000000000000${mockHotels.length + 1}`,
      ...newHotel,
      slug: newHotel.name?.toLowerCase().replace(/\s+/g, '-') || 'new-hotel',
      isActive: true,
      createdBy: '65a000000000000000000002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockHotels.push(hotel);
    return HttpResponse.json(hotel, { status: 201 });
  }),

  // NEW: Set current hotel (for testing/MSW environment)
  http.post('/api/hotel/set-current', async ({ request }) => {
    console.log('Debug Hotel /api/hotel/set-current Line 2521');
    const { hotelId } = await request.json() as { hotelId: string };
    
    // Find the hotel
    const hotel = mockHotels.find(h => h._id === hotelId);
    if (!hotel) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Update the global currentConfigId based on hotel selection
    if (hotelId === '65a000000000000000000001') {
      currentConfigId = 'mock-hotel-1';
    } else if (hotelId === '65b000000000000000000002') {
      currentConfigId = 'mock-hotel-2';
    }
    
    console.log('🔄 Hotel switched to:', hotel.name, 'Config ID:', currentConfigId);
    return HttpResponse.json(hotel);
  }),

  // Update hotel (matches backend PATCH /api/hotel/:id)
  http.patch('/api/hotel/:id', async ({ params, request }) => {
    console.log('Debug Hotel /api/hotel/:id Line 2543');
    const hotelId = params.id as string;
    const updates = await request.json() as any;
    const hotelIndex = mockHotels.findIndex((h: any) => h._id === hotelId);
    
    if (hotelIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockHotels[hotelIndex] = {
      ...mockHotels[hotelIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockHotels[hotelIndex]);
  }),

  // NEW: Hotel room types endpoints (matches backend /api/hotel/:hotelId/room-types)
  http.get('/api/hotel/:hotelId/room-types', ({ params }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types Line 2563');
    const hotelId = params.hotelId as string;
    console.log('🔍 Room Types Request - Hotel ID:', hotelId);
    console.log('🏠 All Room Types:', mockRoomTypes);
    const hotelRoomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);
    console.log('✅ Filtered Room Types for Hotel:', hotelRoomTypes);
    return HttpResponse.json(hotelRoomTypes);
  }),

  http.post('/api/hotel/:hotelId/room-types', async ({ params, request }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types Line 2573');
    const hotelId = params.hotelId as string;
    const newRoomType = await request.json() as any;
    
    const roomType = {
      _id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newRoomType,
      hotelId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockRoomTypes.push(roomType);
    return HttpResponse.json(roomType, { status: 201 });
  }),

  http.patch('/api/hotel/:hotelId/room-types/:id', async ({ params, request }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types/:id Line 2591');
    const roomTypeId = params.id as string;
    const updates = await request.json() as any;
    
    const roomTypeIndex = mockRoomTypes.findIndex(rt => rt._id === roomTypeId);
    if (roomTypeIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRoomTypes[roomTypeIndex] = {
      ...mockRoomTypes[roomTypeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockRoomTypes[roomTypeIndex]);
  }),

  http.delete('/api/hotel/:hotelId/room-types/:id', ({ params }) => {
    console.log('Debug Room Types /api/hotel/:hotelId/room-types/:id Line 2610');
    const roomTypeId = params.id as string;
    const roomTypeIndex = mockRoomTypes.findIndex(rt => rt._id === roomTypeId);
    
    if (roomTypeIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    // Soft delete
    mockRoomTypes[roomTypeIndex].isActive = false;
    mockRoomTypes[roomTypeIndex].updatedAt = new Date().toISOString();
    
    return HttpResponse.json({ message: 'Room type deleted successfully' });
  }),

  // Hotel stats (matches backend GET /api/hotel/stats)
  http.get('/api/hotel/stats', () => {
    console.log('Debug Hotel /api/hotel/stats Line 2627');
    // For new users with no hotel, return empty stats
    if (mockHotels.length === 0) {
      return HttpResponse.json({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        totalGuests: 0,
        checkedInGuests: 0,
        occupancyRate: 0,
        isNewUser: true
      });
    }
    
    const totalRooms = mockRooms.length;
    const availableRooms = mockRooms.filter(r => r.status === 'available').length;
    const totalGuests = mockGuests.length;
    const checkedInGuests = mockGuests.filter(g => g.status === 'checked-in').length;
    
    return HttpResponse.json({
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
      totalGuests,
      checkedInGuests,
      occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
      isNewUser: false
    });
  }),

  // Hotel rooms endpoints (matches backend /api/hotel/rooms)
  http.get('/api/hotel/rooms', () => {
    console.log('Debug Rooms /api/hotel/rooms Line 2659');
    // Return empty array for new users - they'll add rooms after hotel setup
    return HttpResponse.json(mockHotels.length === 0 ? [] : mockRooms);
  }),

  http.post('/api/hotel/rooms', async ({ request }) => {
    console.log('Debug Rooms /api/hotel/rooms Line 2665');
    const newRoom = await request.json() as any;
    const room = {
      _id: `room-${mockRooms.length + 1}`,
      ...newRoom,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockRooms.push(room);
    return HttpResponse.json(room, { status: 201 });
  }),

  http.patch('/api/hotel/rooms/:id', async ({ params, request }) => {
    console.log('Debug Rooms /api/hotel/rooms/:id Line 2678');
    const roomId = params.id as string;
    const updates = await request.json() as any;
    const roomIndex = mockRooms.findIndex(r => r._id === roomId);
    
    if (roomIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRooms[roomIndex] = {
      ...mockRooms[roomIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return HttpResponse.json(mockRooms[roomIndex]);
  }),

  http.delete('/api/hotel/rooms/:id', ({ params }) => {
    console.log('Debug Rooms /api/hotel/rooms/:id Line 2697');
    const roomId = params.id as string;
    const roomIndex = mockRooms.findIndex(r => r._id === roomId);
    
    if (roomIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockRooms.splice(roomIndex, 1);
    return HttpResponse.json({ message: 'Room deleted successfully' });
  }),

  // Communication endpoints (matches backend /api/communications/*)
  http.get('/api/communications/guest/:guestId', ({ params }) => {
    console.log('Debug Communications /api/communications/guest/:guestId Line 2711');
    const guestId = params.guestId as string;
    const communications = mockCommunications.filter((c: any) => c.guestId === guestId);
    return HttpResponse.json(communications);
  }),

  http.post('/api/communications/send', async ({ request }) => {
    console.log('Debug Communications /api/communications/send Line 2717');
    const body = await request.json() as any;
    const communication = {
      _id: `65c00000000000000000000${mockCommunications.length + 1}`,
      guestId: body.guestId,
      hotelId: body.hotelId || (mockHotels.length > 0 ? mockHotels[0]._id : 'no-hotel'),
      content: body.content,
      channel: body.channel,
      type: 'outbound',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCommunications.push(communication);
    return HttpResponse.json(communication, { status: 201 });
  }),

  // Subscription plans (matches backend GET /api/subscription/plans)
  http.get('/api/subscription/plans', () => {
    console.log('Debug Subscription Plans /api/subscription/plans Line 2736');
    return HttpResponse.json([
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        features: [
          'Up to 50 rooms',
          'Basic AI responses', 
          'WhatsApp integration',
          'Email support'
        ],
        limits: {
          rooms: 50,
          aiResponses: 1000,
          channels: ['whatsapp']
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 99,
        features: [
          'Up to 200 rooms',
          'Advanced AI responses',
          'Multi-channel communication',
          'Priority support',
          'Analytics dashboard'
        ],
        limits: {
          rooms: 200,
          aiResponses: 5000,
          channels: ['whatsapp', 'email', 'sms']
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        features: [
          'Unlimited rooms',
          'Custom AI training',
          'All communication channels',
          '24/7 phone support',
          'Custom integrations',
          'White-label solution'
        ],
        limits: {
          rooms: -1,
          aiResponses: -1,
          channels: ['whatsapp', 'email', 'sms', 'phone']
        }
      }
    ]);
  }),

  // =============================================================================
  // HOTEL CONFIGURATION ENDPOINTS (Complex Hotel Setup)
  // =============================================================================

  // Get all hotel configurations (matches backend GET /api/hotel/config)
  // http.get('/api/hotel/config', () => {
  //   console.log('Debug Hotel Config /api/hotel/config Line 2799');
  //   // Return empty array for new users - triggers configuration wizard
  //   return HttpResponse.json(mockHotelConfigs);
  // }),

  // // Create hotel configuration (matches backend POST /api/hotel/config)
  // http.post('/api/hotel/config', async ({ request }) => {
  //   console.log('Debug Hotel Config /api/hotel/config Line 2806');
  //   const newConfig = await request.json() as any;
    
  //   // Generate IDs for nested items if not provided
  //   const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
  //   const config = {
  //     _id: `65d00000000000000000000${mockHotelConfigs.length + 1}`,
  //     ...newConfig,
  //     hotelId: newConfig.hotelId || (mockHotels.length > 0 ? mockHotels[0]._id : '65a000000000000000000001'),
  //     features: newConfig.features?.map((f: any) => ({
  //       ...f,
  //       id: f.id || generateId('feature')
  //     })) || [],
  //     roomTypes: newConfig.roomTypes?.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('roomtype')
  //     })) || [],
  //     floors: newConfig.floors?.map((fl: any) => ({
  //       ...fl,
  //       id: fl.id || generateId('floor')
  //     })) || [],
  //     roomTemplates: newConfig.roomTemplates?.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('template')
  //     })) || [],
  //     isActive: true,
  //     createdBy: '65a000000000000000000002',
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   };
    
  //   mockHotelConfigs.push(config);
  //   return HttpResponse.json(config, { status: 201 });
  // }),

  // // Update hotel configuration (matches backend PATCH /api/hotel/config/:id)
  // http.patch('/api/hotel/config/:id', async ({ params, request }) => {
  //   console.log('Debug Hotel Config /api/hotel/config/:id Line 2844');
  //   const configId = params.id as string;
  //   const updates = await request.json() as any;
  //   const configIndex = mockHotelConfigs.findIndex((c: any) => c._id === configId);
    
  //   if (configIndex === -1) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
    
  //   // Update nested item IDs if needed
  //   const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
  //   if (updates.features) {
  //     updates.features = updates.features.map((f: any) => ({
  //       ...f,
  //       id: f.id || generateId('feature')
  //     }));
  //   }
    
  //   if (updates.roomTypes) {
  //     updates.roomTypes = updates.roomTypes.map((rt: any) => ({
  //       ...rt,
  //       id: rt.id || generateId('roomtype')
  //     }));
  //   }
    
  //   mockHotelConfigs[configIndex] = {
  //     ...mockHotelConfigs[configIndex],
  //     ...updates,
  //     updatedAt: new Date().toISOString()
  //   };
    
  //   return HttpResponse.json(mockHotelConfigs[configIndex]);
  // }),

  // // Get hotel configuration by ID (matches backend GET /api/hotel/config/:id)
  // http.get('/api/hotel/config/:id', ({ params }) => {
  //   console.log('Debug Hotel Config /api/hotel/config/:id Line 2881');
  //   const configId = params.id as string;
  //   const config = mockHotelConfigs.find((c: any) => c._id === configId);
    
  //   if (!config) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
    
  //   return HttpResponse.json(config);
  // }),

  // Communication endpoints (matches backend /api/communications/*)

  // Enhanced Reservation System Endpoints
  http.get('/api/rooms/available-detailed', ({ request }) => {
    console.log('Debug Rooms /api/rooms/available-detailed Line 2896');
    const url = new URL(request.url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const checkInDate = url.searchParams.get('checkInDate') || '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const checkOutDate = url.searchParams.get('checkOutDate') || '';
    const guestCount = parseInt(url.searchParams.get('guestCount') || '1');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hotelId = url.searchParams.get('hotelId') || '';

    const hotelRooms = mockRooms.filter(r => r.hotelId === hotelId && ['available', 'cleaning'].includes(r.status));
    const hotelRoomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);

    const detailedRooms = hotelRooms.map(room => {
      const roomType = hotelRoomTypes.find(rt => rt._id === room.typeId);
      return {
        ...room,
        roomType,
        isAvailable: true,
        suitableForGuests: (roomType?.capacity?.total || 2) >= guestCount
      };
    });

    return HttpResponse.json(detailedRooms);
  }),

  // Pricing calculation API
  http.post('/api/pricing/calculate', async ({ request }) => {
    console.log('Debug Pricing /api/pricing/calculate Line 2924');
    const body = await request.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roomIds, checkInDate, checkOutDate, guestCount, hotelId } = body;

    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const breakdown: any[] = [];
    let subtotal = 0;

    roomIds.forEach((roomId: string) => {
      const room = mockRooms.find(r => r._id === roomId);
      const roomType = mockRoomTypes.find(rt => rt._id === room?.typeId);
      
      if (room && roomType) {
        const baseRate = room.rate || 100;
        const baseAmount = baseRate * nights;
        const weekendSurcharge = nights * 20;
        const finalAmount = baseAmount + weekendSurcharge;

        breakdown.push({
          roomId: room._id,
          roomNumber: room.number,
          roomType: roomType.name,
          description: `${roomType.name} - ${nights} night${nights > 1 ? 's' : ''}`,
          baseAmount,
          adjustments: [
            {
              type: 'weekend',
              description: 'Weekend surcharge',
              amount: weekendSurcharge
            }
          ],
          finalAmount
        });

        subtotal += finalAmount;
      }
    });

    const taxes = subtotal * 0.13; // 13% tax
    const fees = nights * 15; // $15 per night resort fee
    const total = subtotal + taxes + fees;

    return HttpResponse.json({
      pricing: {
        breakdown,
        subtotal,
        taxes,
        fees,
        total,
        currency: 'USD'
      },
      breakdown,
      recommendations: {
        savings: [],
        upgrades: []
      }
    });
  }),

  // Room pricing API
  http.post('/api/pricing/rooms', async ({ request }) => {
    console.log('Debug Pricing /api/pricing/rooms Line 2986');
    const body = await request.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roomIds, checkInDate, checkOutDate, hotelId } = body;

    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const roomPricing = roomIds.map((roomId: string) => {
      const room = mockRooms.find(r => r._id === roomId);
      if (!room) return null;

      const baseRate = room.rate || 100;
      const subtotal = baseRate * nights;
      const adjustments = [
        {
          type: 'weekend',
          description: 'Weekend surcharge',
          amount: nights * 20
        }
      ];
      const finalAmount = subtotal + adjustments.reduce((sum, adj) => sum + adj.amount, 0);

      return {
        roomId,
        baseRate,
        totalNights: nights,
        subtotal,
        adjustments,
        finalAmount
      };
    }).filter(Boolean);

    return HttpResponse.json(roomPricing);
  }),

  // Room assignment suggestions
  http.post('/api/rooms/assignment-suggestions', async ({ request }) => {
    console.log('Debug Rooms /api/rooms/assignment-suggestions Line 3022');
    const body = await request.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { availableRoomIds, totalGuests, preferences } = body;

    const suggestions = [];
    const rooms = availableRoomIds.map((id: string) => mockRooms.find(r => r._id === id)).filter(Boolean);
    const roomTypes = mockRoomTypes;

    // Single room suggestion
    for (const room of rooms) {
      const roomType = roomTypes.find(rt => rt._id === room.typeId);
      if (roomType && (roomType.capacity?.total || 2) >= totalGuests) {
        const baseRate = room.rate || 100;
        suggestions.push({
          assignments: [{
            roomId: room._id,
            room,
            suggestedGuests: [],
            capacityUtilization: totalGuests / (roomType.capacity?.total || 2),
            preferenceMatch: 0.8
          }],
          totalPrice: baseRate * 3, // Assume 3 nights
          matchScore: 85,
          reasoning: `Single ${roomType.name} room accommodates all ${totalGuests} guests`
        });
        break;
      }
    }

    return HttpResponse.json(suggestions);
  }),

  // Multi-room reservations CRUD
  http.get('/api/reservations/multi-room', ({ request }) => {
    console.log('Debug Reservations /api/reservations/multi-room Line 3057');
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId') || '';
    const status = url.searchParams.get('status');

    // Convert existing reservations to multi-room format
    let multiRoomReservations = finalMockReservations
      .filter((r: any) => r.hotelId === hotelId || r.rooms?.includes(hotelId))
      .map((r: any) => {
        const primaryGuest = mockGuests.find(g => r.guestIds?.[0] === g._id) || {
          _id: 'guest-placeholder',
          name: 'Guest',
          email: 'guest@example.com',
          phone: '+1234567890'
        };

        const roomAssignments = [{
          roomId: r.rooms || '65b000000000000000000001',
          room: mockRooms.find(room => room._id === r.rooms),
          guests: (r.guestIds || []).map((gId: string) => mockGuests.find(g => g._id === gId)).filter(Boolean),
          roomSpecificNotes: r.notes || '',
          checkInStatus: 'pending' as const
        }];

        return {
          id: r.id,
          primaryGuest,
          roomAssignments,
          checkInDate: r.dates?.split(' to ')[0] || new Date().toISOString().split('T')[0],
          checkOutDate: r.dates?.split(' to ')[1] || new Date().toISOString().split('T')[0],
          pricing: {
            breakdown: [{
              roomId: r.rooms || '65b000000000000000000001',
              roomNumber: mockRooms.find(room => room._id === r.rooms)?.number || '101',
              roomType: 'Standard',
              description: 'Standard Room - 3 nights',
              baseAmount: r.price || 300,
              adjustments: [],
              finalAmount: r.price || 300
            }],
            subtotal: r.price || 300,
            taxes: (r.price || 300) * 0.13,
            fees: 45,
            total: (r.price || 300) * 1.13 + 45,
            currency: 'USD'
          },
          status: r.reservationStatus || 'confirmed',
          notes: r.notes || '',
          specialRequests: [],
          hotelId: hotelId,
          createdBy: 'system',
          createdAt: r.createdDate || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

    if (status) {
      multiRoomReservations = multiRoomReservations.filter((r: any) => r.status === status);
    }

    return HttpResponse.json(multiRoomReservations);
  }),

  http.get('/api/reservations/multi-room/:id', ({ params }) => {
    console.log('Debug Reservations /api/reservations/multi-room/:id Line 3121');
    const reservationId = params.id as string;
    const reservation = finalMockReservations.find((r: any) => r.id === reservationId);
    
    if (!reservation) {
      return new HttpResponse(null, { status: 404 });
    }

    // Convert to multi-room format
    const primaryGuest = mockGuests.find(g => reservation.guestIds?.[0] === g._id) || {
      _id: 'guest-placeholder',
      name: 'Guest',
      email: 'guest@example.com',
      phone: '+1234567890'
    };

    const multiRoomReservation = {
      id: reservation.id,
      primaryGuest,
      roomAssignments: [{
        roomId: reservation.rooms || '65b000000000000000000001',
        room: mockRooms.find(room => room._id === reservation.rooms),
        guests: (reservation.guestIds || []).map((gId: string) => mockGuests.find(g => g._id === gId)).filter(Boolean),
        roomSpecificNotes: reservation.notes || '',
        checkInStatus: 'pending' as const
      }],
      checkInDate: reservation.dates?.split(' to ')[0] || new Date().toISOString().split('T')[0],
      checkOutDate: reservation.dates?.split(' to ')[1] || new Date().toISOString().split('T')[0],
      pricing: {
        breakdown: [{
          roomId: reservation.rooms || '65b000000000000000000001',
          roomNumber: mockRooms.find(room => room._id === reservation.rooms)?.number || '101',
          roomType: 'Standard',
          description: 'Standard Room - 3 nights',
          baseAmount: reservation.price || 300,
          adjustments: [],
          finalAmount: reservation.price || 300
        }],
        subtotal: reservation.price || 300,
        taxes: (reservation.price || 300) * 0.13,
        fees: 45,
        total: (reservation.price || 300) * 1.13 + 45,
        currency: 'USD'
      },
      status: reservation.reservationStatus || 'confirmed',
      notes: reservation.notes || '',
      specialRequests: [],
      hotelId: reservation.hotelId || currentConfigId,
      createdBy: 'system',
      createdAt: reservation.createdDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json(multiRoomReservation);
  }),

  http.post('/api/reservations/multi-room', async ({ request }) => {
    console.log('Debug Reservations /api/reservations/multi-room Line 3178');
    const newReservation = await request.json() as any;
    console.log('🎯 Creating Enhanced Reservation:', JSON.stringify(newReservation, null, 2));
    
    // Create guest records for all guests in room assignments
    const createdGuestIds: string[] = [];
    const createdGuests: any[] = [];
    
    // Create primary guest
    const primaryGuestId = `guest-${Date.now()}-primary`;
    const primaryGuest = {
      _id: primaryGuestId,
      name: newReservation.primaryGuest.name || '',
      email: newReservation.primaryGuest.email || '',
      phone: newReservation.primaryGuest.phone || '',
      status: 'booked',
      roomId: newReservation.roomAssignments[0]?.roomId || '',
      reservationStart: newReservation.checkInDate,
      reservationEnd: newReservation.checkOutDate,
      checkIn: null,
      checkOut: null,
      hotelId: newReservation.hotelId || '',
      keepOpen: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockGuests.push(primaryGuest);
    createdGuestIds.push(primaryGuestId);
    createdGuests.push(primaryGuest);
    console.log('✅ Created primary guest:', primaryGuest.name, 'ID:', primaryGuestId);
    
    // Create additional guests from room assignments
    newReservation.roomAssignments?.forEach((assignment: any, roomIndex: number) => {
      assignment.guests?.forEach((guest: any, guestIndex: number) => {
        if (guest && guest.name && guestIndex > 0) { // Skip primary guest (index 0)
          const guestId = `guest-${Date.now()}-${roomIndex}-${guestIndex}`;
          const newGuest = {
            _id: guestId,
            name: guest.name || '',
            email: guest.email || '',
            phone: guest.phone || '',
            status: 'booked',
            roomId: assignment.roomId || '',
            reservationStart: newReservation.checkInDate,
            reservationEnd: newReservation.checkOutDate,
            checkIn: null,
            checkOut: null,
            hotelId: newReservation.hotelId || '',
            keepOpen: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          mockGuests.push(newGuest);
          createdGuestIds.push(guestId);
          createdGuests.push(newGuest);
          console.log('✅ Created additional guest:', newGuest.name, 'ID:', guestId);
        }
      });
    });
    
    // Convert multi-room reservation to legacy format for compatibility
    const legacyReservation = {
      id: `MR-${(finalMockReservations.length + 1).toString().padStart(3, '0')}`,
      guestIds: createdGuestIds,
      guests: createdGuests.map(g => g.name),
      rooms: newReservation.roomAssignments[0]?.roomId || '',
      dates: `${newReservation.checkInDate} to ${newReservation.checkOutDate}`,
      status: 'Confirmed',
      reservationStatus: 'active', // Set as active since guests are booked
      notes: newReservation.notes || '',
      price: newReservation.pricing?.total || 0,
      hotelId: newReservation.hotelId,
      createdDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    finalMockReservations.push(legacyReservation);
    
    // Recalculate room status after adding guests
    newReservation.roomAssignments?.forEach((assignment: any) => {
      const room = mockRooms.find(r => r._id === assignment.roomId);
      if (room) {
        recalculateRoomStatus(room, 'reservation-system', 'Enhanced reservation created');
      }
    });

    // Return in multi-room format
    const multiRoomResponse = {
      ...newReservation,
      id: legacyReservation.id,
      primaryGuest: primaryGuest,
      createdAt: legacyReservation.createdAt,
      updatedAt: legacyReservation.updatedAt
    };

    console.log('✅ Created multi-room reservation:', multiRoomResponse.id, 'with', createdGuestIds.length, 'guests');
    return HttpResponse.json(multiRoomResponse, { status: 201 });
  }),

  http.patch('/api/reservations/multi-room/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/multi-room/:id Line 3281');
    const reservationId = params.id as string;
    const updates = await request.json() as any;
    
    const reservationIndex = finalMockReservations.findIndex((r: any) => r.id === reservationId);
    if (reservationIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    // Update legacy reservation
    const reservation = finalMockReservations[reservationIndex];
    Object.assign(reservation, {
      notes: updates.notes || reservation.notes,
      reservationStatus: updates.status || reservation.reservationStatus,
      updatedAt: new Date().toISOString()
    });

    // Return in multi-room format
    const multiRoomResponse = {
      id: reservation.id,
      primaryGuest: mockGuests.find(g => reservation.guestIds?.[0] === g._id) || {
        _id: 'guest-placeholder',
        name: 'Guest',
        email: 'guest@example.com',
        phone: '+1234567890'
      },
      roomAssignments: [{
        roomId: reservation.rooms || '65b000000000000000000001',
        room: mockRooms.find(room => room._id === reservation.rooms),
        guests: (reservation.guestIds || []).map((gId: string) => mockGuests.find(g => g._id === gId)).filter(Boolean),
        roomSpecificNotes: reservation.notes || '',
        checkInStatus: 'pending' as const
      }],
      checkInDate: reservation.dates?.split(' to ')[0] || new Date().toISOString().split('T')[0],
      checkOutDate: reservation.dates?.split(' to ')[1] || new Date().toISOString().split('T')[0],
      pricing: updates.pricing || {
        breakdown: [],
        subtotal: reservation.price || 0,
        taxes: 0,
        fees: 0,
        total: reservation.price || 0,
        currency: 'USD'
      },
      status: reservation.reservationStatus || 'confirmed',
      notes: reservation.notes || '',
      specialRequests: updates.specialRequests || [],
      hotelId: reservation.hotelId || currentConfigId,
      createdBy: 'system',
      createdAt: reservation.createdDate || new Date().toISOString(),
      updatedAt: reservation.updatedAt
    };

    return HttpResponse.json(multiRoomResponse);
  }),

  // Guest management for reservations
  http.post('/api/reservations/:reservationId/guests', async ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/:reservationId/guests Line 3338');
    const { reservationId } = params;
    const { roomId, guest } = await request.json() as any;

    // Add guest to the system
    const newGuest = {
      _id: `guest-${Date.now()}`,
      ...guest,
      roomId,
      status: 'booked',
      hotelId: currentConfigId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockGuests.push(newGuest);

    // Update reservation
    const reservation = finalMockReservations.find((r: any) => r.id === reservationId);
    if (reservation) {
      reservation.guestIds = reservation.guestIds || [];
      reservation.guestIds.push(newGuest._id);
    }

    return HttpResponse.json(newGuest, { status: 201 });
  }),

  // Validation endpoints
  http.post('/api/reservations/validate', async ({ request }) => {
    console.log('Debug Reservations /api/reservations/validate Line 3367');
    const reservationData = await request.json() as any;
    
    const errors: any = {};
    
    if (!reservationData.checkInDate) {
      errors.checkInDate = 'Check-in date is required';
    }
    
    if (!reservationData.checkOutDate) {
      errors.checkOutDate = 'Check-out date is required';
    }
    
    if (!reservationData.primaryGuest?.name) {
      errors.primaryGuest = 'Primary guest name is required';
    }

    const isValid = Object.keys(errors).length === 0;

    return HttpResponse.json({
      isValid,
      errors: isValid ? null : errors
    });
  }),

  http.post('/api/reservations/check-conflicts', async ({ request }) => {
    console.log('Debug Reservations /api/reservations/check-conflicts Line 3393');
    const { roomIds, checkInDate, checkOutDate, excludeReservationId } = await request.json() as any;
    
    const conflicts = finalMockReservations
      .filter((r: any) => r.id !== excludeReservationId)
      .filter((r: any) => roomIds.includes(r.rooms))
      .filter((r: any) => {
        const resStart = new Date(r.dates?.split(' to ')[0] || r.checkInDate);
        const resEnd = new Date(r.dates?.split(' to ')[1] || r.checkOutDate);
        const reqStart = new Date(checkInDate);
        const reqEnd = new Date(checkOutDate);
        
        return resStart < reqEnd && resEnd > reqStart;
      });

    return HttpResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map((r: any) => ({
        reservationId: r.id,
        roomId: r.rooms,
        guestName: r.guests?.[0] || 'Unknown Guest',
        dates: r.dates
      }))
    });
  }),

  // Upgrade recommendations
  http.get('/api/reservations/:reservationId/upgrade-recommendations', ({ params }) => {
    console.log('Debug Reservations /api/reservations/:reservationId/upgrade-recommendations Line 3421');
    const reservationId = params.reservationId as string;
    const reservation = finalMockReservations.find((r: any) => r.id === reservationId);
    
    if (!reservation) {
      return new HttpResponse(null, { status: 404 });
    }

    const currentRoom = mockRooms.find(r => r._id === reservation.rooms);
    if (!currentRoom) {
      return HttpResponse.json([]);
    }

    // Find upgrade options (higher price rooms)
    const upgradeOptions = mockRooms
      .filter(r => r.hotelId === currentRoom.hotelId && 
                   (r.rate || 0) > (currentRoom.rate || 0) && 
                   r.status === 'available')
      .slice(0, 2)
      .map(upgradeRoom => {
        const additionalCost = ((upgradeRoom.rate || 0) - (currentRoom.rate || 0)) * 3; // 3 nights
        return {
          roomId: currentRoom._id,
          currentRoom,
          upgradeRoom,
          additionalCost,
          benefits: [
            `Upgrade to ${upgradeRoom.typeId || 'Premium'} room`,
            'Better amenities',
            'Enhanced comfort'
          ]
        };
      });

    return HttpResponse.json(upgradeOptions);
  }),

  // Analytics endpoint
  http.get('/api/reservations/analytics', ({ request }) => {
    console.log('Debug Reservations /api/reservations/analytics Line 3459');
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId') || '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const startDate = url.searchParams.get('startDate') || '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const endDate = url.searchParams.get('endDate') || '';

    const hotelReservations = finalMockReservations.filter((r: any) => r.hotelId === hotelId);
    
    return HttpResponse.json({
      totalReservations: hotelReservations.length,
      totalRevenue: hotelReservations.reduce((sum: number, r: any) => sum + (r.price || 0), 0),
      averageStayLength: 3.2,
      occupancyRate: 0.75,
      topRoomTypes: [
        { name: 'Standard', count: 15, revenue: 4500 },
        { name: 'Deluxe', count: 8, revenue: 3200 }
      ],
      monthlyTrends: [
        { month: 'Jan', reservations: 45, revenue: 13500 },
        { month: 'Feb', reservations: 52, revenue: 15600 },
        { month: 'Mar', reservations: 48, revenue: 14400 }
      ]
    });
  }),


];

// Utility functions
function ensureRoomDefaults(room: any) {
  return {
    ...room,
    assignedGuests: Array.isArray(room.assignedGuests) ? room.assignedGuests : [],
    notes: typeof room.notes === 'string' ? room.notes : '',
  };
}

function recalculateRoomStatus(room: any, performedBy: string = 'system', notes: string = 'Room status recalculated') {
  if (!room) return;

  // Find guests assigned to this room
  const roomGuests = mockGuests.filter(g => g.roomId === room.id && g.hotelId === room.hotelId);
  room.assignedGuests = roomGuests.map(g => g._id);

  if (roomGuests.length === 0) {
    room.status = 'available' as RoomStatus;
    return;
  }

  const capacity = room.capacity || 1;
  
  // Separate guests by status
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const checkedOutGuests = roomGuests.filter(g => g.status === 'checked-out');

  // Room status logic based on real hotel scenarios
  const allCheckedOut = roomGuests.every(g => g.status === 'checked-out');
  const allCheckedIn = roomGuests.every(g => g.status === 'checked-in');
  const allBooked = roomGuests.every(g => g.status === 'booked');
  const hasCheckedOut = checkedOutGuests.length > 0;
  const hasCheckedIn = checkedInGuests.length > 0;
  const hasBooked = bookedGuests.length > 0;

  let newStatus: RoomStatus;

  // Business logic priority (real hotel scenario):
  
  // 1. All guests checked out → needs cleaning
  if (allCheckedOut) {
    newStatus = 'cleaning' as RoomStatus;
  }
  // 2. Mixed checkout scenario → deoccupied states
  else if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
    newStatus = 'partially-deoccupied' as RoomStatus;
  }
  // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
  else if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
    newStatus = 'deoccupied' as RoomStatus;
  }
  // 4. All checked in scenarios
  else if (allCheckedIn) {
    const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'occupied' as RoomStatus;
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
    }
  }
  // 5. Mixed checked-in and booked
  else if (hasCheckedIn && hasBooked) {
    newStatus = 'partially-occupied' as RoomStatus;
  }
  // 6. All booked scenarios
  else if (allBooked) {
    const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'reserved' as RoomStatus;
    } else {
      newStatus = 'partially-reserved' as RoomStatus;
    }
  }
  // 7. Only checked-in guests
  else if (hasCheckedIn && !hasBooked) {
    if (checkedInGuests.length === capacity) {
      newStatus = 'occupied' as RoomStatus;
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
    }
  }
  // 8. Default fallback
  else {
    newStatus = 'available' as RoomStatus;
  }

  room.status = newStatus;
  console.log(`🔄 Room ${room.number}: ${newStatus} | Guests: ${roomGuests.map(g => `${g.name}(${g.status},keepOpen:${g.keepOpen})`).join(', ')}`);
}

// Ensure all mockRooms have notes: '' if missing
mockRooms.forEach(room => { 
  if (typeof room.notes !== 'string') (room as any).notes = '';
  if (!room.assignedGuests) (room as any).assignedGuests = [];
});

// Initialize room statuses based on guest assignments
mockRooms.forEach(room => {
  recalculateRoomStatus(room, 'system', 'Initial room status calculation');
  
});