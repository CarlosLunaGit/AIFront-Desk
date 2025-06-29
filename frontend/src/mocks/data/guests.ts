// Guest mock data - extracted for modularity

export const mockGuests = [
  {
    _id: 'guest-1',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-0101',
    status: 'booked' as const,
    roomId: 'room-101',
    reservationStart: new Date('2024-01-15T15:00:00Z').toISOString(),
    reservationEnd: new Date('2024-01-18T11:00:00Z').toISOString(),
    checkIn: null,
    checkOut: null,
    hotelId: '65b000000000000000000001',
    keepOpen: true,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'guest-2',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    phone: '+1-555-0102',
    status: 'checked-in' as const,
    roomId: 'room-102',
    reservationStart: new Date('2024-01-10T15:00:00Z').toISOString(),
    reservationEnd: new Date('2024-01-15T11:00:00Z').toISOString(),
    checkIn: new Date('2024-01-10T15:30:00Z').toISOString(),
    checkOut: null,
    hotelId: '65b000000000000000000001',
    keepOpen: true,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'guest-3',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    phone: '+1-555-0103',
    status: 'checked-out' as const,
    roomId: 'room-201',
    reservationStart: new Date('2024-01-05T15:00:00Z').toISOString(),
    reservationEnd: new Date('2024-01-08T11:00:00Z').toISOString(),
    checkIn: new Date('2024-01-05T15:30:00Z').toISOString(),
    checkOut: new Date('2024-01-08T10:30:00Z').toISOString(),
    hotelId: '65b000000000000000000001',
    keepOpen: false,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 