"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logGuestStatusChange = exports.logGuestRemoval = exports.logGuestAssignment = exports.logRoomStatusChange = exports.clearHistory = exports.getAllHistory = exports.getRoomHistory = exports.addHistoryEntry = void 0;
// In-memory store for reservation history
let reservationHistory = [];
const addHistoryEntry = (entry) => {
    const newEntry = Object.assign(Object.assign({}, entry), { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() });
    reservationHistory.push(newEntry);
    return newEntry;
};
exports.addHistoryEntry = addHistoryEntry;
const getRoomHistory = (roomId) => {
    return reservationHistory
        .filter(entry => entry.roomId === roomId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
exports.getRoomHistory = getRoomHistory;
const getAllHistory = () => {
    return [...reservationHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
exports.getAllHistory = getAllHistory;
const clearHistory = () => {
    reservationHistory = [];
};
exports.clearHistory = clearHistory;
// Helper to create a history entry for room status changes
const logRoomStatusChange = (roomId, previousStatus, newStatus, performedBy, notes) => {
    return (0, exports.addHistoryEntry)({
        roomId,
        action: 'status_change',
        previousState: { roomStatus: previousStatus },
        newState: { roomStatus: newStatus },
        performedBy,
        notes,
    });
};
exports.logRoomStatusChange = logRoomStatusChange;
// Helper to create a history entry for guest assignments
const logGuestAssignment = (roomId, guestId, performedBy, notes) => {
    return (0, exports.addHistoryEntry)({
        roomId,
        action: 'guest_assigned',
        previousState: {},
        newState: { guestId },
        performedBy,
        notes,
    });
};
exports.logGuestAssignment = logGuestAssignment;
// Helper to create a history entry for guest removals
const logGuestRemoval = (roomId, guestId, performedBy, notes) => {
    return (0, exports.addHistoryEntry)({
        roomId,
        action: 'guest_removed',
        previousState: { guestId },
        newState: {},
        performedBy,
        notes,
    });
};
exports.logGuestRemoval = logGuestRemoval;
// Helper to create a history entry for guest status changes
const logGuestStatusChange = (roomId, guestId, previousStatus, newStatus, performedBy, notes) => {
    return (0, exports.addHistoryEntry)({
        roomId,
        action: 'guest_status_change',
        previousState: { guestId, guestStatus: previousStatus },
        newState: { guestId, guestStatus: newStatus },
        performedBy,
        notes,
    });
};
exports.logGuestStatusChange = logGuestStatusChange;
