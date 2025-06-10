export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential';
export type RoomFeature = 'wifi' | 'minibar' | 'balcony' | 'ocean-view' | 'jacuzzi' | 'king-bed';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;
  floor: number;
  features: RoomFeature[];
  capacity: number;
  rate: number;
  lastCleaned?: string;
  lastMaintenance?: string;
  currentGuest?: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  notes?: string;
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