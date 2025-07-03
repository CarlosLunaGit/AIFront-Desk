export type GuestStatus = 'booked' | 'checked-in' | 'checked-out';

export interface Guest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: GuestStatus;
  roomId: string;
  reservationStart: string;
  reservationEnd: string;
  checkIn?: string | null;
  checkOut?: string | null;
  hotelId: string;
  keepOpen: boolean;
  createdAt: string;
  updatedAt: string;
} 