import type { Room, RoomStatus } from '../types/room';
import { mockGuests } from '../mocks/data/guests';

export function recalculateRoomStatus(room: Room, performedBy: string = 'system', notes: string = 'Room status recalculated') {
  console.log(`🔄 recalculateRoomStatus called for Room ${room.number}:`, {
    roomId: room._id,
    currentStatus: room.status,
    capacity: room.capacity,
    assignedGuests: room.assignedGuests,
    performedBy,
    notes
  });
  
  if (!room) {
    console.log('❌ recalculateRoomStatus: No room provided');
    return;
  }

  // Find guests assigned to this room
  const roomGuests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
  console.log(`👥 Room ${room.number} guests found:`, roomGuests.map(g => ({ id: g._id, name: g.name, status: g.status, keepOpen: g.keepOpen })));
  
  // 🎯 CRITICAL FIX: Sync assignedGuests array with actual guests
  room.assignedGuests = roomGuests.map(g => g._id);
  console.log(`🔄 Room ${room.number} assignedGuests synced:`, room.assignedGuests);

  if (roomGuests.length === 0) {
    console.log(`✅ Room ${room.number}: No guests assigned, setting status to 'available'`);
    room.status = 'available' as RoomStatus;
    return;
  }

  const capacity = room.capacity || 1;
  console.log(`📊 Room ${room.number} capacity: ${capacity}, guests: ${roomGuests.length}`);
  
  // Separate guests by status
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const checkedOutGuests = roomGuests.filter(g => g.status === 'checked-out');
  
  console.log(`📋 Room ${room.number} guest breakdown:`, {
    booked: bookedGuests.length,
    checkedIn: checkedInGuests.length,
    checkedOut: checkedOutGuests.length,
    total: roomGuests.length
  });

  // Room status logic based on real hotel scenarios
  const allCheckedOut = roomGuests.every(g => g.status === 'checked-out');
  const allCheckedIn = roomGuests.every(g => g.status === 'checked-in');
  const allBooked = roomGuests.every(g => g.status === 'booked');
  const hasCheckedOut = checkedOutGuests.length > 0;
  const hasCheckedIn = checkedInGuests.length > 0;
  const hasBooked = bookedGuests.length > 0;

  console.log(`🔍 Room ${room.number} status conditions:`, {
    allCheckedOut,
    allCheckedIn,
    allBooked,
    hasCheckedOut,
    hasCheckedIn,
    hasBooked
  });

  let newStatus: RoomStatus;

  // Business logic priority (real hotel scenario):
  
  // 1. All guests checked out → needs cleaning
  if (allCheckedOut) {
    newStatus = 'cleaning' as RoomStatus;
    console.log(`🧹 Room ${room.number}: All guests checked out → cleaning`);
  }
  // 2. Mixed checkout scenario → deoccupied states
  else if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
    newStatus = 'partially-deoccupied' as RoomStatus;
    console.log(`🔄 Room ${room.number}: Mixed checkout scenario → partially-deoccupied`);
  }
  // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
  else if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
    newStatus = 'deoccupied' as RoomStatus;
    console.log(`🧹 Room ${room.number}: Some checked out, none remaining → deoccupied`);
  }
  // 4. All checked in scenarios
  else if (allCheckedIn) {
    const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'occupied' as RoomStatus;
      console.log(`🏠 Room ${room.number}: All checked in, at capacity or no keep open → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      console.log(`🏠 Room ${room.number}: All checked in, under capacity → partially-occupied`);
    }
  }
  // 5. Mixed checked-in and booked
  else if (hasCheckedIn && hasBooked) {
    newStatus = 'partially-occupied' as RoomStatus;
    console.log(`🏠 Room ${room.number}: Mixed checked-in and booked → partially-occupied`);
  }
  // 6. All booked scenarios
  else if (allBooked) {
    const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'reserved' as RoomStatus;
      console.log(`📅 Room ${room.number}: All booked, at capacity or no keep open → reserved`);
    } else {
      newStatus = 'partially-reserved' as RoomStatus;
      console.log(`📅 Room ${room.number}: All booked, under capacity → partially-reserved`);
    }
  }
  // 7. Only checked-in guests
  else if (hasCheckedIn && !hasBooked) {
    if (checkedInGuests.length === capacity) {
      newStatus = 'occupied' as RoomStatus;
      console.log(`🏠 Room ${room.number}: Only checked-in, at capacity → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      console.log(`🏠 Room ${room.number}: Only checked-in, under capacity → partially-occupied`);
    }
  }
  // 8. Default fallback
  else {
    newStatus = 'available' as RoomStatus;
    console.log(`✅ Room ${room.number}: Default fallback → available`);
  }

  console.log(`🎯 Room ${room.number} status change: ${room.status} → ${newStatus}`);
  room.status = newStatus;
  // console.log(`🔄 Room ${room.number}: ${newStatus} | Guests: ${roomGuests.map(g => `${g.name}(${g.status},keepOpen:${g.keepOpen})`).join(', ')}`);
}

