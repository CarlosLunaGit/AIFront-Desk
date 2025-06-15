import { useState } from "react";
import { Guest, GuestStatus } from "../types";

// Mock data matching the real Guest interface
const mockGuests: Guest[] = [
  {
    id: "1",
    name: "Alice Smith",
    email: "alice@example.com",
    phone: "123-456-7890",
    status: "booked" as GuestStatus,
    roomId: "101",
    hotelConfigId: "1",
    keepOpen: false,
    reservationStart: "2024-03-20",
    reservationEnd: "2024-03-25",
    checkIn: "",
    checkOut: ""
  },
  {
    id: "2",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "234-567-8901",
    status: "checked-in" as GuestStatus,
    roomId: "102",
    hotelConfigId: "1",
    keepOpen: false,
    reservationStart: "2024-03-19",
    reservationEnd: "2024-03-24",
    checkIn: "2024-03-19T14:00:00",
    checkOut: ""
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "345-678-9012",
    status: "checked-out" as GuestStatus,
    roomId: "103",
    hotelConfigId: "1",
    keepOpen: true,
    reservationStart: "2024-03-15",
    reservationEnd: "2024-03-18",
    checkIn: "2024-03-15T14:00:00",
    checkOut: "2024-03-18T12:00:00"
  }
];

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>(mockGuests);

  const onDeleteGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  const onCheckIn = (id: string) => {
    setGuests(guests.map(g => 
      g.id === id 
        ? { ...g, status: "checked-in" as GuestStatus, checkIn: new Date().toISOString() }
        : g
    ));
  };

  const onCheckOut = (id: string) => {
    setGuests(guests.map(g => 
      g.id === id 
        ? { ...g, status: "checked-out" as GuestStatus, checkOut: new Date().toISOString() }
        : g
    ));
  };

  const onToggleKeepOpen = (id: string) => {
    setGuests(guests.map(g => 
      g.id === id 
        ? { ...g, keepOpen: !g.keepOpen }
        : g
    ));
  };

  return { guests, onDeleteGuest, onCheckIn, onCheckOut, onToggleKeepOpen };
} 