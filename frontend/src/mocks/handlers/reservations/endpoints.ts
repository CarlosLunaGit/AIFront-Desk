// Enhanced Reservation System Handlers - extracted for modularity
import { http, HttpResponse } from 'msw';
import { mockReservations } from '../../data/reservations';
import { mockGuests } from '../../data/guests';
import { mockRooms, mockRoomTypes } from '../../data/rooms';
import { Reservation } from '../../../types/reservation';
import { Guest, GuestStatus } from '../../../types/guest';
import { Room, RoomType } from '../../../types/room';
import { recalculateRoomStatus } from '../../../utils/roomStatus';
import { recalculateReservationsForRoom, recalculateReservationStatus } from '../../data/reservations';

// Sophisticated availability engine
const checkRoomAvailabilityForDates = (room: Room, checkInDate: string, checkOutDate: string): { isAvailable: boolean, conflictingReservations: string[] } => {
  if (!checkInDate || !checkOutDate) {
    return { isAvailable: true, conflictingReservations: [] };
  }

  const requestStart = new Date(checkInDate);
  const requestEnd = new Date(checkOutDate);
  
  // Find all active reservations for this room
  const roomReservations = mockReservations.filter(res => 
    res.roomId === room._id && 
    (res.status === 'active' || res.reservationStatus === 'active')
  );

  const conflictingReservations: string[] = [];

  for (const reservation of roomReservations) {
    const resStart = new Date(reservation.checkInDate);
    const resEnd = new Date(reservation.checkOutDate);
    
    // Check for overlap: (requestStart < resEnd) && (resStart < requestEnd)
    const hasOverlap = (requestStart < resEnd) && (resStart < requestEnd);
    
    if (hasOverlap) {
      conflictingReservations.push(reservation._id);
      // // console.log(`🚫 Room ${room.number}: Conflict with reservation ${reservation._id} (${reservation.checkInDate} to ${reservation.checkOutDate})`);
    }
  }

  return {
    isAvailable: conflictingReservations.length === 0,
    conflictingReservations
  };
};

// Helper function to add a new guest (reused from guest endpoints)
const addMockGuest = (guestData: Partial<Guest>): Guest => {
  const newGuest: Guest = {
    _id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: guestData.name || 'New Guest',
    email: guestData.email || 'newguest@example.com',
    phone: guestData.phone || '1234567890',
    address: guestData.address || '123 Main St, Anytown, USA',
    status: (guestData.status as GuestStatus) || 'booked',
    roomId: guestData.roomId || '',
    reservationStart: guestData.reservationStart || new Date().toISOString(),
    reservationEnd: guestData.reservationEnd || new Date().toISOString(),
    checkIn: guestData.checkIn || null,
    checkOut: guestData.checkOut || null,
    hotelId: guestData.hotelId || '',
    keepOpen: guestData.keepOpen || false,
    createdAt: guestData.createdAt || new Date().toISOString(),
    updatedAt: guestData.updatedAt || new Date().toISOString()
  };
  // CRITICAL: Add guest to mockGuests BEFORE recalculating room status
  mockGuests.push(newGuest);
  // Now update room status based on new guest assignment
  if (newGuest.roomId) {
    const room = mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === newGuest.hotelId);
    if (room) {
      recalculateRoomStatus(room, 'system', 'Triggered by guest assignment');
      // Recalculate reservations for this room
      recalculateReservationsForRoom(newGuest.roomId, 'New guest assigned to room');
    }
  }
  return newGuest;
};

// Helper function to add a new reservation
const addMockReservation = (reservationData: Partial<Reservation>): Reservation => {
  const reservationId = `res-${String(mockReservations.length + 1).padStart(4, '0')}`;
  const newReservation: Reservation = {
    _id: reservationId,
    hotelId: reservationData.hotelId || '',
    roomId: reservationData.roomId || '',
    guestIds: reservationData.guestIds || [],
    confirmationNumber: reservationData.confirmationNumber || `CONF-${Date.now()}`,
    reservationStart: reservationData.reservationStart || new Date().toISOString(),
    reservationEnd: reservationData.reservationEnd || new Date().toISOString(),
    checkInDate: reservationData.checkInDate || new Date().toISOString(),
    checkOutDate: reservationData.checkOutDate || new Date().toISOString(),
    nights: reservationData.nights || 1,
    roomRate: reservationData.roomRate || 0,
    totalAmount: reservationData.totalAmount || 0,
    paidAmount: reservationData.paidAmount || 0,
    currency: reservationData.currency || 'USD',
    status: reservationData.status || 'active',
    reservationStatus: reservationData.reservationStatus || 'active',
    bookingStatus: reservationData.bookingStatus || 'confirmed',
    createdAt: reservationData.createdAt || new Date().toISOString(),
    updatedAt: reservationData.updatedAt || new Date().toISOString(),
    lastStatusChange: reservationData.lastStatusChange || new Date().toISOString(),
    source: reservationData.source || 'direct',
    financials: reservationData.financials || {
      totalAmount: 0,
      paidAmount: 0,
      refundAmount: 0,
      cancellationFee: 0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      transactions: []
    },
    audit: reservationData.audit || {
      statusHistory: [],
      actions: []
    },
    statusHistory: reservationData.statusHistory || [],
    notes: reservationData.notes || '',
    specialRequests: reservationData.specialRequests || '',
    cancelledAt: reservationData.cancelledAt || null,
    cancelledBy: reservationData.cancelledBy || null,
    cancellationReason: reservationData.cancellationReason || null,
    noShowMarkedAt: reservationData.noShowMarkedAt || null,
    terminatedAt: reservationData.terminatedAt || null
  };
  
  mockReservations.push(newReservation);
  
  return newReservation;
};

// Helper function to calculate nights between two dates
const calculateNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Reservation history for audit trail
const reservationHistory: any[] = [];

export const enhancedReservationHandlers = [
  // Room Availability Endpoint
  http.get('/api/rooms/availability', ({ request }) => {
    // console.log('🔍 SOPHISTICATED ROOM AVAILABILITY CHECK');
    
    // 🎯 CRITICAL FIX: Recalculate room status for all rooms before checking availability
    // // console.log('🔄 Recalculating room status for all rooms before availability check...');
    mockRooms.forEach(room => {
      recalculateRoomStatus(room, 'system', 'Availability check trigger');
    });
    
    const url = new URL(request.url);
    const checkInDate = url.searchParams.get('checkInDate');
    const checkOutDate = url.searchParams.get('checkOutDate');
    const totalGuests = parseInt(url.searchParams.get('totalGuests') || '2');
    const hotelId = url.searchParams.get('hotelId');

    // console.log('🏨 Enhanced Availability Check:', { 
    //   checkInDate, 
    //   checkOutDate, 
    //   totalGuests, 
    //   hotelId,
    //   dateRange: checkInDate && checkOutDate ? `${checkInDate} to ${checkOutDate}` : 'No dates specified'
    // });

    // Filter rooms for the specific hotel
    const hotelRooms = mockRooms.filter(room => room.hotelId === hotelId);
    const hotelRoomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);

    // console.log('🔍 Hotel Analysis:', {
    //   totalRooms: hotelRooms.length,
    //   roomTypes: hotelRoomTypes.length,
    //   dateRangeProvided: !!(checkInDate && checkOutDate)
    // });

    // Calculate availability for each room with sophisticated date checking
    const availableRooms = hotelRooms.map(room => {
      const roomType = hotelRoomTypes.find(rt => rt._id === room.typeId);
      if (!roomType) {
        // console.log(`❌ No room type found for room ${room.number} (typeId: ${room.typeId})`);
        return null;
      }

      // 1. Check guest capacity - room must accommodate the requested guests
      const roomCapacity = roomType.capacity?.total || room.capacity || 2;
      const canAccommodateGuests = roomCapacity >= totalGuests;
      
      // 2. SOPHISTICATED DATE-BASED AVAILABILITY CHECK
      const dateAvailability = checkRoomAvailabilityForDates(room, checkInDate || '', checkOutDate || '');
      const isDateAvailable = dateAvailability.isAvailable;

      // 3. Check room status - exclude unavailable rooms
      const unavailableStatuses = [
        'maintenance',       // Under maintenance
        'out-of-order',      // Not functional
      ];
      
      const isRoomStatusAvailable = !unavailableStatuses.includes(room.status);
      
      // Room is available if all checks pass
      const isAvailable = canAccommodateGuests && isRoomStatusAvailable && isDateAvailable;
      
      // Build unavailability reasons
      const reasonsUnavailable = [];
      if (!canAccommodateGuests) {
        reasonsUnavailable.push(`Room capacity (${roomCapacity}) cannot accommodate ${totalGuests} guests`);
      }
      if (!isRoomStatusAvailable) {
        reasonsUnavailable.push(`Room is currently ${room.status}`);
      }
      if (!isDateAvailable) {
        reasonsUnavailable.push(`Room is already booked for the requested dates (conflicts: ${dateAvailability.conflictingReservations.length})`);
      }

      // Enhanced logging for debugging
      if (checkInDate && checkOutDate) {
        // console.log(`🏠 Room ${room.number} (${checkInDate} to ${checkOutDate}):`, {
        //   capacity: `${roomCapacity} (need ${totalGuests})`,
        //   status: room.status,
        //   dateAvailable: isDateAvailable,
        //   conflicts: dateAvailability.conflictingReservations.length,
        //   finalAvailable: isAvailable
        // });
      }

      // Calculate base pricing
      const nights = checkInDate && checkOutDate ? 
        Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 1;
      
      const baseRate = room.rate || roomType.baseRate || 100;
      const subtotal = baseRate * nights;
      const taxes = subtotal * 0.12; // 12% tax
      const fees = 25; // Flat fee
      const total = subtotal + taxes + fees;

      const roomData: Room = {
        _id: room._id,
        number: room.number,
        typeId: room.typeId,
        floorId: room.floorId,
        status: room.status,
        rate: room.rate,
        capacity: room.capacity,
        features: room.features || [],
        description: room.description,
        hotelId: room.hotelId,
        assignedGuests: room.assignedGuests || [],
        notes: room.notes,
        keepOpen: room.keepOpen,
        lastCleaned: room.lastCleaned,
        lastMaintenance: room.lastMaintenance,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }

      const roomTypeData: RoomType = {
        _id: roomType._id,
        name: roomType.name,
        description: roomType.description,
        baseRate: roomType.baseRate,
        defaultCapacity: roomType.capacity?.total || 2,
        capacity: roomType.capacity,
        features: roomType.features || [],
        amenities: roomType.amenities || [],
        hotelId: roomType.hotelId,
        isActive: roomType.isActive,
        createdAt: roomType.createdAt,
        updatedAt: roomType.updatedAt
      }

      return {
        room: roomData,
        roomType: roomTypeData,
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
        reasonsUnavailable,
        conflictingReservations: dateAvailability.conflictingReservations
      };
    }).filter(Boolean) as any[];

    // CRITICAL FIX: Only return rooms that are actually available
    const availableRoomsOnly = availableRooms.filter((r: any) => r.isAvailable);
    const unavailableRooms = availableRooms.filter((r: any) => !r.isAvailable);

    const totalAvailable = availableRoomsOnly.length;
    
    // console.log('✅ SOPHISTICATED AVAILABILITY RESULTS:', {
    //   dateRange: checkInDate && checkOutDate ? `${checkInDate} to ${checkOutDate}` : 'No dates',
    //   totalRooms: availableRooms.length,
    //   availableRooms: totalAvailable,
    //   unavailableRooms: unavailableRooms.length
    // });
    
    // Enhanced unavailable room logging
    if (unavailableRooms.length > 0) {
      // console.log('🚫 Unavailable Rooms Details:');
      unavailableRooms.forEach((room: any) => {
        // console.log(`   Room ${room.room.number}: ${room.reasonsUnavailable.join(', ')}`);
      });
    }

    return HttpResponse.json({
      availableRooms: availableRoomsOnly, // 🎯 ONLY return available rooms
      totalAvailable,
      suggestions: [],
      searchCriteria: {
        checkInDate,
        checkOutDate,
        totalGuests,
        hotelId
      },
      debug: {
        totalRoomsChecked: availableRooms.length,
        unavailableCount: unavailableRooms.length,
        dateBasedFiltering: !!(checkInDate && checkOutDate)
      }
    });
  }),

  // Reservation Pricing Endpoint TODO: Is this to be transfer to the pricing endpoint?
  http.get('/api/reservations/pricing', ({ request }) => {
    // // console.log('🎯 MSW: Enhanced Pricing endpoint called!', request.url);
    const url = new URL(request.url);
    const roomIds = url.searchParams.get('roomIds')?.split(',') || [];
    const checkInDate = url.searchParams.get('checkInDate');
    const checkOutDate = url.searchParams.get('checkOutDate');
    const guestCount = parseInt(url.searchParams.get('guestCount') || '2');
    // const hotelId = url.searchParams.get('hotelId'); // Commented out unused variable

    // // console.log('💰 Enhanced Pricing Request:', { roomIds, checkInDate, checkOutDate, guestCount, hotelId });

    // Calculate nights
    const nights = checkInDate && checkOutDate ? 
      Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 1;

    // Calculate pricing for selected rooms
    let totalSubtotal = 0;
    const breakdown = [];

    roomIds.forEach(roomId => {
      const room = mockRooms.find(r => r._id === roomId);
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
            roomId: room._id,
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

    // // console.log('✅ Enhanced Pricing Calculated:', { total, breakdown: breakdown.length });

    return HttpResponse.json({
      pricing,
      roomCount: roomIds.length,
      nights,
      guestCount
    });
  }),

  // Enhanced Reservation Creation Endpoint
  http.post('/api/reservations/enhanced', async ({ request }) => {
    // console.log('🎯 MSW: Enhanced Reservation endpoint called!', request.url);
    const reservationData = await request.json() as any;
    // console.log('🎯 Creating Enhanced Reservation:', reservationData);

    const newReservationId = `enhanced-res-${Date.now()}`;
    
    // Normalize specialRequests to always be an array
    const normalizedSpecialRequests = Array.isArray(reservationData.specialRequests) 
      ? reservationData.specialRequests 
      : (reservationData.specialRequests ? [reservationData.specialRequests] : []);
    
    const newReservation = {
      id: newReservationId,
      ...reservationData,
      specialRequests: normalizedSpecialRequests, // Always store as array
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 🎯 CRITICAL FIX: Create actual reservation records for date-based availability
    const createdReservations: string[] = [];
    
    // 🎯 CRITICAL FIX: Assign guests to rooms and update room status
    if (reservationData.roomAssignments && Array.isArray(reservationData.roomAssignments)) {
      for (const assignment of reservationData.roomAssignments) {
        const roomId = assignment.roomId;
        const room = mockRooms.find(r => r._id === roomId);
        
        if (room && assignment.guests && Array.isArray(assignment.guests)) {
          // console.log(`🔄 BEFORE: Room ${room.number} status:`, room.status, 'assignedGuests:', room.assignedGuests);
          
          // Create guests and assign them to the room
          const guestIds: string[] = [];
          for (let i = 0; i < assignment.guests.length; i++) {
            let guest = assignment.guests[i];
            if (!guest._id) {
              guest = addMockGuest({
                name: guest.name,
                email: guest.email,
                phone: guest.phone,
                address: guest.address,
                hotelId: reservationData.hotelId,
                roomId: roomId, // Assign guest to the room!
                status: 'booked',
                keepOpen: false, // 🎯 CRITICAL: All reservation guests should close the room
                reservationStart: reservationData.checkInDate,
                reservationEnd: reservationData.checkOutDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              assignment.guests[i] = guest;
            }
            guestIds.push(guest._id);
          }
          
          // 🎯 NEW: Create actual reservation record for this room
          const roomReservation = addMockReservation({
            hotelId: reservationData.hotelId,
            roomId: roomId,
            guestIds: guestIds,
            confirmationNumber: `CONF-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            reservationStart: reservationData.checkInDate,
            reservationEnd: reservationData.checkOutDate,
            checkInDate: reservationData.checkInDate,
            checkOutDate: reservationData.checkOutDate,
            nights: calculateNights(reservationData.checkInDate, reservationData.checkOutDate),
            roomRate: room.rate || 100,
            totalAmount: (room.rate || 100) * calculateNights(reservationData.checkInDate, reservationData.checkOutDate),
            paidAmount: 0,
            currency: 'USD',
            status: 'active',
            reservationStatus: 'active',
            bookingStatus: 'confirmed',
            source: 'direct', // Fix: Use valid source value instead of 'enhanced_wizard'
            notes: reservationData.notes || '',
            specialRequests: Array.isArray(reservationData.specialRequests) ? reservationData.specialRequests : (reservationData.specialRequests ? [reservationData.specialRequests] : [])
          });
          
          createdReservations.push(roomReservation._id);
          // console.log(`✅ Created reservation ${roomReservation._id} for room ${room.number} (${reservationData.checkInDate} to ${reservationData.checkOutDate})`);
          
          // Update room's assignedGuests
          room.assignedGuests = [...(room.assignedGuests || []), ...guestIds];
          
          // Recalculate room status
          recalculateRoomStatus(room, 'system', 'Triggered by enhanced reservation creation');
          
          // Ensure the updated room is written back to mockRooms
          const idx = mockRooms.findIndex(r => r._id === room._id);
          if (idx !== -1) {
            mockRooms[idx] = { ...room };
          }
          
          // console.log(`🔄 AFTER: Room ${room.number} status:`, room.status, 'assignedGuests:', room.assignedGuests);
          // const updatedRoomInArray = mockRooms.find(r => r._id === room._id);
          // // console.log(`📋 Room ${room.number} in mockRooms array:`, updatedRoomInArray?.status, 'assignedGuests:', updatedRoomInArray?.assignedGuests);
        } 
        // else {
          // console.log(`❌ Room not found for roomId: ${roomId} or no guests in assignment`);
        // }
      }
    }

    // console.log('✅ Enhanced Reservation Created:', {
    //   mainReservationId: newReservationId,
    //   roomReservations: createdReservations,
    //   totalRooms: createdReservations.length
    // });

    return HttpResponse.json({
      ...newReservation,
      roomReservations: createdReservations
    }, { status: 201 });
  })
];

export const reservationEndpointsHandlers = [
  // Get all reservations (filtered by hotel)
  http.get('/api/reservations', ({ request }) => {
    // console.log('Debug Reservations 1');
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    const status = url.searchParams.get('status');
    
    let filteredReservations: Reservation[] = mockReservations;
    
    // Filter by hotel if specified
    if (hotelId) {
      filteredReservations = filteredReservations.filter(r => r.hotelId === hotelId);
    }
    
    // Filter by status if specified
    if (status) {
      if (status === 'active') {
        filteredReservations = filteredReservations.filter(r => 
          r.status === 'active' || r.reservationStatus === 'active'
        );
      } else if (status === 'inactive') {
        filteredReservations = filteredReservations.filter(r => 
          r.status === 'cancelled' || r.status === 'no-show' || 
          r.status === 'terminated' || r.status === 'completed' ||
          r.reservationStatus === 'cancelled' || r.reservationStatus === 'no-show' || 
          r.reservationStatus === 'terminated' || r.reservationStatus === 'completed'
        );
      }
    }
    
    // console.log(`📋 Returning ${filteredReservations.length} reservations for hotel ${hotelId}`);
    return HttpResponse.json(filteredReservations);
  }),



  // Create new reservation
  http.post('/api/reservations', async ({ request }) => {
    // console.log('Debug Reservations /api/reservations POST');
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    
    // Extract guest IDs from the request
    const guestIds: string[] = safeData.guestIds || [];
    if (guestIds.length === 0) {
      return new HttpResponse(null, { status: 400, statusText: 'No guest IDs provided' });
    }
    
    // Get current hotel ID (you might need to adjust this based on your current hotel logic)
    const currentHotelId = safeData.hotelId || '65a000000000000000000001';
    
    const price = typeof safeData.price === 'number' ? safeData.price : Number(safeData.price);
    
    // Create a proper Reservation object
    const newReservation: Reservation = {
      _id: `res-${currentHotelId.slice(-4)}-${String(mockReservations.length + 1).padStart(4, '0')}`,
      hotelId: currentHotelId,
      roomId: safeData.rooms || '',
      guestIds,
      confirmationNumber: `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reservationStart: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      reservationEnd: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      checkInDate: safeData.dates?.split(' to ')[0] || new Date().toISOString(),
      checkOutDate: safeData.dates?.split(' to ')[1] || new Date().toISOString(),
      nights: 1,
      roomRate: !isNaN(price) ? price : 0,
      totalAmount: !isNaN(price) ? price : 0,
      paidAmount: 0,
      currency: 'USD',
      status: 'active',
      reservationStatus: 'active',
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      specialRequests: safeData.specialRequests || '',
      notes: safeData.notes || '',
      source: 'direct',
      financials: {
        totalAmount: !isNaN(price) ? price : 0,
        paidAmount: 0,
        refundAmount: 0,
        cancellationFee: 0,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        transactions: []
      },
      audit: {
        statusHistory: [
          {
            status: 'active',
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            reason: 'Reservation created via API'
          }
        ],
        actions: [
          {
            action: 'create',
            timestamp: new Date().toISOString(),
            performedBy: 'system',
            details: { guestCount: guestIds.length, roomId: safeData.rooms }
          }
        ]
      },
      statusHistory: [
        {
          status: 'active',
          timestamp: new Date().toISOString(),
          performedBy: 'system',
          reason: 'Reservation created via API'
        }
      ]
    };
    
    mockReservations.push(newReservation);
    
    // Update guests' reservation info
    guestIds.forEach((gid: string) => {
      const guest = mockGuests.find(g => g._id === gid);
      if (guest) {
        guest.roomId = newReservation.roomId;
        guest.reservationStart = newReservation.reservationStart;
        guest.reservationEnd = newReservation.reservationEnd;
      }
    });
    
    // Add to reservation history: reservation_created
    reservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: newReservation.roomId,
      timestamp: new Date().toISOString(),
      action: 'reservation_created',
      previousState: {},
      newState: { guestIds: newReservation.guestIds },
      performedBy: 'system',
      notes: 'Reservation created via API',
    });
    
    return HttpResponse.json(newReservation, { status: 201 });
  }),

  http.post('/api/reservations/multi-room', async ({ request }) => {
    // console.log('🚨🚨🚨 MULTI-ROOM RESERVATION ENDPOINT HIT! 🚨🚨🚨');
    
      const {
    roomAssignments,
    checkInDate,
    checkOutDate,
    notes,
    specialRequests,
    hotelId,
    createdBy
  } = await request.json() as any;
  
    // console.log('📋 Multi-room reservation request:', {
    //   primaryGuest: primaryGuest?.name,
    //   roomAssignments: roomAssignments?.length,
    //   checkInDate,
    //   checkOutDate,
    //   hotelId
    // });
  
    // STEP 1: Handle guests - Create guests with correct roomId per assignment
    const guestIds: string[] = [];
    for (const assignment of roomAssignments) {
      for (let i = 0; i < assignment.guests.length; i++) {
        let guest = assignment.guests[i];
        let guestObj = guest;
        if (!guest._id) {
          guestObj = addMockGuest({
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            address: guest.address,
            hotelId,
            roomId: assignment.roomId, // assign guest to the room!
            status: 'booked',
            keepOpen: false, // 🎯 CRITICAL: All reservation guests should close the room
            reservationStart: checkInDate,
            reservationEnd: checkOutDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          assignment.guests[i] = guestObj;
        }
        guestIds.push(assignment.guests[i]._id);
      }
    }
    // console.log('📝 Guest IDs collected:', guestIds);
  
    // 3. Create reservation objects for each room assignment
    const createdReservations = [];
    for (const assignment of roomAssignments) {
      const guestIds = assignment.guests.map((g: any) => g._id);
      const roomId = assignment.roomId;
      const reservationStart = checkInDate;
      const reservationEnd = checkOutDate;
      const nights = calculateNights(reservationStart, reservationEnd);
      const room = mockRooms.find(r => r._id === roomId);
      const roomType = mockRoomTypes.find(rt => rt._id === room?.typeId);
      const roomRate = roomType?.baseRate || room?.rate || 0;
      const totalAmount = roomRate * nights;
      const reservation = addMockReservation({
        hotelId,
        roomId,
        guestIds,
        confirmationNumber: `CONF-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        reservationStart,
        reservationEnd,
        checkInDate: reservationStart,
        checkOutDate: reservationEnd,
        nights,
        roomRate,
        totalAmount,
        paidAmount: 0,
        currency: 'USD',
        status: 'active',
        reservationStatus: 'active',
        bookingStatus: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastStatusChange: new Date().toISOString(),
        source: 'direct',
        financials: {
          totalAmount,
          paidAmount: 0,
          refundAmount: 0,
          cancellationFee: 0,
          currency: 'USD',
          paymentMethod: 'credit_card',
          paymentStatus: 'pending',
          transactions: []
        },
        audit: {
          statusHistory: [{
            status: 'active',
            timestamp: new Date().toISOString(),
            performedBy: createdBy || 'system',
            reason: 'Multi-room reservation created'
          }],
          actions: [{
            action: 'create',
            timestamp: new Date().toISOString(),
            performedBy: createdBy || 'system',
            details: { guestCount: guestIds.length, roomId }
          }]
        },
        statusHistory: [{
          status: 'active',
          timestamp: new Date().toISOString(),
          performedBy: createdBy || 'system',
          reason: 'Multi-room reservation created'
        }],
        notes: notes || '',
        specialRequests: Array.isArray(specialRequests) ? specialRequests : (specialRequests ? [specialRequests] : [])
      });
      // Recalculate reservation status after creation
      recalculateReservationStatus(reservation._id, 'Reservation created via multi-room endpoint');
      
      // 🎯 CRITICAL FIX: Recalculate room status after reservation creation
      if (room) {
        // console.log(`🔄 BEFORE: Room ${room.number} status:`, room.status, 'assignedGuests:', room.assignedGuests);
        recalculateRoomStatus(room, 'system', 'Triggered by reservation creation');
        // Ensure the updated room is written back to mockRooms
        const idx = mockRooms.findIndex(r => r._id === room._id);
        if (idx !== -1) {
          mockRooms[idx] = { ...room };
        }
        // console.log(`🔄 AFTER: Room ${room.number} status:`, room.status, 'assignedGuests:', room.assignedGuests);
        // console.log(`📋 Room ${room.number} in mockRooms array:`, updatedRoomInArray?.status, 'assignedGuests:', updatedRoomInArray?.assignedGuests);
      } 
      // else {
        // console.log(`❌ Room not found for roomId: ${roomId}`);
      // }
      
      createdReservations.push(reservation);
    }
    // After all guests and reservations are created, sync assignedGuests for each room
    for (const room of mockRooms) {
      // Find all guests assigned to this room
      const guestsForRoom = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
      room.assignedGuests = guestsForRoom.map(g => g._id);
      // Recalculate room status again to ensure it's correct
      recalculateRoomStatus(room, 'system', 'Post-reservation guest assignment sync');
      // console.log(`🔁 Post-sync: Room ${room.number} assignedGuests:`, room.assignedGuests, 'status:', room.status);
    }
    // DEBUG: Print state of mockRooms and mockGuests after reservation creation
    // console.log('🟣 DEBUG: mockRooms after reservation:', mockRooms.map(r => ({ number: r.number, assignedGuests: r.assignedGuests, status: r.status })));
    // console.log('🟣 DEBUG: mockGuests after reservation:', mockGuests.map(g => ({ id: g._id, name: g.name, roomId: g.roomId, hotelId: g.hotelId })));
    // Return the created reservations
    return HttpResponse.json({
      message: 'Reservations created successfully',
      reservations: createdReservations
    }, { status: 201 });
  }),

  // Update reservation (business actions)
  http.patch('/api/reservations/:id', async ({ params, request }) => {
    // console.log('Debug Reservations /api/reservations/:id PATCH');
    const reservationId = params.id as string;
    const reservation = mockReservations.find(r => r._id === reservationId);
    
    if (!reservation) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const data = await request.json();
    const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
    const now = new Date().toISOString();
    
    // Handle business actions
    if (safeData.reservationStatus && safeData.reservationStatus !== reservation.reservationStatus) {
      // Update audit trail
      if (!reservation.audit) {
        reservation.audit = { statusHistory: [], actions: [] };
      }
      
      reservation.audit.statusHistory.push({
        status: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        reason: safeData.reason || 'Status updated'
      });
      
      reservation.audit.actions.push({
        action: safeData.reservationStatus,
        timestamp: now,
        performedBy: safeData.performedBy || 'system',
        details: {
          previousStatus: reservation.reservationStatus,
          newStatus: safeData.reservationStatus,
          reason: safeData.reason
        }
      });
      
      // Handle specific business status updates
      if (safeData.reservationStatus === 'cancelled') {
        reservation.cancelledAt = now;
        reservation.cancelledBy = safeData.cancelledBy || 'hotel';
        reservation.cancellationReason = safeData.cancellationReason || safeData.reason;
        
        // Update financials with cancellation fee
        if (safeData.cancellationFee !== undefined) {
          reservation.financials.cancellationFee = safeData.cancellationFee;
          reservation.financials.refundAmount = reservation.financials.totalAmount - safeData.cancellationFee;
        }
      } else if (safeData.reservationStatus === 'no-show') {
        reservation.noShowMarkedAt = now;
      } else if (safeData.reservationStatus === 'terminated') {
        reservation.terminatedAt = now;
      }
    }
    
    // Apply all updates
    Object.assign(reservation, safeData, { updatedAt: now });
    
    // Update associated guests if dates or rooms changed
    if (safeData.dates || safeData.rooms) {
      (reservation.guestIds || []).forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          if (safeData.rooms && reservation.roomId !== safeData.rooms) reservation.roomId = safeData.rooms;
          if (safeData.dates) {
            reservation.reservationStart = safeData.dates.split(' to ')[0];
            reservation.reservationEnd = safeData.dates.split(' to ')[1];
          }
        }
      });
    }
    
    // console.log('✅ Updated reservation:', reservation._id, 'new status:', reservation.reservationStatus);
    return HttpResponse.json(reservation);
  }),

  // Delete reservation
  http.delete('/api/reservations/:id', ({ params, request }) => {
    // console.log('Debug Reservations /api/reservations/:id DELETE');
    const reservationId = params.id as string;
    const reservationIndex = mockReservations.findIndex(r => r._id === reservationId);
    
    if (reservationIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const reservation = mockReservations[reservationIndex];
    
    // Get deletion reason from query params
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || 'Deleted by user';
    
    // Clear room assignments for associated guests
    if (Array.isArray(reservation.guestIds)) {
      reservation.guestIds.forEach((gid: string) => {
        const guest = mockGuests.find(g => g._id === gid);
        if (guest) {
          guest.roomId = '';
          guest.keepOpen = false;
        }
      });
    }
    
    // Add to reservation history before deletion
    reservationHistory.push({
      id: `HIST-${Date.now()}`,
      roomId: reservation.roomId,
      timestamp: new Date().toISOString(),
      action: 'reservation_deleted',
      previousState: { 
        guestIds: reservation.guestIds,
        status: reservation.status,
        reservationStatus: reservation.reservationStatus
      },
      newState: {},
      performedBy: 'system',
      notes: reason,
    });
    
    // Remove from reservations array
    mockReservations.splice(reservationIndex, 1);
    
    return HttpResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
  }),

  // Get reservation history
  http.get('/api/reservation-history', ({ request }) => {
    // console.log('Debug Reservation History /api/reservation-history');
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    
    let filteredHistory = reservationHistory;
    
    // Filter by hotel if specified
    if (hotelId) {
      filteredHistory = filteredHistory.filter(entry => {
        // Find the reservation this history entry refers to
        const reservation = mockReservations.find(r => 
          r._id === entry.id || r.roomId === entry.roomId
        );
        return reservation && reservation.hotelId === hotelId;
      });
    }
    
    // Enhance history entries with guest names
    const enhancedHistory = filteredHistory.map(entry => {
      const guestNames = [
        ...(entry.newState.guestIds || []),
        ...(entry.previousState.guestIds || [])
      ].map(gid => mockGuests.find(g => g._id === gid)?.name || gid).join(', ');
      
      return {
        ...entry,
        guestNames
      };
    });
    
    // console.log(`📋 Returning ${enhancedHistory.length} history entries for hotel ${hotelId}`);
    return HttpResponse.json(enhancedHistory);
  })
]; 