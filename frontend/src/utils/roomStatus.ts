import type { Room, RoomStatus } from '../types/room';
import { mockGuests } from '../mocks/data/guests';

export function recalculateRoomStatus(room: Room, performedBy: string = 'system', notes: string = 'Room status recalculated') {
  console.log('recalculateRoomStatus', room);
  if (!room) return;

  // Find guests assigned to this room
  const roomGuests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
  room.assignedGuests = roomGuests.map(g => g._id);

  if (roomGuests.length === 0) {
    room.status = 'available' as RoomStatus;
    return;
  }

  const capacity = room.capacity || 1;
  
  // Separate guests by status
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const checkedOutGuests = roomGuests.filter(g => g.status === 'checked-out');

  // Room status logic based on real hotel scenarios
  const allCheckedOut = roomGuests.every(g => g.status === 'checked-out');
  const allCheckedIn = roomGuests.every(g => g.status === 'checked-in');
  const allBooked = roomGuests.every(g => g.status === 'booked');
  const hasCheckedOut = checkedOutGuests.length > 0;
  const hasCheckedIn = checkedInGuests.length > 0;
  const hasBooked = bookedGuests.length > 0;

  let newStatus: RoomStatus;

  // Business logic priority (real hotel scenario):
  
  // 1. All guests checked out → needs cleaning
  if (allCheckedOut) {
    newStatus = 'cleaning' as RoomStatus;
  }
  // 2. Mixed checkout scenario → deoccupied states
  else if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
    newStatus = 'partially-deoccupied' as RoomStatus;
  }
  // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
  else if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
    newStatus = 'deoccupied' as RoomStatus;
  }
  // 4. All checked in scenarios
  else if (allCheckedIn) {
    const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'occupied' as RoomStatus;
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
    }
  }
  // 5. Mixed checked-in and booked
  else if (hasCheckedIn && hasBooked) {
    newStatus = 'partially-occupied' as RoomStatus;
  }
  // 6. All booked scenarios
  else if (allBooked) {
    const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'reserved' as RoomStatus;
    } else {
      newStatus = 'partially-reserved' as RoomStatus;
    }
  }
  // 7. Only checked-in guests
  else if (hasCheckedIn && !hasBooked) {
    if (checkedInGuests.length === capacity) {
      newStatus = 'occupied' as RoomStatus;
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
    }
  }
  // 8. Default fallback
  else {
    newStatus = 'available' as RoomStatus;
  }

  room.status = newStatus;
  // console.log(`🔄 Room ${room.number}: ${newStatus} | Guests: ${roomGuests.map(g => `${g.name}(${g.status},keepOpen:${g.keepOpen})`).join(', ')}`);
}

