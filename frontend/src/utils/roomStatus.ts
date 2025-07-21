import type { Room, RoomStatus } from '../types/room';
import { mockGuests } from '../mocks/data/guests';
import { mockReservations } from '../mocks/data/reservations';
import { Reservation } from '@/types/reservation';

export function recalculateRoomStatus(room: Room, performedBy: string = 'system', notes: string = 'Room status recalculated') {
  // console.log(`🔄 recalculateRoomStatus called for Room ${room.number}:`, {
  //   roomId: room._id,
  //   currentStatus: room.status,
  //   capacity: room.capacity,
  //   assignedGuests: room.assignedGuests,
  //   performedBy,
  //   notes
  // });
  
  if (!room) {
    // console.log('❌ recalculateRoomStatus: No room provided');
    return;
  }

  // Find guests assigned to this room
  const roomGuests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
  // console.log(`👥 Room ${room.number} guests found:`, roomGuests.map(g => ({ id: g._id, name: g.name, status: g.status, keepOpen: g.keepOpen })));
  
  // 🎯 CRITICAL FIX: Sync assignedGuests array with actual guests
  room.assignedGuests = roomGuests.map(g => g._id);
  // console.log(`🔄 Room ${room.number} assignedGuests synced:`, room.assignedGuests);

  if (roomGuests.length === 0) {
    // console.log(`✅ Room ${room.number}: No guests assigned, setting status to 'available'`);
    room.status = 'available' as RoomStatus;
    return;
  }

  const capacity = room.capacity || 1;
  // console.log(`📊 Room ${room.number} capacity: ${capacity}, guests: ${roomGuests.length}`);
  
  // Separate guests by status
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const checkedOutGuests = roomGuests.filter(g => g.status === 'checked-out');
  
  // console.log(`📋 Room ${room.number} guest breakdown:`, {
  //   booked: bookedGuests.length,
  //   checkedIn: checkedInGuests.length,
  //   checkedOut: checkedOutGuests.length,
  //   total: roomGuests.length
  // });

  // Room status logic based on real hotel scenarios
  const allCheckedOut = roomGuests.every(g => g.status === 'checked-out');
  const allCheckedIn = roomGuests.every(g => g.status === 'checked-in');
  const allBooked = roomGuests.every(g => g.status === 'booked');
  const hasCheckedOut = checkedOutGuests.length > 0;
  const hasCheckedIn = checkedInGuests.length > 0;
  const hasBooked = bookedGuests.length > 0;

  // console.log(`🔍 Room ${room.number} status conditions:`, {
  //   allCheckedOut,
  //   allCheckedIn,
  //   allBooked,
  //   hasCheckedOut,
  //   hasCheckedIn,
  //   hasBooked
  // });

  let newStatus: RoomStatus;

  // Business logic priority (real hotel scenario):
  
  // 1. All guests checked out → needs cleaning
  if (allCheckedOut) {
    newStatus = 'cleaning' as RoomStatus;
    // console.log(`🧹 Room ${room.number}: All guests checked out → cleaning`);
  }
  // 2. Mixed checkout scenario → deoccupied states
  else if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
    newStatus = 'partially-deoccupied' as RoomStatus;
    // console.log(`🔄 Room ${room.number}: Mixed checkout scenario → partially-deoccupied`);
  }
  // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
  else if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
    newStatus = 'deoccupied' as RoomStatus;
    // console.log(`🧹 Room ${room.number}: Some checked out, none remaining → deoccupied`);
  }
  // 4. All checked in scenarios
  else if (allCheckedIn) {
    const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number}: All checked in, at capacity or no keep open → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number}: All checked in, under capacity → partially-occupied`);
    }
  }
  // 5. Mixed checked-in and booked
  else if (hasCheckedIn && hasBooked) {
    newStatus = 'partially-occupied' as RoomStatus;
    // console.log(`🏠 Room ${room.number}: Mixed checked-in and booked → partially-occupied`);
  }
  // 6. All booked scenarios
  else if (allBooked) {
    const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
    if (roomGuests.length === capacity || anyNoKeepOpen) {
      newStatus = 'reserved' as RoomStatus;
      // console.log(`📅 Room ${room.number}: All booked, at capacity or no keep open → reserved`);
    } else {
      newStatus = 'partially-reserved' as RoomStatus;
      // console.log(`📅 Room ${room.number}: All booked, under capacity → partially-reserved`);
    }
  }
  // 7. Only checked-in guests
  else if (hasCheckedIn && !hasBooked) {
    if (checkedInGuests.length === capacity) {
      newStatus = 'occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number}: Only checked-in, at capacity → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number}: Only checked-in, under capacity → partially-occupied`);
    }
  }
  // 8. Default fallback
  else {
    newStatus = 'available' as RoomStatus;
    // console.log(`✅ Room ${room.number}: Default fallback → available`);
  }

  // console.log(`🎯 Room ${room.number} status change: ${room.status} → ${newStatus}`);
  room.status = newStatus;
  // // console.log(`🔄 Room ${room.number}: ${newStatus} | Guests: ${roomGuests.map(g => `${g.name}(${g.status},keepOpen:${g.keepOpen})`).join(', ')}`);
}

/**
 * Calculate room status for a specific date
 * This considers reservations and guest schedules for the given date
 */
export function calculateRoomStatusForDate(
  room: Room, 
  targetDate: Date, 
  performedBy: string = 'system', 
  notes: string = 'Room status calculated for specific date'
): { status: RoomStatus, keepOpen: boolean, guestsOnDate: any[], reservationsOnDate: any[] } {
  // console.log(`📅 calculateRoomStatusForDate called for Room ${room.number} on ${targetDate.toISOString().split('T')[0]}:`, {
  //   roomId: room._id,
  //   currentStatus: room.status,
  //   capacity: room.capacity,
  //   targetDate: targetDate.toISOString().split('T')[0],
  //   performedBy,
  //   notes
  // });
  
  if (!room) {
    // console.log('❌ calculateRoomStatusForDate: No room provided');
    return { status: 'available' as RoomStatus, keepOpen: false, guestsOnDate: [], reservationsOnDate: [] };
  }

  const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Find active reservations that include this date
  const reservationsOnDate = mockReservations.filter((res : Reservation) => {
    if (res.roomId !== room._id || res.hotelId !== room.hotelId) return false;
    if (res.status !== 'active' && res.reservationStatus !== 'active') return false;
    
    // Convert to date-only strings for day-level comparison (YYYY-MM-DD)
    const reservationStartDate = res.reservationStart.split('T')[0]; // "2024-01-15"
    const reservationEndDate = res.reservationEnd.split('T')[0];     // "2024-01-18"
    const targetDateOnly = targetDateStr;                            // "2024-01-15"
    
    // Date comparison logic now working correctly with day-level comparison
    
    // Check if target date falls within reservation period (inclusive of both start and end)
    // Hotel business logic: checkout day should still be reserved until guest leaves
    // Use string comparison for date-only comparison (YYYY-MM-DD format)
    return targetDateOnly >= reservationStartDate && targetDateOnly <= reservationEndDate;
  });

  // Find guests who should be in the room on this date
  const guestsOnDate = mockGuests.filter(g => {
    if (g.roomId !== room._id || g.hotelId !== room.hotelId) return false;
    
    // Convert to date-only strings for day-level comparison (YYYY-MM-DD)
    const guestStartDate = g.reservationStart.split('T')[0]; // "2024-01-15"
    const guestEndDate = g.reservationEnd.split('T')[0];     // "2024-01-18"
    const targetDateOnly = targetDateStr;                    // "2024-01-15"
    
    // Check if target date falls within guest's reservation period (inclusive of both start and end)
    // Hotel business logic: checkout day should still show guests present until they leave
    return targetDateOnly >= guestStartDate && targetDateOnly <= guestEndDate;
  });

  // console.log(`📊 Room ${room.number} on ${targetDateStr}:`, {
  //   reservationsOnDate: reservationsOnDate.length,
  //   guestsOnDate: guestsOnDate.length,
  //   reservationIds: reservationsOnDate.map(r => r._id),
  //   guestNames: guestsOnDate.map(g => g.name)
  // });

  // If no reservations or guests for this date, room is available
  if (reservationsOnDate.length === 0 && guestsOnDate.length === 0) {
    // console.log(`✅ Room ${room.number} on ${targetDateStr}: No reservations or guests → available`);
    return { 
      status: 'available' as RoomStatus, 
      keepOpen: false, 
      guestsOnDate, 
      reservationsOnDate 
    };
  }

  const capacity = room.capacity || 1;
  // console.log(`📊 Room ${room.number} capacity: ${capacity}, guests on date: ${guestsOnDate.length}`);
  
  // Determine guest statuses for this specific date
  const bookedGuests = guestsOnDate.filter(g => g.status === 'booked');
  const checkedInGuests = guestsOnDate.filter(g => g.status === 'checked-in');
  const checkedOutGuests = guestsOnDate.filter(g => g.status === 'checked-out');
  
  // console.log(`📋 Room ${room.number} guest breakdown on ${targetDateStr}:`, {
  //   booked: bookedGuests.length,
  //   checkedIn: checkedInGuests.length,
  //   checkedOut: checkedOutGuests.length,
  //   total: guestsOnDate.length
  // });

  // Room status logic for specific date
  const allCheckedOut = guestsOnDate.length > 0 && guestsOnDate.every(g => g.status === 'checked-out');
  const allCheckedIn = guestsOnDate.length > 0 && guestsOnDate.every(g => g.status === 'checked-in');
  const allBooked = guestsOnDate.length > 0 && guestsOnDate.every(g => g.status === 'booked');
  const hasCheckedOut = checkedOutGuests.length > 0;
  const hasCheckedIn = checkedInGuests.length > 0;
  const hasBooked = bookedGuests.length > 0;

  // Calculate keepOpen based on guests on this date
  const keepOpen = guestsOnDate.length > 0 && guestsOnDate.every(g => g.keepOpen === true);

  // console.log(`🔍 Room ${room.number} status conditions on ${targetDateStr}:`, {
  //   allCheckedOut,
  //   allCheckedIn,
  //   allBooked,
  //   hasCheckedOut,
  //   hasCheckedIn,
  //   hasBooked,
  //   keepOpen
  // });

  let newStatus: RoomStatus;

  // Business logic for specific date:
  
  // 1. All guests checked out on this date → needs cleaning
  if (allCheckedOut) {
    newStatus = 'cleaning' as RoomStatus;
    // console.log(`🧹 Room ${room.number} on ${targetDateStr}: All guests checked out → cleaning`);
  }
  // 2. Mixed checkout scenario → deoccupied states
  else if (hasCheckedOut && (hasCheckedIn || hasBooked)) {
    newStatus = 'partially-deoccupied' as RoomStatus;
    // console.log(`🔄 Room ${room.number} on ${targetDateStr}: Mixed checkout scenario → partially-deoccupied`);
  }
  // 3. Some guests checked out, none remaining → deoccupied (needs cleaning)
  else if (hasCheckedOut && !hasCheckedIn && !hasBooked) {
    newStatus = 'deoccupied' as RoomStatus;
    // console.log(`🧹 Room ${room.number} on ${targetDateStr}: Some checked out, none remaining → deoccupied`);
  }
  // 4. All checked in scenarios
  else if (allCheckedIn) {
    const anyNoKeepOpen = checkedInGuests.some(g => g.keepOpen === false);
    if (guestsOnDate.length === capacity || anyNoKeepOpen) {
      newStatus = 'occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number} on ${targetDateStr}: All checked in, at capacity or no keep open → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number} on ${targetDateStr}: All checked in, under capacity → partially-occupied`);
    }
  }
  // 5. Mixed checked-in and booked
  else if (hasCheckedIn && hasBooked) {
    newStatus = 'partially-occupied' as RoomStatus;
    // console.log(`🏠 Room ${room.number} on ${targetDateStr}: Mixed checked-in and booked → partially-occupied`);
  }
  // 6. All booked scenarios
  else if (allBooked) {
    const anyNoKeepOpen = bookedGuests.some(g => g.keepOpen === false);
    if (guestsOnDate.length === capacity || anyNoKeepOpen) {
      newStatus = 'reserved' as RoomStatus;
      // console.log(`📅 Room ${room.number} on ${targetDateStr}: All booked, at capacity or no keep open → reserved`);
    } else {
      newStatus = 'partially-reserved' as RoomStatus;
      // console.log(`📅 Room ${room.number} on ${targetDateStr}: All booked, under capacity → partially-reserved`);
    }
  }
  // 7. Only checked-in guests
  else if (hasCheckedIn && !hasBooked) {
    if (checkedInGuests.length === capacity) {
      newStatus = 'occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number} on ${targetDateStr}: Only checked-in, at capacity → occupied`);
    } else {
      newStatus = 'partially-occupied' as RoomStatus;
      // console.log(`🏠 Room ${room.number} on ${targetDateStr}: Only checked-in, under capacity → partially-occupied`);
    }
  }
  // 8. Default fallback
  else {
    newStatus = 'available' as RoomStatus;
    // console.log(`✅ Room ${room.number} on ${targetDateStr}: Default fallback → available`);
  }

  // console.log(`🎯 Room ${room.number} status for ${targetDateStr}: ${newStatus} (keepOpen: ${keepOpen})`);
  
  return { 
    status: newStatus, 
    keepOpen, 
    guestsOnDate, 
    reservationsOnDate 
  };
}

