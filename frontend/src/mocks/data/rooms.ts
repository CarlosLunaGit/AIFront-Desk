// Room and Room Type mock data - extracted for modularity

export const mockRoomTypes = [
  {
    _id: 'type-1',
    name: 'Standard Room',
    description: 'Comfortable room with essential amenities',
    capacity: { adults: 2, children: 1, total: 2 },
    baseRate: 150,
    amenities: ['wifi', 'tv', 'ac'],
    hotelId: '65b000000000000000000001',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'type-2',
    name: 'Deluxe Room',
    description: 'Spacious room with premium amenities',
    capacity: { adults: 2, children: 2, total: 2 },
    baseRate: 250,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony'],
    hotelId: '65b000000000000000000001',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'type-3',
    name: 'Premium Suite',
    description: 'Luxury suite with separate living area',
    capacity: { adults: 4, children: 2, total: 4 },
    baseRate: 450,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'kitchenette'],
    hotelId: '65b000000000000000000001',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockRooms = [
  {
    id: 'room-101',
    _id: 'room-101',
    number: '101',
    typeId: 'type-1',
    status: 'reserved' as const,
    rate: 150,
    capacity: 2,
    features: ['feature-3'],
    description: 'Standard room with city view',
    hotelId: '65b000000000000000000001',
    assignedGuests: ['guest-1', 'guest-4'],
    notes: '',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-102',
    _id: 'room-102',
    number: '102',
    typeId: 'type-1',
    status: 'partially-occupied' as const,
    rate: 150,
    capacity: 2,
    features: ['feature-3'],
    description: 'Standard room with garden view',
    hotelId: '65b000000000000000000001',
    assignedGuests: ['guest-2'],
    notes: '',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-201',
    _id: 'room-201',
    number: '201',
    typeId: 'type-2',
    status: 'available' as const,
    rate: 250,
    capacity: 2,
    features: ['feature-3', 'feature-13'],
    description: 'Deluxe room with balcony',
    hotelId: '65b000000000000000000001',
    assignedGuests: [],
    notes: '',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'room-301',
    _id: 'room-301',
    number: '301',
    typeId: 'type-3',
    status: 'available' as const,
    rate: 450,
    capacity: 4,
    features: ['feature-3', 'feature-13', 'feature-14'],
    description: 'Premium suite with panoramic view',
    hotelId: '65b000000000000000000001',
    assignedGuests: [],
    notes: '',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 