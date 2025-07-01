import { mockGuests } from "../../data/guests";
import { mockRooms } from "../../data/rooms";
import { http, HttpResponse } from "msw";
import { CurrentHotelService } from '../../../services/currentHotel';
import { RoomAction, RoomStatus } from "../../../types/room";

function recalculateRoomStatus(room: any, performedBy: string = 'system', notes: string = 'Room status recalculated') {
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

function ensureRoomDefaults(room: any) {
    return {
        ...room,
        assignedGuests: Array.isArray(room.assignedGuests) ? room.assignedGuests : [],
        notes: typeof room.notes === 'string' ? room.notes : '',
    };
}

const mockRoomActions: RoomAction[] = [
    {
      id: '1',
      roomId: '2',
      type: 'cleaning',
      status: 'pending',
      requestedBy: 'ai',
      requestedAt: '2024-03-09T09:00:00Z',
      notes: 'Requested by AI based on guest check-out time',
    },
  ];

export const roomsEndpointsHandlers = [

    http.get('/api/rooms', ({ request }) => {
        console.log('Debug Rooms 1');
        const url = new URL(request.url);
        const hotelId = url.searchParams.get('hotelId');
        
        // Filter rooms by hotelId if provided, otherwise use current config mapping
        let filteredRooms;
        if (hotelId) {
          // Direct filtering by hotelId (Hotel entity approach)
          filteredRooms = mockRooms.filter(r => r.hotelId === hotelId);
        } else {
          // Fallback to current config for backward compatibility
          const currentHotelId = CurrentHotelService.getCurrentHotelId();
          filteredRooms = mockRooms.filter(r => r.hotelId === currentHotelId);
        }
        
        // For each room, recalculate status and keepOpen, then log keepOpen
        const rooms = filteredRooms.map(room => {
          recalculateRoomStatus(room); // Ensure status and keepOpen are up-to-date
          const guests = mockGuests.filter(g => g.roomId === room.id && g.hotelId === room.hotelId);
          const keepOpen = guests.length > 0 && guests.every(g => g.keepOpen === true);
          const roomWithKeepOpen = { ...room, keepOpen };
          console.log('DEBUG /api/rooms:', room.id, 'keepOpen:', keepOpen, 'status:', room.status);
          return roomWithKeepOpen;
        });
        return HttpResponse.json(rooms);
      }),

    http.post('/api/rooms', async ({ request }) => {
        console.log('Debug Rooms 2');
        const data = await request.json();
        const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
        
        // Map currentConfigId to hotelId for room creation
        const currentHotelId = CurrentHotelService.getCurrentHotelId();
        
        const newRoom = ensureRoomDefaults({
            id: `room-${Date.now()}`,
            number: typeof safeData.number === 'string' ? safeData.number : '',
            typeId: typeof safeData.typeId === 'string' ? safeData.typeId : '',
            floorId: typeof safeData.floorId === 'string' ? safeData.floorId : '',
            status: typeof safeData.status === 'string' ? safeData.status : 'available',
            features: Array.isArray(safeData.features) ? safeData.features : [],
            capacity: typeof safeData.capacity === 'number' ? safeData.capacity : 1,
            rate: typeof safeData.rate === 'number' ? safeData.rate : 0,
            notes: typeof safeData.notes === 'string' ? safeData.notes : '',
            hotelId: currentHotelId, // UPDATED: Use hotelId instead of currentConfigId
            assignedGuests: [],
        });
        mockRooms.push(newRoom);
        return HttpResponse.json(newRoom, { status: 201 });
    }),

    http.patch('/api/rooms/:id', async ({ request, params }) => {
        console.log('Debug Rooms 3');
        const { id } = params;
        const data = await request.json();
        const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
        const idx = mockRooms.findIndex(r => r.id === id);
        if (idx === -1) return new HttpResponse(null, { status: 404 });
        // If status is being set to 'maintenance' or 'cleaning', set it directly and skip recalculation
        if (safeData.status === 'maintenance' || safeData.status === 'cleaning') {
          mockRooms[idx] = ensureRoomDefaults({
            ...mockRooms[idx],
            ...safeData,
            notes: typeof safeData.notes === 'string' ? safeData.notes : (mockRooms[idx].notes || ''),
            status: safeData.status,
          });
          return HttpResponse.json(mockRooms[idx]);
        }
        // Otherwise, update and recalculate
        mockRooms[idx] = ensureRoomDefaults({
          ...mockRooms[idx],
          ...safeData,
          notes: typeof safeData.notes === 'string' ? safeData.notes : (mockRooms[idx].notes || ''),
        });
        recalculateRoomStatus(mockRooms[idx], 'system', 'Room updated via PATCH');
        return HttpResponse.json(mockRooms[idx]);
      }),

    http.patch('/api/rooms/actions/:id', async ({ params, request }: any) => {

        const action = mockRoomActions.find(a => a.id === params.id);
        if (!action) {
            return new HttpResponse(null, { status: 404 });
        }

        const updates = await request.json() as Partial<RoomAction>;
        const updatedAction: RoomAction = { ...action, ...updates };
        const index = mockRoomActions.findIndex(a => a.id === params.id);
        mockRoomActions[index] = updatedAction;

        return HttpResponse.json(updatedAction);
    }),
];