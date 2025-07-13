import { http, HttpResponse } from 'msw';
import { CurrentHotelService } from '../../../services/currentHotel';
import { mockHotels } from '../../data/hotels';
import { mockRoomTypes } from '../../data/rooms';

export const hotelsEndpointsHandlers = [

    // http.get('/api/hotel/config/current', () => { // TODO: Perhaps not needed, to be removed
    //     // console.log('Debug Hotels 1');
    //     const currentConfig = CurrentHotelService.getCurrentHotelId();
    //     if (!currentConfig) {
    //       return new HttpResponse(null, { status: 404 });
    //     }
    //     return HttpResponse.json(currentConfig);
    //   }),

  // Get all hotels (matches backend GET /api/hotel)
  http.get('/api/hotel', () => {
    // console.log('Debug Hotels 1');
    // Return empty array for new users - triggers onboarding flow in frontend
    return HttpResponse.json(mockHotels);
  }),

  // Create new hotel (matches backend POST /api/hotel)
  http.post('/api/hotel', async ({ request }) => {
    // console.log('Debug Hotels 2');
    const newHotel = await request.json() as any;
    const hotel = {
      _id: `65a00000000000000000000${mockHotels.length + 1}`,
      ...newHotel,
      slug: newHotel.name?.toLowerCase().replace(/\s+/g, '-') || 'new-hotel',
      isActive: true,
      createdBy: '65f000000000000000000001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockHotels.push(hotel);
    return HttpResponse.json(hotel, { status: 201 });
  }),

  // Get current hotel (matches backend GET /api/hotel/current)
  http.get('/api/hotel/current', () => {
    // console.log('Debug Hotels 3');
    const currentHotelId = CurrentHotelService.getCurrentHotelId();
    // Return 404 for new users with no hotels - triggers hotel setup wizard
    if (mockHotels.length === 0) {
      return new HttpResponse(
        JSON.stringify({ 
          message: 'No hotel found. Please complete hotel setup.',
          code: 'NO_HOTEL_FOUND',
          action: 'SETUP_HOTEL'
        }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return hotel based on current config selection (for testing multiple hotels)
    let currentHotel;
    currentHotel = mockHotels.find(h => h._id === currentHotelId);
    
    
    // Fallback to first active hotel if no specific selection
    const activeHotel = currentHotel || mockHotels.find((h: any) => h.isActive) || mockHotels[0];
    // console.log('🏨 Returning current hotel:', activeHotel.name, 'Config ID:', currentHotelId);
    return HttpResponse.json(activeHotel);
  }),

  // NEW: Hotel room types endpoints (matches backend /api/hotel/:hotelId/room-types)
  http.get('/api/hotel/:hotelId/room-types', ({ params }) => {
    // console.log('Debug Hotels 4');

    const hotelId = params.hotelId as string;

    // // console.log('🔍 Room Types Request - Hotel ID:', hotelId);
    // // console.log('🏠 All Room Types:', mockRoomTypes);

    const hotelRoomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);

    // console.log('✅ Filtered Room Types for Hotel:', hotelRoomTypes);

    return HttpResponse.json(hotelRoomTypes);
  }),

];
