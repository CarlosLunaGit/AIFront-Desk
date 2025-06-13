export type RoomStatus =
  | 'available'
  | 'partially-reserved'
  | 'reserved'
  | 'partially-occupied'
  | 'occupied'
  | 'cleaning'
  | 'maintenance';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential';
export type RoomFeature = 'wifi' | 'minibar' | 'balcony' | 'ocean-view' | 'jacuzzi' | 'king-bed';

export interface Room {
  id: string;
  number: string;
  typeId: string;
  floorId: string;
  status: RoomStatus;
  features: string[];
  capacity: number;
  rate: number;
  hotelConfigId: string;
  lastCleaned?: string;
  lastMaintenance?: string;
  assignedGuests: string[];
  notes: string;
}

export interface RoomAction {
  id: string;
  roomId: string;
  type: 'check-in' | 'check-out' | 'cleaning' | 'maintenance' | 'inspection';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestedBy: 'staff' | 'guest' | 'ai' | 'system';
  requestedAt: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
}

export interface RoomFilter {
  status?: RoomStatus[];
  type?: RoomType[];
  floor?: number[];
  features?: RoomFeature[];
  minCapacity?: number;
  maxRate?: number;
  searchTerm?: string;
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  cleaning: number;
  reserved: number;
  byType: Record<RoomType, number>;
  byFloor: Record<number, number>;
  occupancyRate: number;
  averageStayDuration: number;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'booked' | 'checked-in' | 'checked-out';
  roomId: string;
  reservationStart: string;
  reservationEnd: string;
  checkIn: string;
  checkOut: string;
  hotelConfigId: string;
  keepOpen: boolean;
} 