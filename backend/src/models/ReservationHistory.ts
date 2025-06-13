import { RoomStatus } from './Room';
import { GuestStatus } from './Guest';

export interface ReservationHistoryEntry {
  id: string;
  roomId: string;
  timestamp: string;
  action: 'status_change' | 'guest_assigned' | 'guest_removed' | 'guest_status_change';
  previousState: {
    roomStatus?: RoomStatus;
    guestStatus?: GuestStatus;
    guestId?: string;
  };
  newState: {
    roomStatus?: RoomStatus;
    guestStatus?: GuestStatus;
    guestId?: string;
  };
  performedBy: string; // User ID who performed the action
  notes?: string;
}

// In-memory store for reservation history
let reservationHistory: ReservationHistoryEntry[] = [];

export const addHistoryEntry = (entry: Omit<ReservationHistoryEntry, 'id' | 'timestamp'>) => {
  const newEntry: ReservationHistoryEntry = {
    ...entry,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
  };
  reservationHistory.push(newEntry);
  return newEntry;
};

export const getRoomHistory = (roomId: string) => {
  return reservationHistory
    .filter(entry => entry.roomId === roomId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getAllHistory = () => {
  return [...reservationHistory].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const clearHistory = () => {
  reservationHistory = [];
};

// Helper to create a history entry for room status changes
export const logRoomStatusChange = (
  roomId: string,
  previousStatus: RoomStatus,
  newStatus: RoomStatus,
  performedBy: string,
  notes?: string
) => {
  return addHistoryEntry({
    roomId,
    action: 'status_change',
    previousState: { roomStatus: previousStatus },
    newState: { roomStatus: newStatus },
    performedBy,
    notes,
  });
};

// Helper to create a history entry for guest assignments
export const logGuestAssignment = (
  roomId: string,
  guestId: string,
  performedBy: string,
  notes?: string
) => {
  return addHistoryEntry({
    roomId,
    action: 'guest_assigned',
    previousState: {},
    newState: { guestId },
    performedBy,
    notes,
  });
};

// Helper to create a history entry for guest removals
export const logGuestRemoval = (
  roomId: string,
  guestId: string,
  performedBy: string,
  notes?: string
) => {
  return addHistoryEntry({
    roomId,
    action: 'guest_removed',
    previousState: { guestId },
    newState: {},
    performedBy,
    notes,
  });
};

// Helper to create a history entry for guest status changes
export const logGuestStatusChange = (
  roomId: string,
  guestId: string,
  previousStatus: GuestStatus,
  newStatus: GuestStatus,
  performedBy: string,
  notes?: string
) => {
  return addHistoryEntry({
    roomId,
    action: 'guest_status_change',
    previousState: { guestId, guestStatus: previousStatus },
    newState: { guestId, guestStatus: newStatus },
    performedBy,
    notes,
  });
}; 