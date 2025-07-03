import { http, HttpResponse } from 'msw';
import { mockGuests } from '../../data/guests';
import { CurrentHotelService } from '../../../services/currentHotel';
import { mockRooms } from '../../data/rooms';
import { recalculateRoomStatus } from '../../../utils/roomStatus';

export const guestsEndpointsHandlers = [
    // Guest endpoints (matching frontend API calls)
    // GET /api/guests : Used when fetching all guests
    http.get('/api/guests', ({ request }) => {
        console.log('Debug Guests 1');
        const url = new URL(request.url);
        const hotelId = url.searchParams.get('hotelId');
        
        console.log('🔍 GET /api/guests called with hotelId:', hotelId);
        console.log('📊 Total mockGuests:', mockGuests.length);
        
        if (hotelId) {
          const filteredGuests = mockGuests.filter(g => g.hotelId === hotelId);
          console.log('✅ Filtered guests for hotelId', hotelId + ':', filteredGuests.length, 'guests');
          return HttpResponse.json(filteredGuests);
        } else {
          // Legacy fallback
          // TODO: Remove this fallback and use the hotelId from the url perhaps adding a fallback for when the parameter is not present
          const configHotelId = CurrentHotelService.getCurrentHotelId();
          const filteredGuests = mockGuests.filter(g => g.hotelId === configHotelId);
          console.log('✅ Fallback guests for configId', configHotelId + ':', filteredGuests.length, 'guests');
          return HttpResponse.json(filteredGuests);
        }
      }),

      // GET /api/guests/:id : Used when fetching a single guest by id (TODO:Not used in the frontend yet)
      http.get('/api/guests/:id', ({ params }) => {
        console.log('Debug Guests 2');
        const guest = mockGuests.find(g => g._id === params.id);
        if (!guest) {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(guest);
      }),

      // POST /api/guests : Used when creating a new guest
      http.post('/api/guests', async ({ request }) => {
        console.log('Debug Guests 3');
        const guestData = await request.json() as any;
        const newGuest = {
          _id: `guest-${Date.now()}`,
          ...guestData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockGuests.push(newGuest);
        
        // Update room status based on new guest assignment
        if (newGuest.roomId) {
          const room = mockRooms.find(r => r._id === newGuest.roomId && r.hotelId === newGuest.hotelId);
          if (room) {
            recalculateRoomStatus(room, 'system', 'Triggered by guest assignment');
          }
        }
        
        return HttpResponse.json(newGuest);
      }),

      // PATCH /api/guests/:id : Used when updating/editing an existing guest
      http.patch('/api/guests/:id', async ({ params, request }) => {
        console.log('Debug Guests 4');
        const guestId = params.id as string;
        const updates = await request.json() as any;
        
        const guestIndex = mockGuests.findIndex(g => g._id === guestId);
        if (guestIndex === -1) {
          return new HttpResponse(null, { status: 404 });
        }
    
        // Update guest
        mockGuests[guestIndex] = {
          ...mockGuests[guestIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
    
        const guest = mockGuests[guestIndex];
        console.log('🔄 Guest updated:', guest.name, 'keepOpen:', guest.keepOpen);
    
        // Update room status based on guest status change
        const room = mockRooms.find(r => r._id === guest.roomId && r.hotelId === guest.hotelId);
        if (room) {
          recalculateRoomStatus(room, 'system', 'Triggered by guest status change');
        }
    
        return HttpResponse.json(guest);
      }),

      // DELETE /api/guests/:id : Used when deleting an existing guest
      http.delete('/api/guests/:id', ({ params }) => {
        console.log('Debug Guests 5');
        const guestId = params.id as string;
        const guestIndex = mockGuests.findIndex(g => g._id === guestId);
        
        if (guestIndex === -1) {
          return new HttpResponse(null, { status: 404 });
        }
        
        const guest = mockGuests[guestIndex];
        
        // Remove guest from rooms before deleting - Fix null check
        mockRooms.forEach(r => {
          if (r.assignedGuests) {
            r.assignedGuests = r.assignedGuests.filter((gid: string) => gid !== guestId);
          }
        });
        
        // Update room status after guest removal
        if (guest.roomId) {
          const room = mockRooms.find(r => r._id === guest.roomId && r.hotelId === guest.hotelId);
          if (room) {
            recalculateRoomStatus(room, 'system', 'Triggered by guest removal');
          }
        }
        
        mockGuests.splice(guestIndex, 1);
        return new HttpResponse(null, { status: 204 });
      }),

];