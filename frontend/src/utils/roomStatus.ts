import type { Room, RoomStatus } from '../types/room';
import { mockGuests } from '../mocks/data/guests';

export function recalculateRoomStatus(room: any, performedBy: string = 'system', notes: string = 'Room status recalculated') {
  if (!room) return;

  // Find guests assigned to this room
  const roomGuests = mockGuests.filter(g => g.roomId === room.id && g.hotelId === room.hotelId);
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
  console.log(`🔄 Room ${room.number}: ${newStatus} | Guests: ${roomGuests.map(g => `${g.name}(${g.status},keepOpen:${g.keepOpen})`).join(', ')}`);
}

// export function recalculateRoomStatus(room: Room, guests: Guest[]): { status: RoomStatus, keepOpen: boolean } {
//   const capacity = room.capacity || 1;
//   if (guests.length === 0) {
//     return { status: 'available', keepOpen: false };
//   }

//   // Separate guests by status
//   const bookedGuests = guests.filter(g => g.status === 'booked');
//   const checkedInGuests = guests.filter(g => g.status === 'checked-in');
//   const checkedOutGuests = guests.filter(g => g.status === 'checked-out');

//   // Room status logic based on real hotel scenarios
//   const allCheckedOut = guests.every(g => g.status === 'checked-out');
//   const allCheckedIn = guests.every(g => g.status === 'checked-in');
//   const allBooked = guests.every(g => g.status === 'booked');
//   const hasCheckedOut = checkedOutGuests.length > 0;
//   const hasCheckedIn = checkedInGuests.length > 0;
//   const hasBooked = bookedGuests.length > 0;

//   // keepOpen: true if all non-checked-out guests have keepOpen true
//   const activeGuests = guests.filter(g => g.status !== 'checked-out');
//   const keepOpen = activeGuests.length > 0 && activeGuests.every(g => g.keepOpen === true);

//   // Business logic priority (real hotel scenario):
  
//   // 1. All guests checked out → needs cleaning
//   if (allCheckedOut) {
//     return { status: 'cleaning', keepOpen: false };
//   }

//   // 2. Mixed checkout scenario → deoccupied states
//   if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
//     if (checkedOutGuests.length === guests.length - 1) {
//       // Only one guest remaining
//       return { status: 'partially-deoccupied', keepOpen };
//     } else {
//       // Multiple guests remaining
//       return { status: 'partially-deoccupied', keepOpen };
//     }
//   }

//   // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
//   if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
//     return { status: 'deoccupied', keepOpen: false };
//   }

//   // 4. All checked in scenarios
//   if (allCheckedIn) {
//     const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
//     if (guests.length === capacity || anyNoKeepOpen) {
//       return { status: 'occupied', keepOpen };
//     } else {
//       return { status: 'partially-occupied', keepOpen };
//     }
//   }

//   // 5. Mixed checked-in and booked
//   if (hasCheckedIn && hasBooked) {
//     return { status: 'partially-occupied', keepOpen };
//   }

//   // 6. All booked scenarios
//   if (allBooked) {
//     const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
//     if (guests.length === capacity || anyNoKeepOpen) {
//       return { status: 'reserved', keepOpen };
//     } else {
//       return { status: 'partially-reserved', keepOpen };
//     }
//   }

//   // 7. Only checked-in guests
//   if (hasCheckedIn && !hasBooked) {
//     if (checkedInGuests.length === capacity) {
//       return { status: 'occupied', keepOpen };
//     } else {
//       return { status: 'partially-occupied', keepOpen };
//     }
//   }

//   // 8. Default fallback
//   return { status: 'available', keepOpen: false };
// } 