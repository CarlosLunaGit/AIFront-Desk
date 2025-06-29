// Enhanced Reservation System Handlers - extracted for modularity
import { http, HttpResponse } from 'msw';
import { mockRooms, mockRoomTypes } from '../../data/rooms';

export const enhancedReservationHandlers = [
  // Room Availability Endpoint
  http.get('/api/rooms/availability', ({ request }) => {
    console.log('🚨🚨🚨 ENHANCED ROOM AVAILABILITY ENDPOINT HIT! 🚨🚨🚨', request.url);
    const url = new URL(request.url);
    const checkInDate = url.searchParams.get('checkInDate');
    const checkOutDate = url.searchParams.get('checkOutDate');
    const totalGuests = parseInt(url.searchParams.get('totalGuests') || '2');
    const hotelId = url.searchParams.get('hotelId');

    console.log('🏨 Enhanced Availability Check:', { checkInDate, checkOutDate, totalGuests, hotelId });

    // Filter rooms for the specific hotel
    const hotelRooms = mockRooms.filter(room => room.hotelId === hotelId);
    const hotelRoomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);

    // Calculate availability for each room
    const availableRooms = hotelRooms.map(room => {
      const roomType = hotelRoomTypes.find(rt => rt._id === room.typeId);
      if (!roomType) return null;

      // Simple availability logic - room is available if status allows it
      const isAvailable = ['available', 'partially-reserved'].includes(room.status);
      
      // Calculate base pricing
      const nights = checkInDate && checkOutDate ? 
        Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 1;
      
      const baseRate = room.rate || roomType.baseRate || 100;
      const subtotal = baseRate * nights;
      const taxes = subtotal * 0.12; // 12% tax
      const fees = 25; // Flat fee
      const total = subtotal + taxes + fees;

      return {
        room: {
          id: room.id,
          number: room.number,
          typeId: room.typeId,
          status: room.status,
          rate: room.rate,
          capacity: room.capacity,
          amenities: room.features || [],
          hotelId: room.hotelId
        },
        roomType: {
          id: roomType._id,
          name: roomType.name,
          defaultCapacity: roomType.capacity?.total || 2,
          baseRate: roomType.baseRate,
          amenities: roomType.amenities || []
        },
        isAvailable,
        unavailableDates: isAvailable ? [] : [checkInDate],
        pricing: {
          baseRate,
          subtotal,
          taxes,
          fees,
          total,
          finalAmount: total,
          currency: 'USD',
          adjustments: [],
          breakdown: [
            { type: 'room', description: `${roomType.name} x ${nights} nights`, amount: subtotal },
            { type: 'tax', description: 'Taxes (12%)', amount: taxes },
            { type: 'fee', description: 'Service Fee', amount: fees }
          ]
        },
        recommendationScore: isAvailable ? 85 : 0,
        reasonsUnavailable: isAvailable ? [] : ['Room is currently occupied']
      };
    }).filter(Boolean) as any[];

    console.log('✅ Available Rooms Found:', availableRooms.length);

    return HttpResponse.json({
      availableRooms,
      totalAvailable: availableRooms.filter((r: any) => r.isAvailable).length,
      suggestions: [],
      searchCriteria: {
        checkInDate,
        checkOutDate,
        totalGuests,
        hotelId
      }
    });
  }),

  // Reservation Pricing Endpoint
  http.get('/api/reservations/pricing', ({ request }) => {
    console.log('🎯 MSW: Enhanced Pricing endpoint called!', request.url);
    const url = new URL(request.url);
    const roomIds = url.searchParams.get('roomIds')?.split(',') || [];
    const checkInDate = url.searchParams.get('checkInDate');
    const checkOutDate = url.searchParams.get('checkOutDate');
    const guestCount = parseInt(url.searchParams.get('guestCount') || '2');
    const hotelId = url.searchParams.get('hotelId');

    console.log('💰 Enhanced Pricing Request:', { roomIds, checkInDate, checkOutDate, guestCount, hotelId });

    // Calculate nights
    const nights = checkInDate && checkOutDate ? 
      Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 1;

    // Calculate pricing for selected rooms
    let totalSubtotal = 0;
    const breakdown = [];

    roomIds.forEach(roomId => {
      const room = mockRooms.find(r => r.id === roomId);
      if (room) {
        const roomType = mockRoomTypes.find(rt => rt._id === room.typeId);
        const baseRate = room.rate || roomType?.baseRate || 100;
        const roomSubtotal = baseRate * nights;
        totalSubtotal += roomSubtotal;

        breakdown.push({
          type: 'room',
          description: `${roomType?.name || 'Room'} ${room.number} x ${nights} nights`,
          amount: roomSubtotal,
          details: {
            roomId: room.id,
            roomNumber: room.number,
            baseRate,
            nights
          }
        });
      }
    });

    // Add taxes and fees
    const taxes = totalSubtotal * 0.12;
    const fees = roomIds.length * 25;
    const total = totalSubtotal + taxes + fees;

    breakdown.push(
      { type: 'tax', description: 'Taxes (12%)', amount: taxes },
      { type: 'fee', description: `Service Fees (${roomIds.length} rooms)`, amount: fees }
    );

    const pricing = {
      subtotal: totalSubtotal,
      taxes,
      fees,
      total,
      currency: 'USD',
      breakdown,
      discounts: [],
      finalAmount: total
    };

    console.log('✅ Enhanced Pricing Calculated:', { total, breakdown: breakdown.length });

    return HttpResponse.json({
      pricing,
      roomCount: roomIds.length,
      nights,
      guestCount
    });
  }),

  // Enhanced Reservation Creation Endpoint
  http.post('/api/reservations/enhanced', async ({ request }) => {
    console.log('🎯 MSW: Enhanced Reservation endpoint called!', request.url);
    const reservationData = await request.json() as any;
    console.log('🎯 Creating Enhanced Reservation:', reservationData);

    const newReservationId = `enhanced-res-${Date.now()}`;
    
    const newReservation = {
      id: newReservationId,
      ...reservationData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Enhanced Reservation Created:', newReservationId);

    return HttpResponse.json(newReservation, { status: 201 });
  })
]; 