import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../config';
import type { Room } from '../types/room';
import type { Guest } from '../types/guest';
import type { RoomStatus } from '../types/room';
import { recalculateRoomStatus } from '../utils/roomStatus';

// In-memory state for guests and room
let roomState: Room;
let guestsState: Guest[];

function resetState() {
  guestsState = [
    {
      id: 'guest-1',
      roomId: 'room-1',
      hotelId: 'mock-hotel-1',
      status: 'booked',
      keepOpen: true,
      name: 'Test Guest',
      email: 'test@example.com',
      phone: '1234567890',
      reservationStart: '2024-03-20',
      reservationEnd: '2024-03-25',
      checkIn: '',
      checkOut: '',
    },
  ];
  roomState = {
    id: 'room-1',
    number: '101',
    hotelId: 'mock-hotel-1',
    capacity: 2,
    assignedGuests: guestsState.map(g => g.id),
    status: 'available', // will be recalculated below
    keepOpen: false,     // will be recalculated below
    features: [],
    typeId: '',
    floorId: '',
    rate: 0,
    notes: '',
  };
  // Recalculate initial room status and keepOpen
  const recalc = recalculateRoomStatus(roomState, guestsState);
  roomState.status = recalc.status;
  roomState.keepOpen = recalc.keepOpen;
}

// MSW Server setup
const server = setupServer(
  // GET room
  http.get(`${API_BASE_URL}/rooms/:roomId`, ({ params }) => {
    return HttpResponse.json(roomState);
  }),
  // GET guests
  http.get(`${API_BASE_URL}/guests`, ({ request }) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    if (roomId) {
      return HttpResponse.json(guestsState.filter(g => g.roomId === roomId));
    }
    return HttpResponse.json(guestsState);
  }),
  // PATCH guest
  http.patch(`${API_BASE_URL}/guests/:guestId`, async ({ params, request }) => {
    const { guestId } = params;
    const updates = await request.json() as Partial<Guest>;
    const idx = guestsState.findIndex(g => g.id === guestId);
    if (idx === -1) return HttpResponse.json({ error: 'Guest not found' }, { status: 404 });
    guestsState[idx] = { ...guestsState[idx], ...updates };
    // Recalculate room status after guest update, unless room is in maintenance or cleaning
    if (roomState.status !== 'maintenance' && roomState.status !== 'cleaning') {
      const assignedGuests = guestsState.filter(g => g.roomId === roomState.id);
      const recalc = recalculateRoomStatus(roomState, assignedGuests);
      roomState = { ...roomState, ...recalc, assignedGuests: assignedGuests.map(g => g.id) };
    }
    return HttpResponse.json(guestsState[idx]);
  }),
  // PATCH room
  http.patch(`${API_BASE_URL}/rooms/:roomId`, async ({ params, request }) => {
    const { roomId } = params;
    const updates = await request.json() as Partial<Room>;
    if (roomState.id !== roomId) return HttpResponse.json({ error: 'Room not found' }, { status: 404 });
    // If status is set to 'maintenance', set it directly and do not recalculate
    if (updates.status === 'maintenance') {
      roomState = { ...roomState, ...updates, status: 'maintenance' };
    } else {
      roomState = { ...roomState, ...updates };
    }
    return HttpResponse.json(roomState);
  })
);

describe('Room Status Integration Tests', () => {
  beforeAll(() => server.listen());
  beforeEach(() => { resetState(); });
  afterEach(() => { server.resetHandlers(); });
  afterAll(() => server.close());

  it('should update room status when guest checks in', async () => {
    // 1. Get initial room state
    const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const initialRoom: Room = await roomResponse.json();
    expect(initialRoom.status).toBe('partially-reserved');

    // 2. Get assigned guests
    const guestsResponse = await fetch(`${API_BASE_URL}/guests?roomId=${roomState.id}`);
    const guests: Guest[] = await guestsResponse.json();
    expect(guests.length).toBe(1);

    // 3. Update guest status to checked-in
    const updatedGuest = await fetch(`${API_BASE_URL}/guests/${guests[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked-in' }),
    }).then(res => res.json());

    expect(updatedGuest.status).toBe('checked-in');

    // 4. Verify room status was updated (roomState is updated by the PATCH guest endpoint)
    const finalRoomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const finalRoom: Room = await finalRoomResponse.json();
    const assignedGuests = guestsState.filter(g => g.roomId === roomState.id);
    const expectedStatus = recalculateRoomStatus(finalRoom, assignedGuests);
    expect(finalRoom.status).toBe(expectedStatus.status);
  });

  it('should update room status when guest checks out', async () => {
    // Start with a checked-in guest (update in-memory state)
    guestsState[0].status = 'checked-in';
    roomState = { ...roomState, status: 'occupied' };

    // 1. Get initial room state
    const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const initialRoom: Room = await roomResponse.json();
    expect(initialRoom.status).toBe('occupied');

    // 2. Update guest status to checked-out (PATCH guest endpoint updates roomState)
    const updatedGuest = await fetch(`${API_BASE_URL}/guests/${guestsState[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked-out' }),
    }).then(res => res.json());

    expect(updatedGuest.status).toBe('checked-out');

    // 3. Verify room status was updated (roomState is updated by the PATCH guest endpoint)
    const finalRoomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const finalRoom: Room = await finalRoomResponse.json();
    const assignedGuests = guestsState.filter(g => g.roomId === roomState.id);
    const expectedStatus = recalculateRoomStatus(finalRoom, assignedGuests);
    expect(finalRoom.status).toBe(expectedStatus.status);
    expect(finalRoom.status).toBe('cleaning');
  });

  it('should handle multiple guests with different statuses', async () => {
    // Add a second guest (update in-memory state)
    guestsState.push({ ...guestsState[0], id: 'guest-2', status: 'booked', name: 'Second Guest' });
    roomState.assignedGuests = guestsState.map(g => g.id);

    // 1. Get initial room state
    const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const initialRoom: Room = await roomResponse.json();

    // 2. Get assigned guests
    const guestsResponse = await fetch(`${API_BASE_URL}/guests?roomId=${roomState.id}`);
    const guests: Guest[] = await guestsResponse.json();
    expect(guests.length).toBe(2);

    // 3. Update first guest to checked-in (PATCH guest endpoint updates roomState)
    await fetch(`${API_BASE_URL}/guests/${guests[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked-in' }),
    });

    // 4. Verify room status is partially-occupied (roomState is updated by the PATCH guest endpoint)
    const finalRoomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const finalRoom: Room = await finalRoomResponse.json();
    const assignedGuests = guestsState.filter(g => g.roomId === roomState.id);
    const expectedStatus = recalculateRoomStatus(finalRoom, assignedGuests);
    expect(finalRoom.status).toBe(expectedStatus.status);
    expect(finalRoom.status).toBe('partially-occupied');
  });

  it('should handle room maintenance status independently of guest status', async () => {
    // 1. Set room to maintenance (PATCH room endpoint updates roomState)
    const maintenanceRoom = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'maintenance' }),
    }).then(res => res.json());

    expect(maintenanceRoom.status).toBe('maintenance');

    // 2. Verify guest status changes don't affect maintenance status (PATCH guest endpoint updates roomState, but roomState.status is "maintenance")
    const updatedGuest = await fetch(`${API_BASE_URL}/guests/${guestsState[0].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked-in' }),
    }).then(res => res.json());

    const finalRoomResponse = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`);
    const finalRoom: Room = await finalRoomResponse.json();
    expect(finalRoom.status).toBe('maintenance');
  });

  it('should toggle keepOpen for all assigned guests and update room keepOpen accordingly', async () => {
    // Setup: two guests assigned to the room, one keepOpen true, one false
    guestsState = [
      {
        id: 'guest-1',
        roomId: 'room-1',
        hotelId: 'mock-hotel-1',
        status: 'booked',
        keepOpen: true,
        name: 'Test Guest 1',
        email: 'test1@example.com',
        phone: '1234567890',
        reservationStart: '2024-03-20',
        reservationEnd: '2024-03-25',
        checkIn: '',
        checkOut: '',
      },
      {
        id: 'guest-2',
        roomId: 'room-1',
        hotelId: 'mock-hotel-1',
        status: 'checked-in',
        keepOpen: false,
        name: 'Test Guest 2',
        email: 'test2@example.com',
        phone: '1234567891',
        reservationStart: '2024-03-20',
        reservationEnd: '2024-03-25',
        checkIn: '2024-03-20T15:00:00',
        checkOut: '',
      },
    ];
    roomState = {
      id: 'room-1',
      number: '101',
      hotelId: 'mock-hotel-1',
      capacity: 2,
      assignedGuests: guestsState.map(g => g.id),
      status: 'partially-occupied',
      keepOpen: false,
      features: [],
      typeId: '',
      floorId: '',
      rate: 0,
      notes: '',
    };
    // 1. Confirm initial state
    expect(roomState.keepOpen).toBe(false);
    // 2. PATCH both guests to keepOpen: true
    for (const guest of guestsState) {
      await fetch(`${API_BASE_URL}/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepOpen: true }),
      });
    }
    // 3. Fetch updated guests and room
    const guestsAfter = await fetch(`${API_BASE_URL}/guests?roomId=${roomState.id}`).then(res => res.json());
    const roomAfter = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`).then(res => res.json());
    expect(guestsAfter.every((g: any) => g.keepOpen === true)).toBe(true);
    expect(roomAfter.keepOpen).toBe(true);
    // 4. PATCH both guests to keepOpen: false
    for (const guest of guestsAfter) {
      await fetch(`${API_BASE_URL}/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepOpen: false }),
      });
    }
    const guestsFinal = await fetch(`${API_BASE_URL}/guests?roomId=${roomState.id}`).then(res => res.json());
    const roomFinal = await fetch(`${API_BASE_URL}/rooms/${roomState.id}`).then(res => res.json());
    expect(guestsFinal.every((g: any) => g.keepOpen === false)).toBe(true);
    expect(roomFinal.keepOpen).toBe(false);
  });

  it('should only toggle keepOpen for guests assigned to the selected room', async () => {
    // Setup: two rooms, each with one guest
    guestsState = [
      {
        id: 'guest-1',
        roomId: 'room-1',
        hotelId: 'mock-hotel-1',
        status: 'booked',
        keepOpen: true,
        name: 'Room 1 Guest',
        email: 'r1@example.com',
        phone: '111',
        reservationStart: '',
        reservationEnd: '',
        checkIn: '',
        checkOut: '',
      },
      {
        id: 'guest-2',
        roomId: 'room-2',
        hotelId: 'mock-hotel-1',
        status: 'booked',
        keepOpen: true,
        name: 'Room 2 Guest',
        email: 'r2@example.com',
        phone: '222',
        reservationStart: '',
        reservationEnd: '',
        checkIn: '',
        checkOut: '',
      },
    ];
    // Two rooms
    const room1 = {
      id: 'room-1',
      number: '101',
      hotelId: 'mock-hotel-1',
      capacity: 1,
      assignedGuests: ['guest-1'],
      status: 'reserved' as RoomStatus,
      keepOpen: true,
      features: [],
      typeId: '',
      floorId: '',
      rate: 0,
      notes: '',
    };
    const room2 = {
      id: 'room-2',
      number: '102',
      hotelId: 'mock-hotel-1',
      capacity: 1,
      assignedGuests: ['guest-2'],
      status: 'reserved' as RoomStatus,
      keepOpen: true,
      features: [],
      typeId: '',
      floorId: '',
      rate: 0,
      notes: '',
    };
    // Set roomState to room1 for the test server
    roomState = room1;
    // 1. PATCH guest-1 to keepOpen: false (simulate toggling for room-1)
    await fetch(`${API_BASE_URL}/guests/guest-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepOpen: false }),
    });
    // 2. Fetch both guests
    const guestsAfter = await fetch(`${API_BASE_URL}/guests`).then(res => res.json());
    // 3. Only guest-1 should be false, guest-2 should remain true
    expect(guestsAfter.find((g: any) => g.id === 'guest-1').keepOpen).toBe(false);
    expect(guestsAfter.find((g: any) => g.id === 'guest-2').keepOpen).toBe(true);
    // 4. Only room-1's keepOpen should be false (roomState is only for room-1 in this test context)
    const room1After = await fetch(`${API_BASE_URL}/rooms/room-1`).then(res => res.json());
    expect(room1After.keepOpen).toBe(false);
  });

  it('should show room as open if all assigned guests have keepOpen true, and closed if any have false', async () => {
    // Setup: one room, two guests
    guestsState = [
      {
        id: 'guest-1',
        roomId: 'room-1',
        hotelId: 'mock-hotel-1',
        status: 'booked',
        keepOpen: true,
        name: 'Test Guest 1',
        email: 'test1@example.com',
        phone: '1234567890',
        reservationStart: '',
        reservationEnd: '',
        checkIn: '',
        checkOut: '',
      },
      {
        id: 'guest-2',
        roomId: 'room-1',
        hotelId: 'mock-hotel-1',
        status: 'booked',
        keepOpen: true,
        name: 'Test Guest 2',
        email: 'test2@example.com',
        phone: '222',
        reservationStart: '',
        reservationEnd: '',
        checkIn: '',
        checkOut: '',
      },
    ];
    roomState = {
      id: 'room-1',
      number: '101',
      hotelId: 'mock-hotel-1',
      capacity: 2,
      assignedGuests: ['guest-1', 'guest-2'],
      status: 'reserved' as RoomStatus,
      keepOpen: true,
      features: [],
      typeId: '',
      floorId: '',
      rate: 0,
      notes: '',
    };
    // PATCH guest to keepOpen false
    await fetch(`${API_BASE_URL}/guests/guest-2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepOpen: false }),
    });
    // Fetch room and check keepOpen
    const res = await fetch(`${API_BASE_URL}/rooms/room-1`);
    const updatedRoom = await res.json();
    expect(updatedRoom.keepOpen).toBe(false);
    // Now set both to true
    await fetch(`${API_BASE_URL}/guests/guest-2`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepOpen: true }),
    });
    const res2 = await fetch(`${API_BASE_URL}/rooms/room-1`);
    const updatedRoom2 = await res2.json();
    expect(updatedRoom2.keepOpen).toBe(true);
  });
}); 
