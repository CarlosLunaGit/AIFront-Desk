// Mock Activity History Data - Comprehensive activity tracking across the entire hotel system
export interface ActivityHistoryEntry {
  id: string;
  timestamp: string;
  hotelId: string;
  category: 
    | 'reservation'
    | 'guest_management'
    | 'room_management'
    | 'check_in_out'
    | 'maintenance'
    | 'housekeeping'
    | 'system'
    | 'communication'
    | 'payment'
    | 'user_management';
  action: string;
  description: string;
  entityType: 'reservation' | 'guest' | 'room' | 'user' | 'payment' | 'communication' | 'system';
  entityId?: string;
  entityName?: string;
  performedBy: string;
  details?: {
    roomNumber?: string;
    guestName?: string;
    fromStatus?: string;
    toStatus?: string;
    amount?: number;
    notes?: string;
    [key: string]: any;
  };
  severity: 'info' | 'success' | 'warning' | 'error';
  affectedEntities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
}

export const mockActivityHistory: ActivityHistoryEntry[] = [
  // Recent Activities (January 2024)
  {
    id: 'ACT-001',
    timestamp: '2024-01-28T14:30:00Z',
    hotelId: '65a000000000000000000001',
    category: 'room_management',
    action: 'maintenance_scheduled',
    description: 'Room 304 scheduled for plumbing repair',
    entityType: 'room',
    entityId: '65b000000000000000000009',
    entityName: 'Room 304',
    performedBy: 'maintenance-supervisor',
    details: {
      roomNumber: '304',
      fromStatus: 'available',
      toStatus: 'maintenance',
      notes: 'Guest reported slow drainage in bathroom sink'
    },
    severity: 'warning',
    affectedEntities: [
      { type: 'room', id: '65b000000000000000000009', name: 'Room 304' }
    ]
  },
  {
    id: 'ACT-002',
    timestamp: '2024-01-28T13:15:00Z',
    hotelId: '65a000000000000000000001',
    category: 'housekeeping',
    action: 'cleaning_completed',
    description: 'Room 303 deep cleaning completed',
    entityType: 'room',
    entityId: '65b000000000000000000008',
    entityName: 'Room 303',
    performedBy: 'housekeeping-maria',
    details: {
      roomNumber: '303',
      fromStatus: 'cleaning',
      toStatus: 'available',
      notes: 'Full sanitization and restocking completed'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'room', id: '65b000000000000000000008', name: 'Room 303' }
    ]
  },
  {
    id: 'ACT-003',
    timestamp: '2024-01-27T16:45:00Z',
    hotelId: '65a000000000000000000001',
    category: 'reservation',
    action: 'reservation_created',
    description: 'New reservation created for Family Suite',
    entityType: 'reservation',
    entityId: 'res-0001-0006',
    entityName: 'Family Suite Reservation',
    performedBy: 'front-desk-sarah',
    details: {
      roomNumber: '301',
      guestName: 'Sarah Connor',
      amount: 3000,
      notes: 'Premium family suite for extended business stay'
    },
    severity: 'info',
    affectedEntities: [
      { type: 'reservation', id: 'res-0001-0006', name: 'Reservation #PLAZ0006' },
      { type: 'room', id: '65b000000000000000000006', name: 'Room 301' }
    ]
  },
  {
    id: 'ACT-004',
    timestamp: '2024-01-26T11:30:00Z',
    hotelId: '65a000000000000000000001',
    category: 'guest_management',
    action: 'guest_created',
    description: 'New guest profile created for Sarah Connor',
    entityType: 'guest',
    entityId: '65d000000000000000000007',
    entityName: 'Sarah Connor',
    performedBy: 'front-desk-sarah',
    details: {
      guestName: 'Sarah Connor',
      notes: 'Corporate executive, VIP treatment requested'
    },
    severity: 'info',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000007', name: 'Sarah Connor' }
    ]
  },
  {
    id: 'ACT-005',
    timestamp: '2024-01-25T15:20:00Z',
    hotelId: '65a000000000000000000001',
    category: 'check_in_out',
    action: 'guest_checked_in',
    description: 'Emma Wilson checked into Room 202',
    entityType: 'guest',
    entityId: '65d000000000000000000005',
    entityName: 'Emma Wilson',
    performedBy: 'front-desk-john',
    details: {
      roomNumber: '202',
      guestName: 'Emma Wilson',
      notes: 'Early check-in approved'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000005', name: 'Emma Wilson' },
      { type: 'room', id: '65b000000000000000000004', name: 'Room 202' }
    ]
  },
  {
    id: 'ACT-006',
    timestamp: '2024-01-25T10:00:00Z',
    hotelId: '65a000000000000000000001',
    category: 'system',
    action: 'system_backup',
    description: 'Daily system backup completed successfully',
    entityType: 'system',
    performedBy: 'system-auto',
    details: {
      notes: 'All hotel data backed up to cloud storage'
    },
    severity: 'success'
  },
  {
    id: 'ACT-007',
    timestamp: '2024-01-24T19:30:00Z',
    hotelId: '65a000000000000000000001',
    category: 'payment',
    action: 'payment_processed',
    description: 'Payment processed for Michael Davis reservation',
    entityType: 'payment',
    entityId: 'PAY-001',
    entityName: 'Payment #PAY-001',
    performedBy: 'payment-gateway',
    details: {
      guestName: 'Michael Davis',
      amount: 1200,
      notes: 'Credit card payment for Room 203'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000006', name: 'Michael Davis' },
      { type: 'reservation', id: 'res-0001-0005', name: 'Reservation #PLAZ0005' }
    ]
  },
  {
    id: 'ACT-008',
    timestamp: '2024-01-24T14:15:00Z',
    hotelId: '65a000000000000000000001',
    category: 'communication',
    action: 'whatsapp_message_sent',
    description: 'Welcome message sent to Alice Johnson',
    entityType: 'communication',
    entityId: 'MSG-001',
    entityName: 'WhatsApp Message',
    performedBy: 'ai-assistant',
    details: {
      guestName: 'Alice Johnson',
      notes: 'Automated welcome message with check-in instructions'
    },
    severity: 'info',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000001', name: 'Alice Johnson' }
    ]
  },
  {
    id: 'ACT-009',
    timestamp: '2024-01-23T16:45:00Z',
    hotelId: '65a000000000000000000001',
    category: 'room_management',
    action: 'room_rate_updated',
    description: 'Room rates updated for Premium Suite',
    entityType: 'room',
    entityId: '65b000000000000000000003',
    entityName: 'Room 201',
    performedBy: 'manager-admin',
    details: {
      roomNumber: '201',
      notes: 'Seasonal rate adjustment - increased by 10%'
    },
    severity: 'info',
    affectedEntities: [
      { type: 'room', id: '65b000000000000000000003', name: 'Room 201' }
    ]
  },
  {
    id: 'ACT-010',
    timestamp: '2024-01-22T12:30:00Z',
    hotelId: '65a000000000000000000001',
    category: 'check_in_out',
    action: 'guest_checked_out',
    description: 'Carol Wilson checked out of Room 201',
    entityType: 'guest',
    entityId: '65d000000000000000000004',
    entityName: 'Carol Wilson',
    performedBy: 'front-desk-sarah',
    details: {
      roomNumber: '201',
      guestName: 'Carol Wilson',
      notes: 'Late checkout approved, satisfied customer'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000004', name: 'Carol Wilson' },
      { type: 'room', id: '65b000000000000000000003', name: 'Room 201' }
    ]
  },
  {
    id: 'ACT-011',
    timestamp: '2024-01-21T18:20:00Z',
    hotelId: '65a000000000000000000001',
    category: 'user_management',
    action: 'staff_login',
    description: 'Front desk staff logged into system',
    entityType: 'user',
    entityId: 'USER-001',
    entityName: 'Sarah Peterson',
    performedBy: 'sarah-peterson',
    details: {
      notes: 'Evening shift login'
    },
    severity: 'info'
  },
  {
    id: 'ACT-012',
    timestamp: '2024-01-20T20:45:00Z',
    hotelId: '65a000000000000000000001',
    category: 'reservation',
    action: 'reservation_cancelled',
    description: 'Reservation cancelled due to guest request',
    entityType: 'reservation',
    entityId: 'res-0001-0007',
    entityName: 'Cancelled Reservation',
    performedBy: 'front-desk-john',
    details: {
      guestName: 'Robert Brown',
      amount: 450,
      notes: 'Family emergency - full refund issued'
    },
    severity: 'warning',
    affectedEntities: [
      { type: 'reservation', id: 'res-0001-0007', name: 'Reservation #PLAZ0007' }
    ]
  },

  // Seaside Resort Activities
  {
    id: 'ACT-013',
    timestamp: '2024-01-25T14:30:00Z',
    hotelId: '65a000000000000000000002',
    category: 'check_in_out',
    action: 'guest_checked_in',
    description: 'David Chen checked into Seaside Room 101',
    entityType: 'guest',
    entityId: '65d000000000000000000008',
    entityName: 'David Chen',
    performedBy: 'seaside-front-desk',
    details: {
      roomNumber: '101',
      guestName: 'David Chen',
      notes: 'Welcome drink provided'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'guest', id: '65d000000000000000000008', name: 'David Chen' },
      { type: 'room', id: '65b000000000000000000010', name: 'Seaside Room 101' }
    ]
  },
  {
    id: 'ACT-014',
    timestamp: '2024-01-24T16:15:00Z',
    hotelId: '65a000000000000000000002',
    category: 'maintenance',
    action: 'ac_repair_completed',
    description: 'Air conditioning repair completed in Room 104',
    entityType: 'room',
    entityId: '65b000000000000000000013',
    entityName: 'Seaside Room 104',
    performedBy: 'seaside-maintenance',
    details: {
      roomNumber: '104',
      fromStatus: 'maintenance',
      toStatus: 'available',
      notes: 'AC unit replaced, room temperature optimal'
    },
    severity: 'success',
    affectedEntities: [
      { type: 'room', id: '65b000000000000000000013', name: 'Seaside Room 104' }
    ]
  },
  {
    id: 'ACT-015',
    timestamp: '2024-01-23T11:00:00Z',
    hotelId: '65a000000000000000000002',
    category: 'housekeeping',
    action: 'room_cleaning_started',
    description: 'Deep cleaning started for Seaside Room 103',
    entityType: 'room',
    entityId: '65b000000000000000000012',
    entityName: 'Seaside Room 103',
    performedBy: 'seaside-housekeeping',
    details: {
      roomNumber: '103',
      fromStatus: 'occupied',
      toStatus: 'cleaning',
      notes: 'Post-checkout deep cleaning with ocean view windows'
    },
    severity: 'info',
    affectedEntities: [
      { type: 'room', id: '65b000000000000000000012', name: 'Seaside Room 103' }
    ]
  },

  // System and Administrative Activities
  {
    id: 'ACT-016',
    timestamp: '2024-01-20T09:00:00Z',
    hotelId: '65a000000000000000000001',
    category: 'system',
    action: 'rate_sync_completed',
    description: 'Daily rate synchronization with booking platforms completed',
    entityType: 'system',
    performedBy: 'system-auto',
    details: {
      notes: 'Rates updated across all OTA platforms'
    },
    severity: 'success'
  },
  {
    id: 'ACT-017',
    timestamp: '2024-01-19T15:30:00Z',
    hotelId: '65a000000000000000000001',
    category: 'user_management',
    action: 'permission_updated',
    description: 'Staff permissions updated for housekeeping supervisor',
    entityType: 'user',
    entityId: 'USER-002',
    entityName: 'Maria Rodriguez',
    performedBy: 'admin-manager',
    details: {
      notes: 'Added access to maintenance scheduling'
    },
    severity: 'info'
  },
  {
    id: 'ACT-018',
    timestamp: '2024-01-18T17:45:00Z',
    hotelId: '65a000000000000000000001',
    category: 'communication',
    action: 'email_campaign_sent',
    description: 'Weekly newsletter sent to past guests',
    entityType: 'communication',
    entityId: 'EMAIL-001',
    entityName: 'Newsletter Campaign',
    performedBy: 'marketing-system',
    details: {
      notes: '450 emails sent with 89% delivery rate'
    },
    severity: 'success'
  },
  {
    id: 'ACT-019',
    timestamp: '2024-01-17T13:20:00Z',
    hotelId: '65a000000000000000000001',
    category: 'payment',
    action: 'refund_processed',
    description: 'Refund processed for cancelled reservation',
    entityType: 'payment',
    entityId: 'REF-001',
    entityName: 'Refund #REF-001',
    performedBy: 'finance-system',
    details: {
      amount: 450,
      notes: 'Full refund for emergency cancellation'
    },
    severity: 'info'
  },
  {
    id: 'ACT-020',
    timestamp: '2024-01-16T10:15:00Z',
    hotelId: '65a000000000000000000001',
    category: 'system',
    action: 'security_scan_completed',
    description: 'Weekly security scan completed - no issues found',
    entityType: 'system',
    performedBy: 'security-system',
    details: {
      notes: 'All systems secure, no vulnerabilities detected'
    },
    severity: 'success'
  }
]; 