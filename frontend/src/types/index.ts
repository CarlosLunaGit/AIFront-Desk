export type GuestStatus = 'booked' | 'checked-in' | 'checked-out';
export type RoomStatus = 'available' | 'reserved' | 'partially-reserved' | 'occupied' | 'partially-occupied' | 'cleaning' | 'maintenance';

// Re-export communication types
export * from './communication';

export interface Guest {
  id: string;
  roomId: string;
  hotelConfigId: string;
  status: GuestStatus;
  keepOpen: boolean;
  name: string;
  email: string;
  phone: string;
  reservationStart: string;
  reservationEnd: string;
  checkIn: string;
  checkOut: string;
}

export interface Room {
  id: string;
  number: string;
  hotelConfigId: string;
  capacity: number;
  assignedGuests: string[];
  status: RoomStatus;
  keepOpen: boolean;
  features: string[];
  typeId: string;
  floorId: string;
  rate: number;
  notes: string;
} 