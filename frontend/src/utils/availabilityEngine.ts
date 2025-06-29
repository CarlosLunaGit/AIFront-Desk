// Room Availability Engine
// Calculates room availability based on dates, reservations, and requirements

import { format, parseISO, isWithinInterval, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import type { 
  AvailabilityQuery, 
  AvailableRoom, 
  Room, 
  RoomType, 
  Guest, 
  MultiRoomReservation,
  EnhancedRoomStatus,
  RoomPricing,
  PriceAdjustment,
  DateRange,
  RoomAssignmentSuggestion,
  SuggestedRoomAssignment
} from '../types/reservation';

// Main availability calculation function
export function calculateRoomAvailability(
  query: AvailabilityQuery,
  rooms: Room[],
  roomTypes: RoomType[],
  existingReservations: MultiRoomReservation[],
  guests: Guest[]
): AvailableRoom[] {
  const dateRange = createDateRange(query.checkInDate, query.checkOutDate);
  
  return rooms
    .filter(room => room.hotelId === query.hotelId)
    .map(room => {
      const roomType = roomTypes.find(rt => rt._id === room.roomTypeId);
      if (!roomType) {
        return null;
      }

      const availability = checkRoomAvailability(room, dateRange, existingReservations, guests);
      const pricing = calculateRoomPricing(room, roomType, dateRange);
      const recommendationScore = calculateRecommendationScore(
        room, 
        roomType, 
        query.totalGuests, 
        query.roomPreferences
      );

      return {
        room,
        roomType,
        isAvailable: availability.isAvailable,
        unavailableDates: availability.unavailableDates,
        pricing,
        recommendationScore,
        reasonsUnavailable: availability.reasons
      };
    })
    .filter((room): room is AvailableRoom => room !== null)
    .sort((a, b) => {
      // Sort by availability first, then by recommendation score
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.recommendationScore - a.recommendationScore;
    });
}

// Check if a specific room is available for the given date range
export function checkRoomAvailability(
  room: Room,
  dateRange: DateRange,
  existingReservations: MultiRoomReservation[],
  guests: Guest[]
): {
  isAvailable: boolean;
  unavailableDates: string[];
  reasons: string[];
} {
  const unavailableDates: string[] = [];
  const reasons: string[] = [];

  // Check operational status
  const operationalStatus = determineOperationalStatus(room, dateRange);
  if (operationalStatus.blocked) {
    reasons.push(...operationalStatus.reasons);
    return {
      isAvailable: false,
      unavailableDates: eachDayOfInterval({
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end)
      }).map(date => format(date, 'yyyy-MM-dd')),
      reasons
    };
  }

  // Check existing reservations
  const conflictingReservations = findConflictingReservations(room.id, dateRange, existingReservations);
  
  for (const reservation of conflictingReservations) {
    const reservationStart = parseISO(reservation.checkInDate);
    const reservationEnd = parseISO(reservation.checkOutDate);
    
    // Get conflicting dates
    const conflictDates = eachDayOfInterval({
      start: reservationStart,
      end: addDays(reservationEnd, -1) // Exclude checkout day
    }).filter(date => 
      isWithinInterval(date, {
        start: parseISO(dateRange.start),
        end: addDays(parseISO(dateRange.end), -1)
      })
    );

    unavailableDates.push(...conflictDates.map(date => format(date, 'yyyy-MM-dd')));
    
    if (conflictDates.length > 0) {
      reasons.push(`Reserved by ${reservation.primaryGuest.name} (${reservation.id})`);
    }
  }

  // Check guest occupancy
  const roomGuests = guests.filter(g => g.roomId === room.id);
  const occupiedDates = getGuestOccupiedDates(roomGuests, dateRange);
  unavailableDates.push(...occupiedDates);

  if (occupiedDates.length > 0) {
    reasons.push(`Currently occupied by guests`);
  }

  // Remove duplicates and sort
  const uniqueUnavailableDates = [...new Set(unavailableDates)].sort();

  return {
    isAvailable: uniqueUnavailableDates.length === 0,
    unavailableDates: uniqueUnavailableDates,
    reasons: [...new Set(reasons)]
  };
}

// Calculate pricing for a room over a date range
export function calculateRoomPricing(
  room: Room,
  roomType: RoomType,
  dateRange: DateRange
): RoomPricing {
  const baseRate = room.price || 100; // Fallback price
  const totalNights = dateRange.nights;
  const subtotal = baseRate * totalNights;
  
  const adjustments: PriceAdjustment[] = [];

  // Weekend surcharge (Friday, Saturday nights)
  const weekendNights = countWeekendNights(dateRange);
  if (weekendNights > 0) {
    const weekendSurcharge = weekendNights * 20; // $20 per weekend night
    adjustments.push({
      type: 'weekend',
      description: `Weekend surcharge (${weekendNights} nights)`,
      amount: weekendSurcharge
    });
  }

  // Length of stay discount
  if (totalNights >= 7) {
    const discount = subtotal * 0.1; // 10% discount for 7+ nights
    adjustments.push({
      type: 'length-of-stay',
      description: '7+ nights discount (10%)',
      amount: -discount,
      percentage: 10
    });
  } else if (totalNights >= 3) {
    const discount = subtotal * 0.05; // 5% discount for 3+ nights
    adjustments.push({
      type: 'length-of-stay',
      description: '3+ nights discount (5%)',
      amount: -discount,
      percentage: 5
    });
  }

  // Seasonal adjustment (simple summer/winter pricing)
  const seasonalAdjustment = calculateSeasonalAdjustment(dateRange, subtotal);
  if (seasonalAdjustment.amount !== 0) {
    adjustments.push(seasonalAdjustment);
  }

  const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const finalAmount = Math.max(0, subtotal + totalAdjustments);

  return {
    baseRate,
    totalNights,
    subtotal,
    adjustments,
    finalAmount
  };
}

// Calculate recommendation score for room-guest matching
export function calculateRecommendationScore(
  room: Room,
  roomType: RoomType,
  guestCount: number,
  preferences?: any
): number {
  let score = 50; // Base score

  // Capacity matching (most important factor)
  const capacity = roomType.capacity?.total || room.capacity || 2;
  if (guestCount <= capacity) {
    // Perfect fit gets highest score
    const utilizationRatio = guestCount / capacity;
    if (utilizationRatio >= 0.8) {
      score += 30; // Excellent utilization
    } else if (utilizationRatio >= 0.5) {
      score += 20; // Good utilization
    } else {
      score += 10; // Acceptable but underutilized
    }
  } else {
    // Over capacity - not recommended
    score -= 40;
  }

  // Room type preferences
  if (preferences?.roomTypeIds?.includes(roomType._id)) {
    score += 15;
  }

  // Price considerations (lower price = higher score for budget-conscious)
  const roomPrice = room.price || 100;
  if (roomPrice <= 100) {
    score += 10; // Budget-friendly
  } else if (roomPrice >= 200) {
    score += 5; // Premium option
  }

  // Amenity matching
  if (preferences?.amenities) {
    const matchingAmenities = room.amenities?.filter(amenity => 
      preferences.amenities.includes(amenity)
    ).length || 0;
    score += matchingAmenities * 2;
  }

  // Floor preference
  if (preferences?.floorPreference) {
    const floor = extractFloorFromRoomNumber(room.number);
    if (preferences.floorPreference === 'low' && floor <= 3) {
      score += 5;
    } else if (preferences.floorPreference === 'high' && floor >= 5) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// Generate room assignment suggestions
export function generateRoomAssignmentSuggestions(
  availableRooms: AvailableRoom[],
  totalGuests: number,
  guestPreferences?: any[]
): RoomAssignmentSuggestion[] {
  const suggestions: RoomAssignmentSuggestion[] = [];
  
  // Strategy 1: Single room if possible
  const singleRoomOptions = availableRooms.filter(room => 
    (room.roomType.capacity?.total || room.room.capacity || 2) >= totalGuests
  );
  
  if (singleRoomOptions.length > 0) {
    const bestSingleRoom = singleRoomOptions[0]; // Already sorted by recommendation score
    suggestions.push({
      assignments: [{
        roomId: bestSingleRoom.room.id,
        room: bestSingleRoom.room,
        suggestedGuests: [], // Will be filled when guests are defined
        capacityUtilization: totalGuests / (bestSingleRoom.roomType.capacity?.total || 2),
        preferenceMatch: bestSingleRoom.recommendationScore / 100
      }],
      totalPrice: bestSingleRoom.pricing.finalAmount,
      matchScore: bestSingleRoom.recommendationScore,
      reasoning: `Single ${bestSingleRoom.roomType.name} room accommodates all ${totalGuests} guests`
    });
  }

  // Strategy 2: Multiple rooms for larger groups
  if (totalGuests > 2) {
    const multiRoomSuggestion = generateMultiRoomSuggestion(availableRooms, totalGuests);
    if (multiRoomSuggestion) {
      suggestions.push(multiRoomSuggestion);
    }
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

// Helper Functions

function createDateRange(checkIn: string, checkOut: string): DateRange {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    start: checkIn,
    end: checkOut,
    nights
  };
}

function determineOperationalStatus(room: Room, dateRange: DateRange): {
  blocked: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check maintenance (if room has maintenance fields)
  const roomAny = room as any;
  if (roomAny.maintenanceScheduled) {
    const maintenanceStart = parseISO(roomAny.maintenanceScheduled.start);
    const maintenanceEnd = parseISO(roomAny.maintenanceScheduled.end);
    const requestStart = parseISO(dateRange.start);
    const requestEnd = parseISO(dateRange.end);
    
    // Check if maintenance overlaps with requested dates
    if (
      isWithinInterval(requestStart, { start: maintenanceStart, end: maintenanceEnd }) ||
      isWithinInterval(requestEnd, { start: maintenanceStart, end: maintenanceEnd }) ||
      isWithinInterval(maintenanceStart, { start: requestStart, end: requestEnd })
    ) {
      reasons.push(`Scheduled maintenance: ${roomAny.maintenanceScheduled.reason}`);
    }
  }

  if (roomAny.outOfOrder) {
    reasons.push(`Out of order: ${roomAny.outOfOrder.reason}`);
  }

  if (roomAny.manuallyBlocked) {
    reasons.push(`Blocked: ${roomAny.manuallyBlocked.reason}`);
  }

  return {
    blocked: reasons.length > 0,
    reasons
  };
}

function findConflictingReservations(
  roomId: string,
  dateRange: DateRange,
  reservations: MultiRoomReservation[]
): MultiRoomReservation[] {
  return reservations.filter(reservation => {
    // Check if this reservation has the room
    const hasRoom = reservation.roomAssignments.some(assignment => assignment.roomId === roomId);
    if (!hasRoom) return false;

    // Check if dates overlap
    const reservationStart = parseISO(reservation.checkInDate);
    const reservationEnd = parseISO(reservation.checkOutDate);
    const requestStart = parseISO(dateRange.start);
    const requestEnd = parseISO(dateRange.end);

    // Reservations conflict if they overlap (checkout day doesn't conflict with checkin day)
    return (
      reservationStart < requestEnd && reservationEnd > requestStart
    );
  });
}

function getGuestOccupiedDates(guests: Guest[], dateRange: DateRange): string[] {
  const occupiedDates: string[] = [];

  for (const guest of guests) {
    if (guest.status === 'checked-in' && guest.checkIn && guest.reservationEnd) {
      const guestStart = parseISO(guest.checkIn);
      const guestEnd = parseISO(guest.reservationEnd);
      
      const occupiedPeriod = eachDayOfInterval({
        start: guestStart,
        end: addDays(guestEnd, -1) // Exclude checkout day
      });

      const conflictingDates = occupiedPeriod.filter(date =>
        isWithinInterval(date, {
          start: parseISO(dateRange.start),
          end: addDays(parseISO(dateRange.end), -1)
        })
      );

      occupiedDates.push(...conflictingDates.map(date => format(date, 'yyyy-MM-dd')));
    }
  }

  return occupiedDates;
}

function countWeekendNights(dateRange: DateRange): number {
  const nights = eachDayOfInterval({
    start: parseISO(dateRange.start),
    end: addDays(parseISO(dateRange.end), -1)
  });

  return nights.filter(date => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  }).length;
}

function calculateSeasonalAdjustment(dateRange: DateRange, subtotal: number): PriceAdjustment {
  const startDate = parseISO(dateRange.start);
  const month = startDate.getMonth() + 1; // 1-12

  // Summer season (June-August): +15%
  if (month >= 6 && month <= 8) {
    return {
      type: 'seasonal',
      description: 'Summer season surcharge (15%)',
      amount: subtotal * 0.15,
      percentage: 15
    };
  }

  // Winter holiday season (December-January): +20%
  if (month === 12 || month === 1) {
    return {
      type: 'seasonal',
      description: 'Holiday season surcharge (20%)',
      amount: subtotal * 0.20,
      percentage: 20
    };
  }

  // Off-season discount (February-March): -10%
  if (month >= 2 && month <= 3) {
    return {
      type: 'seasonal',
      description: 'Off-season discount (10%)',
      amount: -subtotal * 0.10,
      percentage: -10
    };
  }

  return {
    type: 'seasonal',
    description: 'Regular season',
    amount: 0
  };
}

function extractFloorFromRoomNumber(roomNumber: string): number {
  const match = roomNumber.match(/^(\d)/);
  return match ? parseInt(match[1]) : 1;
}

function generateMultiRoomSuggestion(
  availableRooms: AvailableRoom[],
  totalGuests: number
): RoomAssignmentSuggestion | null {
  // Simple strategy: try to fit guests in 2 rooms
  const doubleRooms = availableRooms.filter(room => 
    (room.roomType.capacity?.total || room.room.capacity || 2) >= 2
  );

  if (doubleRooms.length >= 2) {
    const room1 = doubleRooms[0];
    const room2 = doubleRooms[1];
    const totalPrice = room1.pricing.finalAmount + room2.pricing.finalAmount;
    const avgScore = (room1.recommendationScore + room2.recommendationScore) / 2;

    return {
      assignments: [
        {
          roomId: room1.room.id,
          room: room1.room,
          suggestedGuests: [],
          capacityUtilization: Math.min(totalGuests / 2, 1) / (room1.roomType.capacity?.total || 2),
          preferenceMatch: room1.recommendationScore / 100
        },
        {
          roomId: room2.room.id,
          room: room2.room,
          suggestedGuests: [],
          capacityUtilization: Math.max(totalGuests - 2, 0) / (room2.roomType.capacity?.total || 2),
          preferenceMatch: room2.recommendationScore / 100
        }
      ],
      totalPrice,
      matchScore: avgScore,
      reasoning: `Two ${room1.roomType.name} rooms for ${totalGuests} guests with optimal space distribution`
    };
  }

  return null;
}

// Enhanced room status determination
export function determineEnhancedRoomStatus(
  room: Room,
  guests: Guest[],
  date: Date = new Date()
): EnhancedRoomStatus {
  const roomAny = room as any;
  
  // Check operational status first
  if (roomAny.maintenanceScheduled) {
    const maintenanceStart = parseISO(roomAny.maintenanceScheduled.start);
    const maintenanceEnd = parseISO(roomAny.maintenanceScheduled.end);
    if (isWithinInterval(date, { start: maintenanceStart, end: maintenanceEnd })) {
      return 'maintenance';
    }
  }

  if (roomAny.outOfOrder) {
    return 'out-of-order';
  }

  if (roomAny.manuallyBlocked) {
    return 'blocked';
  }

  // Check guest-based status
  const roomGuests = guests.filter(g => g.roomId === room.id);
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  
  // Check for checkout pending (guests should checkout today)
  const checkoutPendingGuests = roomGuests.filter(g => 
    g.status === 'checked-in' && 
    g.reservationEnd && 
    isSameDay(parseISO(g.reservationEnd), date)
  );

  if (checkoutPendingGuests.length > 0) {
    return 'checkout-pending';
  }

  // Current logic (unchanged from existing implementation)
  if (checkedInGuests.length > 0 && bookedGuests.length > 0) {
    return 'partially-occupied';
  }
  
  if (checkedInGuests.length > 0) {
    return 'occupied';
  }
  
  if (bookedGuests.length > 0) {
    return 'reserved';
  }

  // Post-checkout cleaning
  if (roomAny.needsCleaning) {
    return 'cleaning';
  }

  return 'available';
} 