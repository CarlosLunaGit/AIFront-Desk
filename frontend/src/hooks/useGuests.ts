import { useState } from "react";
import { Guest, GuestStatus } from "../types/guest";
import { mockGuests } from "../mocks/data/guests";

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>(mockGuests);

  const onDeleteGuest = (id: string) => {
    setGuests(guests.filter(g => g._id !== id));
  };

  const onCheckIn = (id: string) => {
    setGuests(guests.map(g => 
      g._id === id 
        ? { ...g, status: "checked-in" as GuestStatus, checkIn: new Date().toISOString() }
        : g
    ));
  };

  const onCheckOut = (id: string) => {
    setGuests(guests.map(g => 
      g._id === id 
        ? { ...g, status: "checked-out" as GuestStatus, checkOut: new Date().toISOString() }
        : g
    ));
  };

  const onToggleKeepOpen = (id: string) => {
    setGuests(guests.map(g => 
      g._id === id 
        ? { ...g, keepOpen: !g.keepOpen }
        : g
    ));
  };

  return { guests, onDeleteGuest, onCheckIn, onCheckOut, onToggleKeepOpen };
} 
