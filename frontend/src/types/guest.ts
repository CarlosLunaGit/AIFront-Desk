export type GuestStatus = 'booked' | 'checked-in' | 'checked-out';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: GuestStatus;
  roomId: string;
  reservationStart: string;
  reservationEnd: string;
  checkIn?: string;
  checkOut?: string;
  hotelId: string;
  keepOpen: boolean;
} 