export type RoomStatus =
  | 'available'
  | 'partially-reserved'
  | 'reserved'
  | 'partially-occupied'
  | 'occupied'
  | 'deoccupied'
  | 'partially-deoccupied'
  | 'cleaning'
  | 'maintenance';

  export interface RoomType {
    _id: string;
    name: string;
    description?: string;
    baseRate: number;
    defaultCapacity: number;
    capacity: {
      adults: number;
      children?: number;
      total: number;
    };
    features: string[];
    amenities: string[];
    hotelId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } 

export type RoomFeature = 'wifi' | 'minibar' | 'balcony' | 'ocean-view' | 'jacuzzi' | 'king-bed';

export interface Room {
  _id: string;
  number: string;
  typeId: string;
  floorId: string;
  status: RoomStatus;
  rate: number;
  capacity: number;
  features: string[];
  description: string;
  hotelId: string;
  assignedGuests: string[];
  notes: string;
  keepOpen?: boolean;
  lastCleaned?: string;
  lastMaintenance?: string;
  createdAt: string;
  updatedAt: string;
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
  typeId?: string[];
  floor?: number[];
  features?: string[];
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
  byType: Record<string, number>;
  byFloor: Record<number, number>;
  occupancyRate: number;
  averageStayDuration: number;
}
