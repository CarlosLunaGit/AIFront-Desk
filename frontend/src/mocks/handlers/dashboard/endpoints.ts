import { http, HttpResponse } from 'msw';
import { mockRooms, mockRoomTypes } from '../../data/rooms';
import { CurrentHotelService } from '../../../services/currentHotel'; // 👈 Import the service
import { mockHotels } from '../../data/hotels';
import { Room, RoomStatus } from '../../../types/room';

export const dashboardEndpointsHandlers = [
    // Dashboard stats (dynamic per current config)
    http.get('/api/hotel/:id/dashboard-data', ({ params }) => {
        const hotelId = params.id as string;
        console.log('Debug Dashboard 1');
        // Find hotel
        const hotel = mockHotels.find(h => h._id === hotelId);
        if (!hotel) {
          return new HttpResponse(null, { status: 404 });
        }
    
        // Filter rooms for this specific hotel - FIXED: Use hotelId directly
        const hotelRooms: Room[] = mockRooms.filter((r: Room) => r.hotelId === hotelId);
        console.log('hotelRooms', hotelRooms);
        // Generate stats using filtered rooms
        const totalRooms = hotelRooms.length;
        const availableRooms = hotelRooms.filter((r: Room) => r.status as RoomStatus === 'available').length;
        const occupiedRooms = hotelRooms.filter((r: Room) => r.status as RoomStatus === 'occupied'|| r.status as RoomStatus === 'partially-occupied').length;
        const maintenanceRooms = hotelRooms.filter((r: Room) => r.status as RoomStatus === 'maintenance').length;
        const cleaningRooms = hotelRooms.filter((r: Room) => r.status as RoomStatus === 'cleaning').length;
        const reservedRooms = hotelRooms.filter((r: Room) => r.status as RoomStatus === 'reserved' || r.status as RoomStatus === 'partially-reserved').length;
        
        const byType: Record<string, number> = {};
        hotelRooms.forEach(r => {
          if (r.typeId) {
            byType[r.typeId] = (byType[r.typeId] || 0) + 1;
          }
        });
    
        console.log('📊 Dashboard Stats for Hotel:', hotel.name, {
          totalRooms,
          availableRooms,
          occupiedRooms,
          maintenanceRooms,
          cleaningRooms,
          reservedRooms,
          occupancyRate: totalRooms > 0 ? occupiedRooms / totalRooms : 0,
          byType,
          hotelRoomsCount: hotelRooms.length,
          hotelId
        });
    
        return HttpResponse.json({
          hotel,
          roomTypes: mockRoomTypes.filter(rt => rt.hotelId === hotelId),
          stats: {
            totalRooms,
            availableRooms,
            occupiedRooms,
            maintenanceRooms,
            cleaningRooms,
            reservedRooms,
            occupancyRate: totalRooms > 0 ? occupiedRooms / totalRooms : 0,
            byType
          }
        });
      }),
  ]; 