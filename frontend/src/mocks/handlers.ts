// TypeScript fixes applied for room.assignedGuests logic
import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import type { Room, RoomAction, RoomStats, RoomStatus } from '../types/room';
import { mockHotels } from './data/hotels';
import { mockRooms, mockRoomTypes } from './data/rooms';
import { mockGuests } from './data/guests';
import { mockReservations as reservationsData } from './data/reservations';
import { Reservation } from '../types/reservation';

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

// Sync assignedGuests for all rooms on startup
mockRooms.forEach(room => {
        room.assignedGuests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId).map(g => g._id);
});

// Use the new reservation data model instead of dynamic generation
const reservationHistory: any[] = []; // Keep for backward compatibility

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
  // http.post('/api/hotel/guests', async ({ request }) => {
  //   console.log('Debug Guests /api/hotel/guests Line 1164');
  //   const guestData = await request.json() as any;
  //   const newGuest = {
  //     _id: `guest-${Date.now()}`,
  //     ...guestData,
  //     hotelId: currentConfigId,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   };
  //   mockGuests.push(newGuest);
    
  //   // Update room status based on new guest assignment
  //   recalculateRoomStatus(mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest assignment');
    
  //   return HttpResponse.json(newGuest);
  // }),
  // http.patch('/api/hotel/guests/:id', async ({ params, request }) => {
  //   console.log('Debug Guests /api/hotel/guests/:id Line 1181');
  //   const updates = await request.json() as any;
  //   const guest = mockGuests.find(g => g._id === params.id);
  //   if (!guest) {
  //     return new HttpResponse(null, { status: 404 });
  //   }

  //   Object.assign(guest, updates, { updatedAt: new Date().toISOString() });
    
  //   // Update room status based on guest status change
  //   recalculateRoomStatus(mockRooms.find(r => r._id === guest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest status change');
    
  //   return HttpResponse.json(guest);
  // }),
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
    const filtered = reservationHistory.filter((h: any) => roomIdsForHotel.includes(h.roomId));
    
    console.log('📋 Reservation History - Current Hotel ID:', currentHotelId);
    console.log('📋 Room IDs for Hotel:', roomIdsForHotel);
    console.log('📋 Total History Entries:', reservationHistory.length);
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
    return HttpResponse.json(reservationHistory.filter((h: any) => h.roomId === roomId));
  }),

  // // Room status change handler
  // http.patch('/api/rooms/:id/status', async ({ params, request }) => {
  //   console.log('Debug Rooms /api/rooms/:id/status Line 1278');
  //   const roomId = typeof params.id === 'string' ? params.id : undefined;
  //   if (!roomId) {
  //     return new HttpResponse('Invalid room ID', { status: 400 });
  //   }
  //   const room = mockRooms.find(r => r._id === roomId);
  //   if (!room) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
  //   const body = await request.json() as { status: RoomStatus };
  //   if (!body || typeof body.status !== 'string' || !['available', 'occupied', 'maintenance', 'cleaning', 'reserved', 'partially-reserved', 'partially-occupied'].includes(body.status)) {
  //     return new HttpResponse('Invalid status', { status: 400 });
  //   }
  //   room.status = body.status;
  //   // Log the status change
  //   recalculateRoomStatus(room, 'system', 'Status updated via API');
  //   return HttpResponse.json(room);
  // }),

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
  // http.patch('/api/rooms/:id/cleaning', ({ params }) => {
  //   console.log('Debug Rooms /api/rooms/:id/cleaning Line 1315');
  //   const room = mockRooms.find(r => r._id === params.id);
  //   if (!room) return new HttpResponse(null, { status: 404 });
  //   // Only allow if not already cleaning
  //   if (room.status === 'cleaning') {
  //     return new HttpResponse('Room is already being cleaned', { status: 400 });
  //   }
  //   room.status = 'cleaning';
  //   recalculateRoomStatus(room, 'system', 'Room set to cleaning via API');
  //   return HttpResponse.json(room);
  // }),

  // Reservation endpoints - UPDATED to use real data model

  // PATCH /api/reservations/:id - Handle business actions (cancel, no-show, terminate, etc.)
  http.patch('/api/reservations/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/:id Line 1337');
    const reservationId = params.id as string;
    const idx = reservationsData.findIndex((r: any) => r._id === reservationId);
    
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = reservationsData[idx];
    const now = new Date().toISOString();
    
    // Handle different business actions
    switch (safeData.action) {
      case 'cancel':
        reservation.status = 'cancelled';
        reservation.reservationStatus = 'cancelled';
        reservation.cancelledAt = now;
        reservation.cancelledBy = safeData.performedBy || 'hotel-staff';
        reservation.cancellationReason = safeData.reason || 'Cancelled by hotel staff';
        
        // Update financials with cancellation fee if provided
        if (safeData.cancellationFee !== undefined) {
          reservation.financials.cancellationFee = safeData.cancellationFee;
          reservation.financials.refundAmount = reservation.financials.totalAmount - safeData.cancellationFee;
        }
        break;
    
      case 'no-show':
        reservation.status = 'no-show';
        reservation.reservationStatus = 'no-show';
        reservation.noShowMarkedAt = now;      
        reservation.noShowReason = safeData.reason || 'Guest did not arrive';
        break;
    
      case 'terminate':
        reservation.status = 'terminated';
        reservation.reservationStatus = 'terminated';
        reservation.terminatedAt = now;        
        reservation.terminationReason = safeData.reason || 'Early termination by hotel';
        break;
    
      case 'complete':
        reservation.status = 'completed';
        reservation.reservationStatus = 'completed';
        reservation.completedAt = now;
        break;
    
      case 'delete':
        // This will be handled by DELETE endpoint
        break;
    }
    
    // Update status history
    reservation.audit.statusHistory.push({     
      status: reservation.reservationStatus,   
      timestamp: now,
      performedBy: safeData.performedBy || 'hotel-staff',
      reason: safeData.reason || `${safeData.action} action performed`
    });
    
    reservation.updatedAt = now;
    reservation.lastStatusChange = now;
    
    return HttpResponse.json({
      id: reservation._id,
      hotelId: reservation.hotelId,
      rooms: reservation.roomId, // Map for compatibility
      guestIds: reservation.guestIds,
      dates: `${reservation.checkInDate.split('T')[0]} to ${reservation.checkOutDate.split('T')[0]}`,
      price: reservation.totalAmount,
      status: reservation.status,
      reservationStatus: reservation.reservationStatus,
      confirmationNumber: reservation.confirmationNumber,
      notes: reservation.notes || '',
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt
    });
  }),

  // DELETE /api/reservations/:id - Remove reservation from system
  http.delete('/api/reservations/:id', ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/:id Line 1431');
    const reservationId = params.id as string;
    const idx = reservationsData.findIndex((r: any) => r.id === reservationId);
    
    if (idx === -1) {
      console.log('❌ Reservation not found for deletion:', reservationId);
      return new HttpResponse(JSON.stringify({ error: 'Reservation not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const reservation = reservationsData[idx];
    
    // Extract reason from query parameters
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || 'Removed from system';
    
    console.log('🗑️ Deleting reservation from system:', reservationId, 'Reason:', reason);
    
    // Add deletion to reservation history BEFORE removing the reservation
    reservationHistory.push({
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId: reservation.roomId,
      timestamp: new Date().toISOString(),
      action: 'reservation_deleted' as const,
      previousState: {
        guestIds: reservation.guestIds,
        dates: [`${reservation.checkInDate} to ${reservation.checkOutDate}`],
        rooms: reservation.roomId,
        status: reservation.reservationStatus || 'active',
        price: reservation.totalAmount,
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
    console.log('📋 History entry created:', reservationHistory[reservationHistory.length - 1]);
    
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
    reservationsData.splice(idx, 1);
    
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
          address: g.address || '',
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
    const newReservation: Reservation = {
      _id: `res-${currentConfigId.slice(-4)}-${String(reservationsData.length + 1).padStart(4, '0')}`,
      hotelId: currentConfigId,
      roomId: safeData.rooms || '',
      guestIds,
      confirmationNumber: `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reservationStart: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      reservationEnd: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      checkInDate: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      checkOutDate: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      nights: 1, // Calculate based on dates
      roomRate: !isNaN(price) ? price : 0,
      totalAmount: !isNaN(price) ? price : 0,
      paidAmount: 0,
      currency: 'USD',
      status: 'active',
      reservationStatus: 'active',
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      specialRequests: '',
      notes: safeData.notes || '',
      source: 'direct',
      financials: {
        totalAmount: !isNaN(price) ? price : 0,
        paidAmount: 0,
        refundAmount: 0,
        cancellationFee: 0,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        transactions: []
      },
      audit: {
        statusHistory: [{
          status: 'active',
          timestamp: new Date().toISOString(),
          performedBy: 'system',
          reason: 'Reservation created'
        }],
        actions: [{
          action: 'created',
          timestamp: new Date().toISOString(),
          performedBy: 'system',
          details: { source: 'api' }
        }]
      },
      statusHistory: [{
        status: 'active',
        timestamp: new Date().toISOString(),
        performedBy: 'system',
        reason: 'Reservation created'
      }]
    };
    reservationsData.push(newReservation);
    // Update guests' reservation info
    guestIds.forEach((gid: string) => {
      const guest = mockGuests.find(g => g._id === gid);
      if (guest) {
        guest.roomId = newReservation.roomId;
        guest.reservationStart = newReservation.reservationStart;
        guest.reservationEnd = newReservation.reservationEnd;
      }
    });
    // Add to reservation history: reservation_created
    reservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: newReservation.roomId,
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
    const idx = reservationsData.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = reservationsData[idx];
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
          if (safeData.rooms && reservation.roomId !== safeData.rooms) reservation.roomId = safeData.rooms;
          if (safeData.dates) {
            reservation.reservationStart = safeData.dates.split(' to ')[0];
            reservation.checkOutDate = safeData.dates.split(' to ')[1];
          }
        }
      });
    }
    
    console.log('✅ Updated reservation:', reservation._id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),
  http.delete('/api/hotel/reservations/:id', ({ params }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 1637');
    const idx = reservationsData.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const reservation = reservationsData[idx];
    
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
    
    reservationsData.splice(idx, 1);
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
  // http.post('/api/hotel/guests', async ({ request }) => {
  //   console.log('Debug Rooms /api/hotel/guests Line 2153');
  //   const guestData = await request.json() as any;
  //   const newGuest = {
  //     _id: `guest-${Date.now()}`,
  //     ...guestData,
  //     hotelId: currentConfigId,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString()
  //   };
  //   mockGuests.push(newGuest);
    
  //   // Update room status based on new guest assignment
  //   recalculateRoomStatus(mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest assignment');
    
  //   return HttpResponse.json(newGuest);
  // }),
  // http.patch('/api/hotel/guests/:id', async ({ params, request }) => {
  //   console.log('Debug Rooms /api/hotel/guests/:id Line 2170');
  //   const updates = await request.json() as any;
  //   const guest = mockGuests.find(g => g._id === params.id);
  //   if (!guest) {
  //     return new HttpResponse(null, { status: 404 });
  //   }

  //   Object.assign(guest, updates, { updatedAt: new Date().toISOString() });
    
  //   // Update room status based on guest status change
  //   recalculateRoomStatus(mockRooms.find(r => r._id === guest.roomId && r.hotelId === currentConfigId), 'system', 'Triggered by guest status change');
    
  //   return HttpResponse.json(guest);
  // }),
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
    const filtered = reservationHistory.filter((h: any) => roomIdsForConfig.includes(h.roomId));
    return HttpResponse.json(filtered);
  }),

  // Get room-specific reservation history
  http.get('/api/reservation-history/room/:roomId', ({ params }) => {
    console.log('Debug Reservation History /api/reservation-history/room/:roomId Line 2240');
    const roomId = typeof params.roomId === 'string' ? params.roomId : undefined;
    if (!roomId) {
      return new HttpResponse('Invalid room ID', { status: 400 });
    }
    return HttpResponse.json(reservationHistory.filter((h: any) => h.roomId === roomId));
  }),

  // // Room status change handler
  // http.patch('/api/rooms/:id/status', async ({ params, request }) => {
  //   console.log('Debug Rooms /api/rooms/:id/status Line 2250');
  //   const roomId = typeof params.id === 'string' ? params.id : undefined;
  //   if (!roomId) {
  //     return new HttpResponse('Invalid room ID', { status: 400 });
  //   }
  //   const room = mockRooms.find(r => r._id === roomId);
  //   if (!room) {
  //     return new HttpResponse(null, { status: 404 });
  //   }
  //   const body = await request.json() as { status: RoomStatus };
  //   if (!body || typeof body.status !== 'string' || !['available', 'occupied', 'maintenance', 'cleaning', 'reserved', 'partially-reserved', 'partially-occupied'].includes(body.status)) {
  //     return new HttpResponse('Invalid status', { status: 400 });
  //   }
  //   room.status = body.status;
  //   // Log the status change
  //   recalculateRoomStatus(room, 'system', 'Status updated via API');
  //   return HttpResponse.json(room);
  // }),

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
  // http.patch('/api/rooms/:id/cleaning', ({ params }) => {
  //   console.log('Debug Rooms /api/rooms/:id/cleaning Line 2287');
  //   const room = mockRooms.find(r => r._id === params.id);
  //   if (!room) return new HttpResponse(null, { status: 404 });
  //   // Only allow if not already cleaning
  //   if (room.status === 'cleaning') {
  //     return new HttpResponse('Room is already being cleaned', { status: 400 });
  //   }
  //   room.status = 'cleaning';
  //   recalculateRoomStatus(room, 'system', 'Room set to cleaning via API');
  //   return HttpResponse.json(room);
  // }),

  // Reservation endpoints
  
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
          address: g.address || '',
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
    
    // Calculate room rate from room data or use default
    const room = mockRooms.find(r => r._id === safeData.rooms);
    const roomRate = room?.rate || 150; // Default to $150 if no room found
    
    const newReservation: Reservation = {
      _id: `res-${currentConfigId.slice(-4)}-${String(reservationsData.length + 1).padStart(4, '0')}`,
      hotelId: currentConfigId,
      roomId: safeData.rooms || '',
      guestIds,
      confirmationNumber: `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reservationStart: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      reservationEnd: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      checkInDate: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      checkOutDate: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      nights: 1,
      roomRate: roomRate,
      totalAmount: roomRate,
      paidAmount: 0,
      currency: 'USD',
      status: 'active',
      reservationStatus: 'active',
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      specialRequests: safeData.specialRequests || '',
      notes: safeData.notes || '',
      source: 'direct',
      financials: {
        totalAmount: roomRate,
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
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            reason: 'Reservation created via API'
          }
        ],
        actions: [
          {
            action: 'create',
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            details: { guestCount: guestIds.length, roomId: safeData.rooms }
          }
        ]
      },
      statusHistory: [
        {
          status: 'active',
          timestamp: new Date().toISOString(),
          performedBy: 'system',
          reason: 'Reservation created via API'
        }
      ]
    };
    
    reservationsData.push(newReservation);
    
    // Update guests' reservation info
    guestIds.forEach((gid: string) => {
      const guest = mockGuests.find(g => g._id === gid);
      if (guest) {
        guest.roomId = newReservation.roomId;
        guest.reservationStart = newReservation.reservationStart;
        guest.reservationEnd = newReservation.reservationEnd;
      }
    });
    
    // Add to reservation history: reservation_created
    reservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: newReservation.roomId,
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
    const idx = reservationsData.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    const reservation = reservationsData[idx];
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
          if (safeData.rooms && reservation.roomId !== safeData.rooms) reservation.roomId = safeData.rooms;
          if (safeData.dates) {
            reservation.reservationStart = safeData.dates.split(' to ')[0];
            reservation.checkOutDate = safeData.dates.split(' to ')[1];
          }
        }
      });
    }
    
    console.log('✅ Updated reservation:', reservation._id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),
  http.delete('/api/hotel/reservations/:id', ({ params }) => {
    console.log('Debug Reservations /api/hotel/reservations/:id Line 2445');
    const idx = reservationsData.findIndex((r: any) => r.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    
    const reservation = reservationsData[idx];
    
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
    
    reservationsData.splice(idx, 1);
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
    let multiRoomReservations = reservationsData
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
    const reservation = reservationsData.find((r: any) => r.id === reservationId);
    
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
      id: reservation._id,
      primaryGuest,
      roomAssignments: [{
        roomId: reservation.roomId,
        room: mockRooms.find(room => room._id === reservation.roomId),
        guests: (reservation.guestIds || []).map((gId: string) => mockGuests.find(g => g._id === gId)).filter(Boolean),
        roomSpecificNotes: reservation.notes || '',
        checkInStatus: 'pending' as const
      }],
      checkInDate: reservation.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: reservation.checkOutDate || new Date().toISOString().split('T')[0],
      pricing: {
        breakdown: [{
          roomId: reservation.roomId,
          roomNumber: mockRooms.find(room => room._id === reservation.roomId)?.number || '101',
          roomType: 'Standard',
          description: 'Standard Room - 3 nights',
          baseAmount: reservation.totalAmount || 300,
          adjustments: [],
          finalAmount: reservation.totalAmount || 300
        }],
        subtotal: reservation.totalAmount || 300,
        taxes: (reservation.totalAmount || 300) * 0.13,
        fees: 45,
        total: (reservation.totalAmount || 300) * 1.13 + 45,
        currency: 'USD'
      },
      status: reservation.reservationStatus || 'confirmed',
      notes: reservation.notes || '',
      specialRequests: [],
      hotelId: reservation.hotelId || currentConfigId,
      createdBy: 'system',
      createdAt: reservation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json(multiRoomReservation);
  }),

  http.patch('/api/reservations/multi-room/:id', async ({ params, request }) => {
    console.log('Debug Reservations /api/reservations/multi-room/:id Line 3281');
    const reservationId = params.id as string;
    const updates = await request.json() as any;
    
    const reservationIndex = reservationsData.findIndex((r: any) => r.id === reservationId);
    if (reservationIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    // Update legacy reservation
    const reservation = reservationsData[reservationIndex];
    Object.assign(reservation, {
      notes: updates.notes || reservation.notes,
      reservationStatus: updates.status || reservation.reservationStatus,
      updatedAt: new Date().toISOString()
    });

    // Return in multi-room format
    const multiRoomResponse = {
      id: reservation._id,
      primaryGuest: mockGuests.find(g => reservation.guestIds?.[0] === g._id) || {
        _id: 'guest-placeholder',
        name: 'Guest',
        email: 'guest@example.com',
        phone: '+1234567890'
      },
      roomAssignments: [{
        roomId: reservation.roomId,
        room: mockRooms.find(room => room._id === reservation.roomId),
        guests: (reservation.guestIds || []).map((gId: string) => mockGuests.find(g => g._id === gId)).filter(Boolean),
        roomSpecificNotes: reservation.notes || '',
        checkInStatus: 'pending' as const
      }],
      checkInDate: reservation.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: reservation.checkOutDate || new Date().toISOString().split('T')[0],
      pricing: updates.pricing || {
        breakdown: [],
        subtotal: reservation.financials?.totalAmount || 0,
        taxes: 0,
        fees: 0,
        total: reservation.financials?.totalAmount || 0,
        currency: 'USD'
      },
      status: reservation.reservationStatus || 'confirmed',
      notes: reservation.notes || '',
      specialRequests: updates.specialRequests || [],
      hotelId: reservation.hotelId || currentConfigId,
      createdBy: 'system',
      createdAt: reservation.createdAt || new Date().toISOString(),
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
    const reservation = reservationsData.find((r: any) => r.id === reservationId);
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
    
    const conflicts = reservationsData
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
    const reservation = reservationsData.find((r: any) => r.id === reservationId);
    
    if (!reservation) {
      return new HttpResponse(null, { status: 404 });
    }

    const currentRoom = mockRooms.find(r => r._id === reservation.roomId);
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

    const hotelReservations = reservationsData.filter((r: any) => r.hotelId === hotelId);
    
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


// // Ensure all mockRooms have notes: '' if missing
// mockRooms.forEach(room => { 
//   if (typeof room.notes !== 'string') (room as any).notes = '';
//   if (!room.assignedGuests) (room as any).assignedGuests = [];
// });

// // Initialize room statuses based on guest assignments
// mockRooms.forEach(room => {
//   recalculateRoomStatus(room, 'system', 'Initial room status calculation');
  
// });