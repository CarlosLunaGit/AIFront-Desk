import type { Room, RoomStatus } from '../types/room';
import type { Guest } from '../types/guest';

export function recalculateRoomStatus(room: Room, guests: Guest[]): { status: RoomStatus, keepOpen: boolean } {
  const capacity = room.capacity || 1;
  if (guests.length === 0) {
    return { status: 'available', keepOpen: false };
  }
  // keepOpen: true if all booked guests have keepOpen true, otherwise false
  const bookedGuests = guests.filter(g => g.status === 'booked');
  const keepOpen = bookedGuests.length > 0 && bookedGuests.every(g => g.keepOpen === true);

  const allCheckedOut = guests.every(g => g.status === 'checked-out');
  const allCheckedIn = guests.every(g => g.status === 'checked-in');
  const allBooked = guests.every(g => g.status === 'booked');
  const checkedInCount = guests.filter(g => g.status === 'checked-in').length;
  const bookedCount = guests.filter(g => g.status === 'booked').length;
  const atLeastOneNoKeepOpen = guests.some(g => g.status === 'booked' && g.keepOpen === false);
  const atLeastOneCheckedIn = checkedInCount > 0;
  const atLeastOneNotCheckedIn = guests.some(g => g.status !== 'checked-in');

  if (allCheckedOut) {
    return { status: 'cleaning', keepOpen };
  } else if (allCheckedIn && guests.length === capacity) {
    return { status: 'occupied', keepOpen };
  } else if (allBooked && (atLeastOneNoKeepOpen || guests.length === capacity)) {
    return { status: 'reserved', keepOpen };
  } else if (atLeastOneCheckedIn && atLeastOneNotCheckedIn) {
    return { status: 'partially-occupied', keepOpen };
  } else if (bookedCount > 0 && !atLeastOneNoKeepOpen && guests.length < capacity) {
    return { status: 'partially-reserved', keepOpen };
  } else {
    return { status: 'available', keepOpen };
  }
} 