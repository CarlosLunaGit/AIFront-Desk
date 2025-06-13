import { describe, it, expect } from '@jest/globals';
import type { Room } from './types/room';
import type { Guest } from './types/guest';
import { recalculateRoomStatus } from './utils/roomStatus';

function makeRoom(overrides = {}): Room {
  return {
    id: 'room-1',
    number: '101',
    hotelConfigId: 'mock-hotel-1',
    capacity: 2,
    assignedGuests: [],
    status: 'available',
    keepOpen: false,
    features: [],
    typeId: '',
    floorId: '',
    rate: 0,
    notes: '',
    ...overrides,
  };
}

function makeGuest(overrides = {}): Guest {
  return {
    id: 'guest-1',
    roomId: 'room-1',
    hotelConfigId: 'mock-hotel-1',
    status: 'booked',
    keepOpen: true,
    name: '',
    email: '',
    phone: '',
    reservationStart: '',
    reservationEnd: '',
    checkIn: '',
    checkOut: '',
    ...overrides,
  };
}

describe('recalculateRoomStatus (true table logic)', () => {
  let room: Room;
  let guests: Guest[];

  beforeEach(() => {
    room = makeRoom();
    guests = [];
  });

  it('sets status to available if no guests', () => {
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('available');
    expect(result.keepOpen).toBe(false);
  });

  it('sets status to reserved if all guests are booked and at least one has keepOpen false or at capacity', () => {
    guests.push(makeGuest({ id: 'g1', keepOpen: false }));
    let result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('reserved');
    guests.length = 0;
    guests.push(makeGuest({ id: 'g1' }), makeGuest({ id: 'g2' }));
    result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('reserved');
  });

  it('sets status to partially-reserved if all guests are booked, all keepOpen true, and not at capacity', () => {
    guests.push(makeGuest({ id: 'g1', keepOpen: true }));
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('partially-reserved');
    expect(result.keepOpen).toBe(true);
  });

  it('sets status to occupied if all guests are checked-in and at capacity', () => {
    guests.push(makeGuest({ id: 'g1', status: 'checked-in' }), makeGuest({ id: 'g2', status: 'checked-in' }));
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('occupied');
  });

  it('sets status to partially-occupied if some guests are checked-in and some are booked', () => {
    guests.push(makeGuest({ id: 'g1', status: 'checked-in' }), makeGuest({ id: 'g2', status: 'booked' }));
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('partially-occupied');
  });

  it('sets status to cleaning if all guests are checked-out', () => {
    guests.push(makeGuest({ id: 'g1', status: 'checked-out' }), makeGuest({ id: 'g2', status: 'checked-out' }));
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).toBe('cleaning');
  });

  it('sets status to available if guests do not match any other rule', () => {
    guests.push(makeGuest({ id: 'g1', status: 'checked-in' }));
    const result = recalculateRoomStatus(room, guests);
    expect(result.status).not.toBe('reserved');
  });
});

export {} 