import { mockGuests } from "../../data/guests";
import { mockRooms, mockRoomTypes } from "../../data/rooms";
import { http, HttpResponse } from "msw";
import { CurrentHotelService } from '../../../services/currentHotel';
import { RoomAction, RoomStatus } from "../../../types/room";
import { recalculateRoomStatus } from "../../../utils/roomStatus";


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
          const guests = mockGuests.filter(g => g.roomId === room._id && g.hotelId === room.hotelId);
          const keepOpen = guests.length > 0 && guests.every(g => g.keepOpen === true);
          const roomWithKeepOpen = { ...room, keepOpen };
          // console.log('DEBUG /api/rooms:', room._id, 'keepOpen:', keepOpen, 'status:', room.status);
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
        const idx = mockRooms.findIndex(r => r._id === id);
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
        console.log('Debug Rooms 4 Delete?');
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