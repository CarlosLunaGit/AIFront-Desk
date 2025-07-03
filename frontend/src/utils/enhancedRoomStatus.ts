// Enhanced Room Status Utilities
// Handles all room statuses including new operational statuses

import { parseISO, isSameDay, isWithinInterval, addDays } from 'date-fns';
import type { Guest } from '../types/guest';
import type { EnhancedRoomStatus, EnhancedRoom } from '../types/reservation';
import { Room } from '../types/room';

// Enhanced room status determination with all operational statuses
export function determineEnhancedRoomStatus(
  room: Room | EnhancedRoom,
  guests: Guest[],
  date: Date = new Date()
): EnhancedRoomStatus {
  const enhancedRoom = room as EnhancedRoom;
  
  // Check operational status first (highest priority)
  if (enhancedRoom.outOfOrder) {
    return 'out-of-order';
  }

  if (enhancedRoom.manuallyBlocked) {
    const until = enhancedRoom.manuallyBlocked.until;
    if (!until || new Date(until) > date) {
      return 'blocked';
    }
  }

  if (enhancedRoom.maintenanceScheduled) {
    const maintenanceStart = parseISO(enhancedRoom.maintenanceScheduled.start);
    const maintenanceEnd = parseISO(enhancedRoom.maintenanceScheduled.end);
    if (isWithinInterval(date, { start: maintenanceStart, end: maintenanceEnd })) {
      return 'maintenance';
    }
  }

  // Check guest-based status
  const roomGuests = guests.filter(g => g.roomId === room._id);
  const checkedInGuests = roomGuests.filter(g => g.status === 'checked-in');
  const bookedGuests = roomGuests.filter(g => g.status === 'booked');
  
  // Check for checkout pending (guests should checkout today)
  const checkoutPendingGuests = roomGuests.filter(g => 
    g.status === 'checked-in' && 
    g.reservationEnd && 
    isSameDay(parseISO(g.reservationEnd), date)
  );

  if (checkoutPendingGuests.length > 0) {
    return 'checkout-pending';
  }

  // Post-checkout cleaning
  if (enhancedRoom.needsCleaning) {
    return 'cleaning';
  }

  // Current logic (unchanged from existing implementation)
  if (checkedInGuests.length > 0 && bookedGuests.length > 0) {
    return 'partially-occupied';
  }
  
  if (checkedInGuests.length > 0) {
    return 'occupied';
  }
  
  if (bookedGuests.length > 0) {
    return 'reserved';
  }

  return 'available';
}

// Get status display information
export function getEnhancedRoomStatusInfo(status: EnhancedRoomStatus) {
  const statusMap = {
    'available': {
      label: 'Available',
      color: 'success',
      icon: 'A',
      description: 'Room is ready for new guests',
      priority: 1
    },
    'occupied': {
      label: 'Occupied',
      color: 'error',
      icon: 'O',
      description: 'Guests are currently checked in',
      priority: 8
    },
    'reserved': {
      label: 'Reserved',
      color: 'warning',
      icon: 'R',
      description: 'Room is reserved for future guests',
      priority: 6
    },
    'cleaning': {
      label: 'Cleaning',
      color: 'info',
      icon: 'C',
      description: 'Room is being cleaned',
      priority: 3
    },
    'partially-occupied': {
      label: 'Partially Occupied',
      color: 'warning',
      icon: 'PO',
      description: 'Some guests checked in, room not at full capacity',
      priority: 7
    },
    'partially-reserved': {
      label: 'Partially Reserved',
      color: 'warning',
      icon: 'PR',
      description: 'Some guests reserved, room not at full capacity',
      priority: 5
    },
    'checkout-pending': {
      label: 'Checkout Pending',
      color: 'warning',
      icon: 'CP',
      description: 'Guests should check out today',
      priority: 9
    },
    'maintenance': {
      label: 'Maintenance',
      color: 'error',
      icon: 'M',
      description: 'Room is under maintenance',
      priority: 10
    },
    'out-of-order': {
      label: 'Out of Order',
      color: 'error',
      icon: 'OO',
      description: 'Room is out of order and unavailable',
      priority: 11
    },
    'blocked': {
      label: 'Blocked',
      color: 'error',
      icon: 'B',
      description: 'Room is manually blocked',
      priority: 10
    }
  } as const;

  return statusMap[status] || statusMap['available'];
}

// Get status color for Material-UI
export function getEnhancedRoomStatusColor(status: EnhancedRoomStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const info = getEnhancedRoomStatusInfo(status);
  return info.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// Check if room is operationally available (not blocked by maintenance, etc.)
export function isRoomOperationallyAvailable(room: Room | EnhancedRoom, date: Date = new Date()): boolean {
  const enhancedRoom = room as EnhancedRoom;
  
  // Check blocking conditions
  if (enhancedRoom.outOfOrder) {
    return false;
  }

  if (enhancedRoom.manuallyBlocked) {
    const until = enhancedRoom.manuallyBlocked.until;
    if (!until || new Date(until) > date) {
      return false;
    }
  }

  if (enhancedRoom.maintenanceScheduled) {
    const maintenanceStart = parseISO(enhancedRoom.maintenanceScheduled.start);
    const maintenanceEnd = parseISO(enhancedRoom.maintenanceScheduled.end);
    if (isWithinInterval(date, { start: maintenanceStart, end: maintenanceEnd })) {
      return false;
    }
  }

  return true;
}

// Get operational issues for a room
export function getRoomOperationalIssues(room: Room | EnhancedRoom, date: Date = new Date()): string[] {
  const enhancedRoom = room as EnhancedRoom;
  const issues: string[] = [];

  if (enhancedRoom.outOfOrder) {
    issues.push(`Out of order: ${enhancedRoom.outOfOrder.reason}`);
    if (enhancedRoom.outOfOrder.estimatedRepair) {
      issues.push(`Estimated repair: ${enhancedRoom.outOfOrder.estimatedRepair}`);
    }
  }

  if (enhancedRoom.manuallyBlocked) {
    const until = enhancedRoom.manuallyBlocked.until;
    if (!until || new Date(until) > date) {
      issues.push(`Blocked: ${enhancedRoom.manuallyBlocked.reason}`);
      if (until) {
        issues.push(`Until: ${until}`);
      }
    }
  }

  if (enhancedRoom.maintenanceScheduled) {
    const maintenanceStart = parseISO(enhancedRoom.maintenanceScheduled.start);
    const maintenanceEnd = parseISO(enhancedRoom.maintenanceScheduled.end);
    if (isWithinInterval(date, { start: maintenanceStart, end: maintenanceEnd })) {
      issues.push(`Maintenance: ${enhancedRoom.maintenanceScheduled.reason}`);
      issues.push(`Priority: ${enhancedRoom.maintenanceScheduled.priority}`);
    }
  }

  if (enhancedRoom.needsCleaning) {
    issues.push('Needs cleaning');
  }

  return issues;
}

// Room status transitions and actions
export function getAvailableRoomActions(
  room: Room | EnhancedRoom,
  currentStatus: EnhancedRoomStatus,
  userRole: 'staff' | 'manager' | 'admin' = 'staff'
): Array<{
  action: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  requiresInput: boolean;
}> {
  const actions = [];

  // Cleaning actions
  if (currentStatus === 'cleaning') {
    actions.push({
      action: 'mark-clean',
      label: 'Mark as Clean',
      description: 'Mark room as cleaned and ready',
      requiresConfirmation: false,
      requiresInput: false
    });
  } else if (['available', 'occupied', 'reserved'].includes(currentStatus)) {
    actions.push({
      action: 'mark-cleaning',
      label: 'Mark for Cleaning',
      description: 'Mark room as needing cleaning',
      requiresConfirmation: false,
      requiresInput: true
    });
  }

  // Maintenance actions (manager+)
  if (userRole !== 'staff') {
    if (currentStatus !== 'maintenance') {
      actions.push({
        action: 'schedule-maintenance',
        label: 'Schedule Maintenance',
        description: 'Schedule maintenance for this room',
        requiresConfirmation: true,
        requiresInput: true
      });
    } else {
      actions.push({
        action: 'complete-maintenance',
        label: 'Complete Maintenance',
        description: 'Mark maintenance as completed',
        requiresConfirmation: false,
        requiresInput: true
      });
    }

    // Blocking actions
    if (currentStatus !== 'blocked') {
      actions.push({
        action: 'block-room',
        label: 'Block Room',
        description: 'Manually block room from use',
        requiresConfirmation: true,
        requiresInput: true
      });
    } else {
      actions.push({
        action: 'unblock-room',
        label: 'Unblock Room',
        description: 'Remove manual block from room',
        requiresConfirmation: false,
        requiresInput: false
      });
    }

    // Out of order actions (admin only)
    if (userRole === 'admin') {
      if (currentStatus !== 'out-of-order') {
        actions.push({
          action: 'mark-out-of-order',
          label: 'Mark Out of Order',
          description: 'Mark room as out of order',
          requiresConfirmation: true,
          requiresInput: true
        });
      } else {
        actions.push({
          action: 'mark-operational',
          label: 'Mark Operational',
          description: 'Mark room as operational again',
          requiresConfirmation: false,
          requiresInput: true
        });
      }
    }
  }

  // Checkout actions
  if (currentStatus === 'checkout-pending') {
    actions.push({
      action: 'process-checkout',
      label: 'Process Checkout',
      description: 'Process guest checkout',
      requiresConfirmation: false,
      requiresInput: false
    });
  }

  return actions;
}

// Sort rooms by status priority (most urgent first)
export function sortRoomsByStatusPriority(
  rooms: Array<{ room: Room | EnhancedRoom; status: EnhancedRoomStatus; guests?: Guest[] }>
): Array<{ room: Room | EnhancedRoom; status: EnhancedRoomStatus; guests?: Guest[] }> {
  return rooms.sort((a, b) => {
    const priorityA = getEnhancedRoomStatusInfo(a.status).priority;
    const priorityB = getEnhancedRoomStatusInfo(b.status).priority;
    
    // Higher priority numbers come first (most urgent)
    return priorityB - priorityA;
  });
}

// Get room status statistics
export function getRoomStatusStatistics(
  rooms: Array<{ room: Room | EnhancedRoom; status: EnhancedRoomStatus }>
): Record<EnhancedRoomStatus, number> & { total: number } {
  const stats = {
    'available': 0,
    'occupied': 0,
    'reserved': 0,
    'cleaning': 0,
    'partially-occupied': 0,
    'partially-reserved': 0,
    'checkout-pending': 0,
    'maintenance': 0,
    'out-of-order': 0,
    'blocked': 0,
    'total': rooms.length
  } as Record<EnhancedRoomStatus, number> & { total: number };

  rooms.forEach(({ status }) => {
    stats[status] = (stats[status] || 0) + 1;
  });

  return stats;
}

// Check if room needs attention (has issues or urgent status)
export function roomNeedsAttention(
  room: Room | EnhancedRoom,
  status: EnhancedRoomStatus,
  guests: Guest[] = []
): boolean {
  // High priority statuses that need attention
  const urgentStatuses: EnhancedRoomStatus[] = [
    'checkout-pending',
    'maintenance',
    'out-of-order',
    'blocked'
  ];

  if (urgentStatuses.includes(status)) {
    return true;
  }

  // Check for overdue checkouts
  if (status === 'occupied') {
    const roomGuests = guests.filter(g => g.roomId === room._id);
    const overdueGuests = roomGuests.filter(g => 
      g.status === 'checked-in' && 
      g.reservationEnd && 
      new Date(g.reservationEnd) < new Date()
    );
    
    if (overdueGuests.length > 0) {
      return true;
    }
  }

  // Check for operational issues
  const issues = getRoomOperationalIssues(room);
  return issues.length > 0;
}

// Get recommended next action for a room
export function getRecommendedRoomAction(
  room: Room | EnhancedRoom,
  status: EnhancedRoomStatus,
  guests: Guest[] = []
): { action: string; description: string; urgency: 'low' | 'medium' | 'high' } | null {
  switch (status) {
    case 'checkout-pending':
      return {
        action: 'process-checkout',
        description: 'Process guest checkout',
        urgency: 'high'
      };

    case 'cleaning':
      return {
        action: 'mark-clean',
        description: 'Mark room as clean when ready',
        urgency: 'medium'
      };

    case 'maintenance':
      return {
        action: 'complete-maintenance',
        description: 'Complete scheduled maintenance',
        urgency: 'high'
      };

    case 'out-of-order':
      return {
        action: 'repair-room',
        description: 'Repair and restore room to service',
        urgency: 'high'
      };

    case 'blocked':
      return {
        action: 'review-block',
        description: 'Review reason for block and unblock if appropriate',
        urgency: 'medium'
      };

    case 'occupied':
      // Check for overdue checkouts
      const roomGuests = guests.filter(g => g.roomId === room._id);
      const overdueGuests = roomGuests.filter(g => 
        g.status === 'checked-in' && 
        g.reservationEnd && 
        new Date(g.reservationEnd) < new Date()
      );
      
      if (overdueGuests.length > 0) {
        return {
          action: 'contact-guest',
          description: 'Contact guest about overdue checkout',
          urgency: 'high'
        };
      }
      break;

    default:
      return null;
  }

  return null;
} 