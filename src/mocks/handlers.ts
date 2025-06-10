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

// Mock room data
const mockRooms: Room[] = [
  {
    id: '1',
    number: '101',
    type: 'standard',
    status: 'available',
    floor: 1,
    features: ['wifi', 'minibar'],
    capacity: 2,
    rate: 100,
    lastCleaned: '2024-03-09T10:00:00Z',
  },
  {
    id: '2',
    number: '201',
    type: 'deluxe',
    status: 'occupied',
    floor: 2,
    features: ['wifi', 'minibar', 'balcony', 'ocean-view'],
    capacity: 2,
    rate: 200,
    lastCleaned: '2024-03-08T15:00:00Z',
    currentGuest: {
      id: 'guest1',
      name: 'John Doe',
      checkIn: '2024-03-08T14:00:00Z',
      checkOut: '2024-03-10T12:00:00Z',
    },
  },
  // Add more mock rooms as needed
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
  type?: Room['type'];
  features?: Room['features'];
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
        number: '101',
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
        number: '103',
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
        number: '201',
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
        number: '201',
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
        number: '101',
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

// Mock handlers
export const handlers: HttpHandler[] = [
  // Dashboard stats
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json(mockStats);
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
  http.get('/api/rooms', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status')?.split(',') as RoomStatus[];
    const type = url.searchParams.get('type')?.split(',') as Room['type'][];
    const floor = url.searchParams.get('floor')?.split(',').map(Number);
    const searchTerm = url.searchParams.get('searchTerm');

    let filteredRooms = [...mockRooms];

    if (status) {
      filteredRooms = filteredRooms.filter(room => status.includes(room.status));
    }
    if (type) {
      filteredRooms = filteredRooms.filter(room => type.includes(room.type));
    }
    if (floor) {
      filteredRooms = filteredRooms.filter(room => floor.includes(room.floor));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRooms = filteredRooms.filter(room => 
        room.number.toLowerCase().includes(term) ||
        room.type.toLowerCase().includes(term)
      );
    }

    return HttpResponse.json(filteredRooms);
  }),

  http.get('/api/rooms/:id', ({ params }) => {
    const room = mockRooms.find(r => r.id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(room);
  }),

  http.patch('/api/rooms/:id', async ({ params, request }) => {
    const room = mockRooms.find(r => r.id === params.id);
    if (!room) {
      return new HttpResponse(null, { status: 404 });
    }

    const updates = await request.json() as RoomUpdateRequest;
    const updatedRoom: Room = { ...room, ...updates };
    const index = mockRooms.findIndex(r => r.id === params.id);
    mockRooms[index] = updatedRoom;

    return HttpResponse.json(updatedRoom);
  }),

  http.get('/api/rooms/stats', () => {
    return HttpResponse.json(mockRoomStats);
  }),

  // Room actions endpoints
  http.get('/api/rooms/actions', () => {
    return HttpResponse.json(mockRoomActions);
  }),

  http.post('/api/rooms/actions', async ({ request }) => {
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

  http.patch('/api/rooms/actions/:id', async ({ params, request }) => {
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

    const { guestId, checkIn, checkOut } = await request.json() as RoomAssignRequest;
    const updatedRoom: Room = {
      ...room,
      status: 'occupied' as RoomStatus,
      currentGuest: {
        id: guestId,
        name: 'Guest Name', // In real app, this would come from guest data
        checkIn,
        checkOut,
      },
    };

    const index = mockRooms.findIndex(r => r.id === params.id);
    mockRooms[index] = updatedRoom;

    return HttpResponse.json(updatedRoom);
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
  http.get('/api/hotel/config/:id', ({ params }) => {
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
  http.post('/api/hotel/config', async ({ request }) => {
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
  http.patch('/api/hotel/config/:id', async ({ params, request }) => {
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
  http.post('/api/hotel/config/current', async ({ request }) => {
    const { configId } = await request.json() as SetCurrentConfigRequest;
    const config = mockHotelConfigs.find(config => config.id === configId);
    if (!config) {
      return new HttpResponse(null, { status: 404 });
    }
    currentConfigId = configId;
    return HttpResponse.json(config);
  }),
]; 