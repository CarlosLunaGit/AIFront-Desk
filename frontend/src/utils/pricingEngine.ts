// Pricing Engine
// Calculates detailed pricing with seasonal adjustments, surcharges, and discounts

import { parseISO, format, eachDayOfInterval, addDays } from 'date-fns';
import type {
  ReservationPricing,
  PricingBreakdown,
  PriceAdjustment,
  DateRange,
  PricingCalculationRequest,
  PricingCalculationResponse
} from '../types/reservation';
import { Room } from '../types/room';
import { RoomType } from '../types/room';

// Main pricing calculation function
export function calculateReservationPricing(
  rooms: Room[],
  roomTypes: RoomType[],
  checkInDate: string,
  checkOutDate: string,
  hotelId: string
): ReservationPricing {
  const dateRange = createDateRange(checkInDate, checkOutDate);
  const breakdown: PricingBreakdown[] = [];
  
  for (const room of rooms) {
    const roomType = roomTypes.find(rt => rt._id === room.typeId);
    if (!roomType) continue;

    const roomBreakdown = calculateRoomBreakdown(room, roomType, dateRange);
    breakdown.push(roomBreakdown);
  }

  // Calculate totals
  const subtotal = breakdown.reduce((sum, item) => sum + item.baseAmount, 0);
  const totalAdjustments = breakdown.reduce((sum, item) => 
    sum + item.adjustments.reduce((adjSum, adj) => adjSum + adj.amount, 0), 0
  );
  
  // Calculate taxes and fees
  const taxes = calculateTaxes(subtotal + totalAdjustments);
  const fees = calculateFees(subtotal + totalAdjustments, dateRange.nights);
  
  const total = subtotal + totalAdjustments + taxes + fees;

  return {
    breakdown,
    subtotal,
    taxes,
    fees,
    total,
    currency: 'USD'
  };
}

// Calculate pricing breakdown for a single room
export function calculateRoomBreakdown(
  room: Room,
  roomType: RoomType,
  dateRange: DateRange
): PricingBreakdown {
  const baseRate = room.rate || roomType.baseRate || 100;
  const baseAmount = baseRate * dateRange.nights;
  const adjustments: PriceAdjustment[] = [];

  // Weekend surcharge
  const weekendAdjustment = calculateWeekendSurcharge(dateRange, baseRate);
  if (weekendAdjustment.amount > 0) {
    adjustments.push(weekendAdjustment);
  }

  // Seasonal adjustments
  const seasonalAdjustment = calculateSeasonalAdjustment(dateRange, baseAmount);
  if (seasonalAdjustment.amount !== 0) {
    adjustments.push(seasonalAdjustment);
  }

  // Length of stay discounts
  const lengthOfStayDiscount = calculateLengthOfStayDiscount(dateRange, baseAmount);
  if (lengthOfStayDiscount.amount < 0) {
    adjustments.push(lengthOfStayDiscount);
  }

  // Early booking discount (if booking is made 30+ days in advance)
  const earlyBookingDiscount = calculateEarlyBookingDiscount(dateRange, baseAmount);
  if (earlyBookingDiscount.amount < 0) {
    adjustments.push(earlyBookingDiscount);
  }

  const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const finalAmount = Math.max(0, baseAmount + totalAdjustments);

  return {
    roomId: room._id,
    roomNumber: room.number,
    roomType: roomType.name,
    description: `${roomType.name} - ${dateRange.nights} night${dateRange.nights > 1 ? 's' : ''}`,
    baseAmount,
    adjustments,
    finalAmount
  };
}

// Calculate weekend surcharge
export function calculateWeekendSurcharge(
  dateRange: DateRange,
  baseRate: number
): PriceAdjustment {
  const nights = eachDayOfInterval({
    start: parseISO(dateRange.start),
    end: addDays(parseISO(dateRange.end), -1)
  });

  const weekendNights = nights.filter(date => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  });

  if (weekendNights.length === 0) {
    return {
      type: 'weekend',
      description: 'Weekend surcharge',
      amount: 0
    };
  }

  const surchargePerNight = baseRate * 0.25; // 25% surcharge
  const totalSurcharge = weekendNights.length * surchargePerNight;

  return {
    type: 'weekend',
    description: `Weekend surcharge (${weekendNights.length} night${weekendNights.length > 1 ? 's' : ''} at 25%)`,
    amount: totalSurcharge,
    percentage: 25
  };
}

// Calculate seasonal adjustments
export function calculateSeasonalAdjustment(
  dateRange: DateRange,
  baseAmount: number
): PriceAdjustment {
  const startDate = parseISO(dateRange.start);
  const month = startDate.getMonth() + 1; // 1-12

  // Peak season (June-August): +20%
  if (month >= 6 && month <= 8) {
    return {
      type: 'seasonal',
      description: 'Peak summer season (20% surcharge)',
      amount: baseAmount * 0.20,
      percentage: 20
    };
  }

  // Holiday season (December): +25%
  if (month === 12) {
    return {
      type: 'seasonal',
      description: 'Holiday season (25% surcharge)',
      amount: baseAmount * 0.25,
      percentage: 25
    };
  }

  // High season (May, September): +10%
  if (month === 5 || month === 9) {
    return {
      type: 'seasonal',
      description: 'High season (10% surcharge)',
      amount: baseAmount * 0.10,
      percentage: 10
    };
  }

  // Off-season (January-March): -15%
  if (month >= 1 && month <= 3) {
    return {
      type: 'seasonal',
      description: 'Off-season discount (15%)',
      amount: -baseAmount * 0.15,
      percentage: -15
    };
  }

  // Shoulder season (April, October-November): -5%
  if (month === 4 || (month >= 10 && month <= 11)) {
    return {
      type: 'seasonal',
      description: 'Shoulder season discount (5%)',
      amount: -baseAmount * 0.05,
      percentage: -5
    };
  }

  return {
    type: 'seasonal',
    description: 'Regular season',
    amount: 0
  };
}

// Calculate length of stay discounts
export function calculateLengthOfStayDiscount(
  dateRange: DateRange,
  baseAmount: number
): PriceAdjustment {
  const nights = dateRange.nights;

  if (nights >= 14) {
    // 2+ weeks: 20% discount
    return {
      type: 'length-of-stay',
      description: 'Extended stay discount - 14+ nights (20%)',
      amount: -baseAmount * 0.20,
      percentage: -20
    };
  }

  if (nights >= 7) {
    // 1+ week: 15% discount
    return {
      type: 'length-of-stay',
      description: 'Weekly stay discount - 7+ nights (15%)',
      amount: -baseAmount * 0.15,
      percentage: -15
    };
  }

  if (nights >= 4) {
    // 4+ nights: 8% discount
    return {
      type: 'length-of-stay',
      description: 'Multi-night discount - 4+ nights (8%)',
      amount: -baseAmount * 0.08,
      percentage: -8
    };
  }

  if (nights >= 3) {
    // 3+ nights: 5% discount
    return {
      type: 'length-of-stay',
      description: 'Multi-night discount - 3+ nights (5%)',
      amount: -baseAmount * 0.05,
      percentage: -5
    };
  }

  return {
    type: 'length-of-stay',
    description: 'No length of stay discount',
    amount: 0
  };
}

// Calculate early booking discount
export function calculateEarlyBookingDiscount(
  dateRange: DateRange,
  baseAmount: number
): PriceAdjustment {
  const today = new Date();
  const checkInDate = parseISO(dateRange.start);
  const daysInAdvance = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysInAdvance >= 60) {
    // 60+ days: 10% discount
    return {
      type: 'discount',
      description: 'Early booking discount - 60+ days (10%)',
      amount: -baseAmount * 0.10,
      percentage: -10
    };
  }

  if (daysInAdvance >= 30) {
    // 30+ days: 7% discount
    return {
      type: 'discount',
      description: 'Early booking discount - 30+ days (7%)',
      amount: -baseAmount * 0.07,
      percentage: -7
    };
  }

  if (daysInAdvance >= 14) {
    // 14+ days: 5% discount
    return {
      type: 'discount',
      description: 'Early booking discount - 14+ days (5%)',
      amount: -baseAmount * 0.05,
      percentage: -5
    };
  }

  return {
    type: 'discount',
    description: 'No early booking discount',
    amount: 0
  };
}

// Calculate taxes
export function calculateTaxes(subtotalWithAdjustments: number): number {
  // City tax: 3%
  const cityTax = subtotalWithAdjustments * 0.03;
  
  // State tax: 8%
  const stateTax = subtotalWithAdjustments * 0.08;
  
  // Tourism tax: 2%
  const tourismTax = subtotalWithAdjustments * 0.02;

  return cityTax + stateTax + tourismTax; // Total: 13%
}

// Calculate fees
export function calculateFees(subtotalWithAdjustments: number, nights: number): number {
  // Resort fee: $15 per night
  const resortFee = nights * 15;
  
  // Service fee: 2% of subtotal
  const serviceFee = subtotalWithAdjustments * 0.02;
  
  // Cleaning fee: $25 per stay
  const cleaningFee = 25;

  return resortFee + serviceFee + cleaningFee;
}

// Get detailed fee breakdown
export function getFeeBreakdown(subtotalWithAdjustments: number, nights: number): PriceAdjustment[] {
  const breakdown: PriceAdjustment[] = [];

  // Taxes
  breakdown.push({
    type: 'tax',
    description: 'City tax (3%)',
    amount: subtotalWithAdjustments * 0.03,
    percentage: 3
  });

  breakdown.push({
    type: 'tax',
    description: 'State tax (8%)',
    amount: subtotalWithAdjustments * 0.08,
    percentage: 8
  });

  breakdown.push({
    type: 'tax',
    description: 'Tourism tax (2%)',
    amount: subtotalWithAdjustments * 0.02,
    percentage: 2
  });

  // Fees
  breakdown.push({
    type: 'fee',
    description: `Resort fee (${nights} night${nights > 1 ? 's' : ''})`,
    amount: nights * 15
  });

  breakdown.push({
    type: 'fee',
    description: 'Service fee (2%)',
    amount: subtotalWithAdjustments * 0.02,
    percentage: 2
  });

  breakdown.push({
    type: 'fee',
    description: 'Cleaning fee',
    amount: 25
  });

  return breakdown;
}

// Calculate upgrade recommendations
export function calculateUpgradeRecommendations(
  selectedRooms: Room[],
  availableRooms: Room[],
  roomTypes: RoomType[],
  dateRange: DateRange
): Array<{
  roomId: string;
  currentRoom: Room;
  upgradeRoom: Room;
  additionalCost: number;
  benefits: string[];
}> {
  const recommendations: Array<{
    roomId: string;
    currentRoom: Room;
    upgradeRoom: Room;
    additionalCost: number;
    benefits: string[];
  }> = [];

  for (const currentRoom of selectedRooms) {
    const currentRoomType = roomTypes.find(rt => rt._id === currentRoom.typeId);
    if (!currentRoomType) continue;

    // Find potential upgrades (higher price, better amenities)
    const upgradeOptions = availableRooms.filter(room => {
      const roomType = roomTypes.find(rt => rt._id === room.typeId);
      return roomType && 
             room.rate > currentRoom.rate && 
             room._id !== currentRoom._id &&
             !selectedRooms.find(sr => sr._id === room._id);
    });

    for (const upgradeRoom of upgradeOptions.slice(0, 2)) { // Limit to top 2 upgrades
      const upgradeRoomType = roomTypes.find(rt => rt._id === upgradeRoom.typeId);
      if (!upgradeRoomType) continue;

      const currentPricing = calculateRoomBreakdown(currentRoom, currentRoomType, dateRange);
      const upgradePricing = calculateRoomBreakdown(upgradeRoom, upgradeRoomType, dateRange);
      const additionalCost = upgradePricing.finalAmount - currentPricing.finalAmount;

      const benefits = calculateUpgradeBenefits(currentRoom, upgradeRoom, currentRoomType, upgradeRoomType);

      if (benefits.length > 0 && additionalCost <= currentPricing.finalAmount * 0.5) { // Max 50% increase
        recommendations.push({
          roomId: currentRoom._id,
          currentRoom,
          upgradeRoom,
          additionalCost,
          benefits
        });
      }
    }
  }

  return recommendations.sort((a, b) => a.additionalCost - b.additionalCost);
}

// Calculate benefits of upgrading
function calculateUpgradeBenefits(
  currentRoom: Room,
  upgradeRoom: Room,
  currentRoomType: RoomType,
  upgradeRoomType: RoomType
): string[] {
  const benefits: string[] = [];

  // Capacity increase
  const currentCapacity = currentRoomType.defaultCapacity || currentRoom.capacity || 2;
  const upgradeCapacity = upgradeRoomType.defaultCapacity || upgradeRoom.capacity || 2;
  if (upgradeCapacity > currentCapacity) {
    benefits.push(`Accommodates ${upgradeCapacity} guests (vs ${currentCapacity})`);
  }

  // Room type upgrade
  if (upgradeRoomType.name !== currentRoomType.name) {
    benefits.push(`Upgrade to ${upgradeRoomType.name}`);
  }

  // Additional amenities
  const currentAmenities = new Set(currentRoom.features || []);
  const upgradeAmenities = upgradeRoom.features || [];
  const additionalAmenities = upgradeAmenities.filter((amenity: string) => !currentAmenities.has(amenity));
  
  if (additionalAmenities.length > 0) {
    benefits.push(`Additional amenities: ${additionalAmenities.slice(0, 3).join(', ')}`);
  }

  // Better view or location (if room number indicates floor)
  const currentFloor = extractFloorFromRoomNumber(currentRoom.number);
  const upgradeFloor = extractFloorFromRoomNumber(upgradeRoom.number);
  if (upgradeFloor > currentFloor && upgradeFloor >= 5) {
    benefits.push(`Higher floor with better views (Floor ${upgradeFloor})`);
  }

  return benefits;
}

// Helper functions
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

function extractFloorFromRoomNumber(roomNumber: string): number {
  const match = roomNumber.match(/^(\d)/);
  return match ? parseInt(match[1]) : 1;
} 