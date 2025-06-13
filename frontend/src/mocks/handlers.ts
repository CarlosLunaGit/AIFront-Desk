import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import type { Room, RoomAction, RoomStats, RoomStatus } from '../types/room';
import type { HotelConfiguration, HotelConfigDocument, HotelConfigFormData } from '../types/hotel';

// Type definitions for our API
interface MessageRequest {
  content: string;
  recipientId: string;
  type: 'text' | 'image' | 'file';
}

interface LoginRequest {
  email: string;
  password: string;
}

// Mock data
const mockStats = {
  activeGuests: 12,
  availableRooms: 25,
  pendingMessages: 5,
  todayBookings: 8,
};

const mockMessages = [
  {
    id: '1',
    content: 'Hello, I would like to check in early',
    type: 'inbound',
    status: 'read',
    timestamp: new Date().toISOString(),
    sender: {
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  },
  {
    id: '2',
    content: 'Of course! We can accommodate early check-in at 1 PM. Would that work for you?',
    type: 'outbound',
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sender: {
      name: 'Hotel Staff',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  },
];

// Mock data for actual rooms
const mockRooms = [
  // Grand Plaza Hotel
  {
    id: 'room-101',
    number: '101',
    typeId: 'type-1',
    floorId: 'floor-1',
    status: 'partially-reserved' as RoomStatus,
    features: ['feature-3'],
    capacity: 2,
    rate: 150,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-1'],
  },
  {
    id: 'room-102',
    number: '102',
    typeId: 'type-1',
    floorId: 'floor-1',
    status: 'partially-occupied' as RoomStatus,
    features: ['feature-3'],
    capacity: 2,
    rate: 150,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-2'],
  },
  {
    id: 'room-201',
    number: '201',
    typeId: 'type-2',
    floorId: 'floor-2',
    status: 'occupied' as RoomStatus,
    features: ['feature-4'],
    capacity: 1,
    rate: 400,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-3'],
  },
  {
    id: 'room-202',
    number: '202',
    typeId: 'type-2',
    floorId: 'floor-2',
    status: 'partially-reserved' as RoomStatus,
    features: ['feature-4'],
    capacity: 2,
    rate: 400,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-7'],
  },
  {
    id: 'room-203',
    number: '203',
    typeId: 'type-2',
    floorId: 'floor-2',
    status: 'partially-occupied' as RoomStatus,
    features: ['feature-4'],
    capacity: 2,
    rate: 400,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-8'],
  },
  {
    id: 'room-301',
    number: '301',
    typeId: 'type-3',
    floorId: 'floor-2',
    status: 'available' as RoomStatus,
    features: ['feature-4'],
    capacity: 4,
    rate: 600,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: [],
  },
  {
    id: 'room-302',
    number: '302',
    typeId: 'type-3',
    floorId: 'floor-2',
    status: 'partially-reserved' as RoomStatus,
    features: ['feature-4'],
    capacity: 4,
    rate: 600,
    notes: '',
    hotelConfigId: 'mock-hotel-1',
    assignedGuests: ['guest-9'],
  },
  // Seaside Resort
  {
    id: 'room-401',
    number: '401',
    typeId: 'type-4',
    floorId: 'floor-3',
    status: 'partially-reserved' as RoomStatus,
    features: ['feature-4'],
    capacity: 2,
    rate: 300,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: ['guest-4'],
  },
  {
    id: 'room-402',
    number: '402',
    typeId: 'type-4',
    floorId: 'floor-3',
    status: 'partially-occupied' as RoomStatus,
    features: ['feature-4'],
    capacity: 2,
    rate: 300,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: ['guest-5'],
  },
  {
    id: 'room-403',
    number: '403',
    typeId: 'type-4',
    floorId: 'floor-3',
    status: 'occupied' as RoomStatus,
    features: ['feature-4'],
    capacity: 1,
    rate: 300,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: ['guest-6'],
  },
  {
    id: 'room-501',
    number: '501',
    typeId: 'type-5',
    floorId: 'floor-4',
    status: 'partially-reserved' as RoomStatus,
    features: ['feature-4'],
    capacity: 4,
    rate: 600,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: ['guest-10'],
  },
  {
    id: 'room-502',
    number: '502',
    typeId: 'type-5',
    floorId: 'floor-4',
    status: 'partially-occupied' as RoomStatus,
    features: ['feature-4'],
    capacity: 4,
    rate: 600,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: ['guest-11'],
  },
  {
    id: 'room-503',
    number: '503',
    typeId: 'type-5',
    floorId: 'floor-4',
    status: 'available' as RoomStatus,
    features: ['feature-4'],
    capacity: 4,
    rate: 600,
    notes: '',
    hotelConfigId: 'mock-hotel-2',
    assignedGuests: [],
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

interface RoomUpdateRequest {
  status?: RoomStatus;
  typeId?: string;
  features?: string[];
  capacity?: number;
  rate?: number;
  notes?: string;
}

interface RoomActionRequest {
  roomId: string;
  type: RoomAction['type'];
  notes?: string;
}

interface RoomAssignRequest {
  guestId: string;
  checkIn: string;
  checkOut: string;
}

interface SetCurrentConfigRequest {
  configId: string;
}

// Mock hotel configurations for testing
const mockHotelConfigs: HotelConfigDocument[] = [
  {
    id: 'mock-hotel-1',
    name: 'Grand Plaza Hotel',
    description: 'A luxurious hotel in the heart of New York City',
    address: '123 Main Street, New York, NY 10001, USA',
    contactInfo: {
      phone: '+1 (555) 123-4567',
      email: 'info@grandplazahotel.com',
      website: 'www.grandplazahotel.com',
    },
    features: [
      {
        id: 'feature-1',
        name: 'Swimming Pool',
        description: 'Outdoor swimming pool with temperature control',
        icon: 'pool',
        type: 'amenity',
        category: 'common',
      },
      {
        id: 'feature-2',
        name: 'Free WiFi',
        description: 'High-speed internet access throughout the hotel',
        icon: 'wifi',
        type: 'amenity',
        category: 'service',
      },
      {
        id: 'feature-3',
        name: 'Air Conditioning',
        description: 'Individual climate control in all rooms',
        icon: 'ac_unit',
        type: 'feature',
        category: 'room',
      },
    ],
    floors: [
      {
        id: 'floor-1',
        number: 1,
        name: 'Ground Floor',
        description: 'Lobby and public areas',
        isActive: true,
      },
      {
        id: 'floor-2',
        number: 2,
        name: 'Executive Floor',
        description: 'Business rooms and suites',
        isActive: true,
      },
    ],
    roomTypes: [
      {
        id: 'type-1',
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities',
        baseRate: 150,
        defaultCapacity: 2,
        features: ['feature-3'],
        amenities: ['feature-1', 'feature-2'],
      },
      {
        id: 'type-2',
        name: 'Deluxe Room',
        description: 'Spacious room with premium amenities',
        baseRate: 250,
        defaultCapacity: 2,
        features: ['feature-3'],
        amenities: ['feature-1', 'feature-2'],
      },
      {
        id: 'type-3',
        name: 'Executive Suite',
        description: 'Luxury suite with separate living area',
        baseRate: 400,
        defaultCapacity: 4,
        features: ['feature-3'],
        amenities: ['feature-1', 'feature-2'],
      },
    ],
    roomTemplates: [
      {
        id: 'template-1',
        typeId: 'type-1',
        floorId: 'floor-1',
        name: 'Standard Double',
        capacity: 2,
        features: ['feature-3'],
        rate: 150,
        notes: 'Corner room with extra space',
      },
      {
        id: 'template-2',
        typeId: 'type-2',
        floorId: 'floor-1',
        name: 'Deluxe King',
        capacity: 2,
        features: ['feature-3'],
        rate: 250,
        notes: 'Recently renovated',
      },
      {
        id: 'template-3',
        typeId: 'type-3',
        floorId: 'floor-2',
        name: 'Executive Suite',
        capacity: 4,
        features: ['feature-3'],
        rate: 400,
        notes: 'Panoramic city view',
      },
    ],
    settings: {
      roomNumberingFormat: 'numeric',
      defaultStatus: 'available',
      currency: 'USD',
      timezone: 'America/New_York',
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ownerId: 'owner-1',
    isActive: true,
  },
  {
    id: 'mock-hotel-2',
    name: 'Seaside Resort',
    description: 'A beautiful beachfront resort in Miami',
    address: '456 Ocean Drive, Miami, FL 33139, USA',
    contactInfo: {
      phone: '+1 (555) 987-6543',
      email: 'info@seasideresort.com',
      website: 'www.seasideresort.com',
    },
    features: [
      {
        id: 'feature-4',
        name: 'Private Beach',
        description: 'Exclusive beach access for guests',
        icon: 'beach_access',
        type: 'amenity',
        category: 'common',
      },
      {
        id: 'feature-5',
        name: 'Spa',
        description: 'Full-service spa and wellness center',
        icon: 'spa',
        type: 'amenity',
        category: 'service',
      },
    ],
    floors: [
      {
        id: 'floor-3',
        number: 1,
        name: 'Beach Level',
        description: 'Beach access and pool area',
        isActive: true,
      },
      {
        id: 'floor-4',
        number: 2,
        name: 'Ocean View',
        description: 'Rooms with ocean views',
        isActive: true,
      },
    ],
    roomTypes: [
      {
        id: 'type-4',
        name: 'Ocean View Room',
        description: 'Room with stunning ocean views',
        baseRate: 300,
        defaultCapacity: 2,
        features: ['feature-4'],
        amenities: ['feature-5'],
      },
      {
        id: 'type-5',
        name: 'Beachfront Suite',
        description: 'Luxury suite with private beach access',
        baseRate: 600,
        defaultCapacity: 4,
        features: ['feature-4'],
        amenities: ['feature-5'],
      },
    ],
    roomTemplates: [
      {
        id: 'template-4',
        typeId: 'type-4',
        floorId: 'floor-4',
        name: 'Ocean View King',
        capacity: 2,
        features: ['feature-4'],
        rate: 300,
        notes: 'Panoramic ocean view',
      },
      {
        id: 'template-5',
        typeId: 'type-5',
        floorId: 'floor-3',
        name: 'Beachfront Suite',
        capacity: 4,
        features: ['feature-4'],
        rate: 600,
        notes: 'Private beach access',
      },
    ],
    settings: {
      roomNumberingFormat: 'numeric',
      defaultStatus: 'available',
      currency: 'USD',
      timezone: 'America/New_York',
      checkInTime: '16:00',
      checkOutTime: '12:00',
    },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ownerId: 'owner-1',
    isActive: true,
  },
];

// Track the current configuration
let currentConfigId = 'mock-hotel-1';

// Mock guest data
const mockGuests = [
  // Grand Plaza Hotel (mock-hotel-1)
  {
    id: 'guest-1',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1 (555) 111-2222',
    status: 'booked',
    roomId: 'room-101',
    reservationStart: '2024-07-01T15:00:00',
    reservationEnd: '2024-07-05T11:00:00',
    checkIn: '',
    checkOut: '',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: true,
  },
  {
    id: 'guest-2',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    phone: '+1 (555) 333-4444',
    status: 'checked-in',
    roomId: 'room-102',
    reservationStart: '2024-06-10T15:00:00',
    reservationEnd: '2024-06-15T11:00:00',
    checkIn: '2024-06-10T16:00:00',
    checkOut: '',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: true,
  },
  {
    id: 'guest-3',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '+1 (555) 777-8888',
    status: 'checked-out',
    roomId: 'room-201',
    reservationStart: '2024-05-20T15:00:00',
    reservationEnd: '2024-05-25T11:00:00',
    checkIn: '2024-05-20T15:30:00',
    checkOut: '2024-05-25T10:00:00',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: false,
  },
  // Seaside Resort (mock-hotel-2)
  {
    id: 'guest-4',
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    phone: '+1 (555) 222-3333',
    status: 'booked',
    roomId: 'room-301',
    reservationStart: '2024-08-01T15:00:00',
    reservationEnd: '2024-08-05T11:00:00',
    checkIn: '',
    checkOut: '',
    hotelConfigId: 'mock-hotel-2',
    keepOpen: true,
  },
  {
    id: 'guest-5',
    name: 'Evan Lee',
    email: 'evan.lee@example.com',
    phone: '+1 (555) 444-5555',
    status: 'checked-in',
    roomId: 'room-302',
    reservationStart: '2024-07-10T15:00:00',
    reservationEnd: '2024-07-15T11:00:00',
    checkIn: '2024-07-10T16:00:00',
    checkOut: '',
    hotelConfigId: 'mock-hotel-2',
    keepOpen: true,
  },
  {
    id: 'guest-6',
    name: 'Fiona Green',
    email: 'fiona.green@example.com',
    phone: '+1 (555) 666-7777',
    status: 'checked-out',
    roomId: 'room-401',
    reservationStart: '2024-06-20T15:00:00',
    reservationEnd: '2024-06-25T11:00:00',
    checkIn: '2024-06-20T15:30:00',
    checkOut: '2024-06-25T10:00:00',
    hotelConfigId: 'mock-hotel-2',
    keepOpen: false,
  },
  {
    id: 'guest-7',
    name: 'George Wilson',
    email: 'george.wilson@example.com',
    phone: '+1 (555) 888-9999',
    status: 'booked',
    roomId: 'room-202',
    reservationStart: '2024-07-15T15:00:00',
    reservationEnd: '2024-07-20T11:00:00',
    checkIn: '',
    checkOut: '',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: true,
  },
  {
    id: 'guest-8',
    name: 'Hannah Miller',
    email: 'hannah.miller@example.com',
    phone: '+1 (555) 999-0000',
    status: 'checked-in',
    roomId: 'room-203',
    reservationStart: '2024-06-25T15:00:00',
    reservationEnd: '2024-06-30T11:00:00',
    checkIn: '2024-06-25T16:00:00',
    checkOut: '',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: true,
  },
  {
    id: 'guest-9',
    name: 'Ian Thompson',
    email: 'ian.thompson@example.com',
    phone: '+1 (555) 000-1111',
    status: 'booked',
    roomId: 'room-302',
    reservationStart: '2024-08-10T15:00:00',
    reservationEnd: '2024-08-15T11:00:00',
    checkIn: '',
    checkOut: '',
    hotelConfigId: 'mock-hotel-1',
    keepOpen: true,
  },
  {
    id: 'guest-10',
    name: 'Julia Anderson',
    email: 'julia.anderson@example.com',
    phone: '+1 (555) 111-2222',
    status: 'booked',
    roomId: 'room-501',
    reservationStart: '2024-08-20T15:00:00',
    reservationEnd: '2024-08-25T11:00:00',
    checkIn: '',
    checkOut: '',
    hotelConfigId: 'mock-hotel-2',
    keepOpen: true,
  },
  {
    id: 'guest-11',
    name: 'Kevin Martinez',
    email: 'kevin.martinez@example.com',
    phone: '+1 (555) 222-3333',
    status: 'checked-in',
    roomId: 'room-502',
    reservationStart: '2024-07-20T15:00:00',
    reservationEnd: '2024-07-25T11:00:00',
    checkIn: '2024-07-20T16:00:00',
    checkOut: '',
    hotelConfigId: 'mock-hotel-2',
    keepOpen: true,
  }
];

// Mock handlers
export const handlers: HttpHandler[] = [
  // Dashboard stats (dynamic per current config)
  http.get('/api/dashboard/stats', () => {
    const rooms = mockRooms.filter(r => r.hotelConfigId === currentConfigId);
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;
    const reservedRooms = rooms.filter(r => r.status === 'reserved').length;
    const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;
    const byType: Record<string, number> = {};
    rooms.forEach(r => {
      byType[r.typeId] = (byType[r.typeId] || 0) + 1;
    });
    return HttpResponse.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      cleaningRooms,
      reservedRooms,
      occupancyRate,
      byType,
    });
  }),

  // Messages
  http.get('/api/communications/:guestId', () => {
    return HttpResponse.json(mockMessages);
  }),

  // Send message
  http.post('/api/communications/send', async ({ request }) => {
    const body = await request.json() as MessageRequest;
    const newMessage = {
      id: Date.now().toString(),
      content: body.content,
      recipientId: body.recipientId,
      type: body.type,
      timestamp: new Date().toISOString(),
      status: 'sent',
      sender: {
        id: '1',
        name: 'Hotel Staff',
        avatar: '/staff-avatar.png'
      }
    };
    return HttpResponse.json(newMessage);
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest;
    if (body.email === 'demo@hotel.com' && body.password === 'demo123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          name: 'Hotel Staff',
          email: body.email,
          role: 'staff'
        }
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'demo@hotel.com',
      name: 'Demo Hotel',
      hotelName: 'Demo Hotel',
      subscriptionTier: 'premium',
    });
  }),

  // Room endpoints
  http.get('/api/rooms', () => {
    return HttpResponse.json(mockRooms.filter(r => r.hotelConfigId === currentConfigId));
  }),

  http.post('/api/rooms', async ({ request }) => {
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    const newRoom = ensureRoomDefaults({
      id: `room-${Date.now()}`,
      number: typeof safeData.number === 'string' ? safeData.number : '',
      typeId: typeof safeData.typeId === 'string' ? safeData.typeId : '',
      floorId: typeof safeData.floorId === 'string' ? safeData.floorId : '',
      status: typeof safeData.status === 'string' ? safeData.status : 'available',
      features: Array.isArray(safeData.features) ? safeData.features : [],
      capacity: typeof safeData.capacity === 'number' ? safeData.capacity : 1,
      rate: typeof safeData.rate === 'number' ? safeData.rate : 0,
      notes: typeof safeData.notes === 'string' ? safeData.notes : '',
      hotelConfigId: currentConfigId,
      assignedGuests: [],
    });
    mockRooms.push(newRoom);
    return HttpResponse.json(newRoom, { status: 201 });
  }),

  http.patch('/api/rooms/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    const idx = mockRooms.findIndex(r => r.id === id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const updatedRoom = ensureRoomDefaults({
      ...mockRooms[idx],
      ...safeData,
      notes: typeof safeData.notes === 'string' ? safeData.notes : (mockRooms[idx].notes || ''),
    });
    mockRooms[idx] = updatedRoom;
    return HttpResponse.json(updatedRoom);
  }),

  http.get('/api/rooms/:id', ({ params }: any) => {
    const room = mockRooms.find(r => r.id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(room);
  }),

  http.get('/api/rooms/stats', () => {
    return HttpResponse.json(mockRoomStats);
  }),

  // Room actions endpoints
  http.get('/api/rooms/actions', () => {
    return HttpResponse.json(mockRoomActions);
  }),

  http.post('/api/rooms/actions', async ({ request }: any) => {
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
    const room = mockRooms.find(r => r.id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as { guestId: string };
    const guestId = body.guestId;
    if (!guestId) {
      return new HttpResponse('Missing guestId', { status: 400 });
    }
    // Add guest to assignedGuests if not already present
    if (!room.assignedGuests.includes(guestId)) {
      room.assignedGuests.push(guestId);
    }
    // Update status based on capacity and assigned guests
    if (room.assignedGuests.length === 0) {
      room.status = 'available' as RoomStatus;
    } else if (room.assignedGuests.length < room.capacity) {
      room.status = (room.status.startsWith('occupied') ? 'partially-occupied' : 'partially-reserved') as RoomStatus;
    } else {
      room.status = (room.status.startsWith('reserved') ? 'reserved' : 'occupied') as RoomStatus;
    }
    return HttpResponse.json(room);
  }),

  // Mock GET /api/hotel/config/current
  http.get('/api/hotel/config/current', () => {
    const currentConfig = mockHotelConfigs.find(config => config.id === currentConfigId);
    if (!currentConfig) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(currentConfig);
  }),

  // Mock GET /api/hotel/config
  http.get('/api/hotel/config', () => {
    return HttpResponse.json(mockHotelConfigs);
  }),

  // Mock GET /api/hotel/config/:id
  http.get('/api/hotel/config/:id', ({ params }: any) => {
    if (params.id === 'current') {
      const currentConfig = mockHotelConfigs.find(config => config.id === currentConfigId);
      if (!currentConfig) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(currentConfig);
    }
    const config = mockHotelConfigs.find(config => config.id === params.id);
    if (!config) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(config);
  }),

  // Mock POST /api/hotel/config
  http.post('/api/hotel/config', async ({ request }: any) => {
    const data = await request.json() as HotelConfigFormData;
    const newConfig: HotelConfigDocument = {
      id: `mock-hotel-${mockHotelConfigs.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: 'owner-1',
      isActive: true,
    } as HotelConfigDocument;
    mockHotelConfigs.push(newConfig);
    return HttpResponse.json(newConfig);
  }),

  // Mock PATCH /api/hotel/config/:id
  http.patch('/api/hotel/config/:id', async ({ params, request }: any) => {
    const config = mockHotelConfigs.find(config => config.id === params.id);
    if (!config) {
      return new HttpResponse(null, { status: 404 });
    }
    const updates = await request.json() as Partial<HotelConfigFormData>;
    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date(),
    } as HotelConfigDocument;
    const index = mockHotelConfigs.findIndex(c => c.id === params.id);
    mockHotelConfigs[index] = updatedConfig;
    return HttpResponse.json(updatedConfig);
  }),

  // Mock POST /api/hotel/config/current
  http.post('/api/hotel/config/current', async ({ request }: any) => {
    const { configId } = await request.json() as SetCurrentConfigRequest;
    const config = mockHotelConfigs.find(config => config.id === configId);
    if (!config) {
      return new HttpResponse(null, { status: 404 });
    }
    currentConfigId = configId;
    return HttpResponse.json(config);
  }),

  http.post('/api/rooms/bulk', async ({ request }) => {
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
        hotelConfigId: currentConfigId,
        assignedGuests: [],
      });
      mockRooms.push(newRoom);
      return newRoom;
    });
    return HttpResponse.json(createdRooms, { status: 201 });
  }),

  // Guest endpoints
  http.get('/api/guests', () => {
    return HttpResponse.json(mockGuests.filter(g => g.hotelConfigId === currentConfigId));
  }),
  http.get('/api/guests/:id', ({ params }: any) => {
    const guest = mockGuests.find(g => g.id === params.id && g.hotelConfigId === currentConfigId);
    if (!guest) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(guest);
  }),
  http.post('/api/guests', async ({ request }) => {
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    const newGuest = ensureGuestDefaults({
      id: `guest-${Date.now()}`,
      hotelConfigId: currentConfigId,
      name: safeData.name || '',
      email: safeData.email || '',
      phone: safeData.phone || '',
      status: safeData.status || 'booked',
      roomId: safeData.roomId || '',
      reservationStart: safeData.reservationStart || '',
      reservationEnd: safeData.reservationEnd || '',
      checkIn: safeData.checkIn || '',
      checkOut: safeData.checkOut || '',
      keepOpen: typeof safeData.keepOpen === 'boolean' ? safeData.keepOpen : false,
    });
    mockGuests.push(newGuest);
    return HttpResponse.json(newGuest, { status: 201 });
  }),
  http.patch('/api/guests/:id', async ({ params, request }) => {
    const guest = mockGuests.find(g => g.id === params.id && g.hotelConfigId === currentConfigId);
    if (!guest) return new HttpResponse(null, { status: 404 });
    const updates = await request.json();
    Object.assign(guest, ensureGuestDefaults(updates));
    // Sync room status after guest update
    if (guest.roomId) {
      const room = mockRooms.find(r => r.id === guest.roomId && r.hotelConfigId === guest.hotelConfigId);
      recalculateRoomStatus(room);
    }
    return HttpResponse.json(guest);
  }),
];

// Ensure all mockRooms have notes: '' if missing
mockRooms.forEach(room => { if (typeof room.notes !== 'string') room.notes = ''; });

// Ensure all Room objects have assignedGuests (for dynamic creation)
function ensureRoomDefaults(room: any) {
  return {
    ...room,
    assignedGuests: Array.isArray(room.assignedGuests) ? room.assignedGuests : [],
    notes: typeof room.notes === 'string' ? room.notes : '',
  };
}

// Ensure all Guest objects have keepOpen (for dynamic creation)
function ensureGuestDefaults(guest: any) {
  return {
    ...guest,
    keepOpen: typeof guest.keepOpen === 'boolean' ? guest.keepOpen : false,
  };
}

// Utility to recalculate room status based on assigned guests' statuses
function recalculateRoomStatus(room: Room | undefined) {
  if (!room) return;
  const guests = mockGuests.filter(g => g.roomId === room.id && g.hotelConfigId === room.hotelConfigId);
  const capacity = room.capacity || 1;
  if (guests.length === 0) {
    room.status = 'available' as RoomStatus;
    room.assignedGuests = [];
    return;
  }
  room.assignedGuests = guests.map(g => g.id);
  const allCheckedOut = guests.every(g => g.status === 'checked-out');
  const allCheckedIn = guests.every(g => g.status === 'checked-in');
  const allBooked = guests.every(g => g.status === 'booked');
  const checkedInCount = guests.filter(g => g.status === 'checked-in').length;
  const bookedCount = guests.filter(g => g.status === 'booked').length;
  if (allCheckedOut) {
    room.status = 'cleaning' as RoomStatus;
  } else if (allCheckedIn && guests.length === capacity) {
    room.status = 'occupied' as RoomStatus;
  } else if (allBooked && guests.length === capacity) {
    room.status = 'reserved' as RoomStatus;
  } else if (checkedInCount > 0) {
    room.status = 'partially-occupied' as RoomStatus;
  } else if (bookedCount > 0) {
    room.status = 'partially-reserved' as RoomStatus;
  } else {
    room.status = 'available' as RoomStatus;
  }
} 