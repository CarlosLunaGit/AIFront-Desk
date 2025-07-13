import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, MenuItem,
  Tabs, Tab, Collapse, IconButton, Tooltip, Chip, CircularProgress, Menu, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  InfoOutlined as InfoOutlinedIcon, MoreVert as MoreVertIcon, Cancel as CancelIcon, 
  PersonOff as PersonOffIcon, Stop as StopIcon, Delete as DeleteIcon, TableChart as TableChartIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import { useCurrentHotel } from '../services/hooks/useHotel';
import { useReservations, useCreateReservation, useUpdateReservation, useDeleteReservation } from '../services/hooks/useReservations';
import { useGuests } from '../services/hooks/useGuests';
import { useRooms } from '../services/hooks/useRooms';
import type { ReservationAction } from '../types/index';
import { 
  calculateCancellationFee, 
  createReservationAction,
  generateConfirmationNumber,
  determineReservationStatus,
  getReservationStatusDisplay
} from '../utils/reservationUtils';
// Import the Enhanced Reservation Wizard
import { EnhancedReservationWizard } from '../components/Reservations/EnhancedReservationWizard';
import ReservationCalendar from '../components/Reservations/ReservationCalendar';
import { Guest } from '../types/guest';
import { Room } from '../types/room';

const ReservationsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Use the new hotel entities instead of hotel configuration
  const { data: currentHotel, isLoading: hotelLoading } = useCurrentHotel();
  const hotelId = currentHotel?._id;
  
  // Fetch reservations
  const { data: reservations = [], isLoading: loadingReservations } = useReservations(hotelId);
  // Fetch guests for the current hotel
  const { data: guests = [], isLoading: loadingGuests } = useGuests(hotelId);
  // Fetch rooms for the current hotel  
  const { data: rooms = [], isLoading: loadingRooms } = useRooms();

  // Only show reservations for rooms in the current hotel
  const roomIdsForHotel = rooms.filter((r: any) => r.hotelId === hotelId).map((r: any) => r._id || r.id);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dates');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState(0); // 0 = Active, 1 = Inactive
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table'); // View toggle state
  const [calendarSearchResults, setCalendarSearchResults] = useState<{ hasResults: boolean; resultCount: number }>({ hasResults: false, resultCount: 0 });

  // Business action states (replacing delete dialog)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [businessActionDialog, setBusinessActionDialog] = useState<{
    open: boolean;
    action: string | null;
    reservation: any | null;
    cancellationFee?: number;
  }>({ open: false, action: null, reservation: null });
  const [actionReason, setActionReason] = useState('');

  // Handle search results from calendar
  const handleCalendarSearchResult = (hasResults: boolean, resultCount: number) => {
    setCalendarSearchResults({ hasResults, resultCount });
  };

  // Filter reservations by hotel and categorize by active/inactive status
  const hotelReservations = reservations.filter((res: any) => {
    // Check both roomId (new format) and rooms (legacy format)
    return res.hotelId === hotelId || 
           roomIdsForHotel.includes(res.roomId) || 
           roomIdsForHotel.includes(res.rooms);
  });
  
  const categorizedReservations = hotelReservations.map((res: any) => {
    const room = rooms.find((r: any) => r._id === res.roomId || r.id === res.rooms || r._id === res.rooms);
    const resGuests = guests.filter((g: any) => res.guestIds?.includes(g._id));
    
    if (room && resGuests.length > 0) {
      // Use the new business status logic
      const status = determineReservationStatus(resGuests, room, res.status);
      return { ...res, reservationStatus: status };
    }
    
    return { 
      ...res, 
      reservationStatus: { 
        isActive: false, 
        reason: 'Room or guests not found', 
        category: 'inactive' as const 
      } 
    };
  });

  // Filter based on business status instead of just guest/room status
  const activeReservations = categorizedReservations.filter((res: any) => {
    
    // A reservation is active if:
    // 1. It has no reservationStatus (default active)
    // 2. Its reservationStatus is 'active'
    // 3. Its status is 'booked' (legacy support)
    // 4. Its reservationStatus is not one of the inactive business states
    // 5. If reservationStatus is an object, check the isActive property
    
    let isActive = false;
    
    if (typeof res.reservationStatus === 'string') {
      // Handle business status strings
      isActive = !res.reservationStatus || 
                 res.reservationStatus === 'active' || 
                 !['cancelled', 'no-show', 'terminated', 'completed'].includes(res.reservationStatus);
    } else if (typeof res.reservationStatus === 'object' && res.reservationStatus !== null) {
      // Handle status objects from determineReservationStatus
      isActive = res.reservationStatus.isActive === true;
    } else {
      // No reservationStatus, check legacy status
      isActive = res.status === 'booked' || res.status === 'active';
    }
    
    return isActive;
  });
  
  const inactiveReservations = categorizedReservations.filter((res: any) => {
    // A reservation is inactive if it has a specific inactive status
    let isInactive = false;
    
    if (typeof res.reservationStatus === 'string') {
      // Handle business status strings
      isInactive = ['cancelled', 'no-show', 'terminated', 'completed'].includes(res.reservationStatus);
    } else if (typeof res.reservationStatus === 'object' && res.reservationStatus !== null) {
      // Handle status objects from determineReservationStatus
      isInactive = res.reservationStatus.isActive === false;
    }
    
    return isInactive;
  });

  const currentReservations = activeTab === 0 ? activeReservations : inactiveReservations;

  // Apply search filter to current reservations
  const filteredReservations = currentReservations.filter((res: any) => {
      if (!search) return true;
      
      const searchLower = search.toLowerCase();
      
      // Search by reservation ID
      if (res._id && res._id.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by confirmation number
      if (res.confirmationNumber && res.confirmationNumber.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by guest names
      if (res.guestIds && Array.isArray(res.guestIds)) {
        const hasMatchingGuest = res.guestIds.some((gid: string) => {
          const guest = guests.find((g: any) => g._id === gid);
          return guest && guest.name && guest.name.toLowerCase().includes(searchLower);
        });
        if (hasMatchingGuest) return true;
      }
      
      // Search by room number (using roomId to find the room)
      if (res.roomId) {
        const room = rooms.find((r: any) => r._id === res.roomId);
        if (room && room.number && room.number.toString().toLowerCase().includes(searchLower)) {
          return true;
        }
      }
      
      // Search by legacy rooms field (if it exists)
      if (res.rooms && res.rooms.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by notes
      if (res.notes && res.notes.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by special requests
      if (res.specialRequests) {
        const requests = Array.isArray(res.specialRequests) 
          ? res.specialRequests.join(' ') 
          : res.specialRequests;
        if (requests.toLowerCase().includes(searchLower)) {
          return true;
        }
      }
      
      return false;
    });

  // Only show available rooms for new reservations
  const availableRooms = rooms.filter((r: any) => (r.status === 'available' || r.status === 'partially-reserved') && r.hotelId === hotelId);

  // Mutations
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation();
  const deleteMutation = useDeleteReservation(); // This will be renamed to handle business actions

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ guestIds: [] as string[], rooms: '', notes: '', price: '', start: null as Dayjs | null, end: null as Dayjs | null });
  const [error, setError] = useState('');
  const [newGuests, setNewGuests] = useState<any[]>([]);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  
  // Enhanced Reservation Wizard state
  const [enhancedWizardOpen, setEnhancedWizardOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name !== 'guests') { setForm(f => ({ ...f, [name]: value })); }
  };
  const handleDateChange = (key: 'start' | 'end', value: Dayjs | null) => {
    setForm({ ...form, [key]: value });
  };

  const handleCreateOrEdit = async () => {
    if (!form.start || !form.end) { setError('Please select dates'); return; }
    const dates = `${form.start.format('YYYY-MM-DD')} to ${form.end.format('YYYY-MM-DD')}`;
    const payload = { ...form, dates, newGuests };
    
    try {
      if (editId) { 
        await updateMutation.mutateAsync({ id: editId, ...payload }); 
        enqueueSnackbar('Reservation updated successfully.', { variant: 'success' });
      } else { 
        const newReservation = await createMutation.mutateAsync(payload);
        // Generate confirmation number for new reservations
        if (newReservation && hotelId) {
          const confirmationNumber = generateConfirmationNumber(hotelId, newReservation.id);
          enqueueSnackbar(`Reservation created successfully. Confirmation: ${confirmationNumber}`, { variant: 'success' });
        }
      }
      setOpen(false); 
      setEditId(null); 
      setNewGuests([]);
    } catch (error) {
      enqueueSnackbar('Failed to save reservation.', { variant: 'error' });
    }
  };

  const handleEdit = (res: any) => {
    // Handle both new format (checkInDate/checkOutDate) and legacy format (dates)
    let start, end;
    if (res.checkInDate && res.checkOutDate) {
      start = dayjs(res.checkInDate);
      end = dayjs(res.checkOutDate);
    } else if (res.dates) {
      [start, end] = res.dates.split(' to ').map((d: string) => dayjs(d));
    } else {
      start = dayjs();
      end = dayjs().add(1, 'day');
    }
    
    setForm({ 
      guestIds: res.guestIds || [], 
      rooms: res.roomId || res.rooms || '', 
      notes: res.notes || '', 
      price: String(res.totalAmount || res.price || ''), 
      start, 
      end 
    });
    setEditId(res._id);
    setOpen(true);
  };

  // New business action handlers
  const handleBusinessActionClick = (event: React.MouseEvent<HTMLElement>, reservation: any) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedReservationId(reservation._id || reservation.id);
  };

  const handleBusinessAction = async (reservationId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationStatus: action,
          reason: reason || actionReason,
          performedBy: 'hotel-staff',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Refresh the reservations data
        // queryClient.invalidateQueries({ queryKey: ['reservations'] }); // This line was removed as per the edit hint
        
        // Close the action menu
        setActionMenuAnchor(null);
        setSelectedReservationId(null);
        setActionReason('');
      }
    } catch (error) {
      console.error('Error performing business action:', error);
    }
  };

  const handleConfirmBusinessAction = async () => {
    const { action, reservation } = businessActionDialog;
    if (!action || !reservation) return;

    try {
      if (action === 'delete') {
        // Use DELETE endpoint for removing from system
        await deleteMutation.mutateAsync({ 
          id: reservation.id, 
          reason: actionReason || 'Removed from system' 
        });
        enqueueSnackbar('Reservation removed from system successfully.', { variant: 'success' });
      } else {
        // Create the action payload with business logic for other actions
        const actionPayload = createReservationAction(action as ReservationAction, reservation, actionReason, 'hotel-staff');
        
        // Update the reservation with new status
        await updateMutation.mutateAsync({ 
          id: reservation.id, 
          ...actionPayload 
        });

        // Show appropriate success message
        const actionMessages: Record<string, string> = {
          cancel: 'Reservation cancelled successfully.',
          'no-show': 'Reservation marked as no-show.',
          terminate: 'Reservation terminated successfully.',
          complete: 'Reservation completed successfully.'
        };

        enqueueSnackbar(actionMessages[action] || `${action} completed successfully.`, { variant: 'success' });
      }
      
      setSelectedReservationId(null);
    } catch (error) {
      console.error('Business action error:', error);
      if (action === 'delete') {
        enqueueSnackbar('Failed to remove reservation from system.', { variant: 'error' });
      } else {
        enqueueSnackbar(`Failed to ${action} reservation.`, { variant: 'error' });
      }
    }

    setBusinessActionDialog({ open: false, action: null, reservation: null });
    setActionReason('');
  };

  // Administrative delete handler (for removing from active management)
  const handleRequestDelete = (id: string) => {
    const reservation = filteredReservations.find((r: any) => r._id === id || r.id === id);
    if (reservation) {
      setBusinessActionDialog({
        open: true,
        action: 'delete', // Use 'delete' action instead of 'cancel'
        reservation,
        cancellationFee: 0 // No fee for administrative deletion
      });
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'dates') {
      // Use checkInDate for sorting, fallback to legacy dates field
      aVal = a.checkInDate || a.dates?.split(' to ')[0] || '';
      bVal = b.checkInDate || b.dates?.split(' to ')[0] || '';
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Check business rules for actions
  const getAvailableActions = (reservation: any) => {
    const resId = reservation._id || reservation.id;
    const actions = [];
    
    // For active reservations (most common case)
    if (reservation.status === 'booked' || reservation.status === 'active' || !reservation.status || reservation.reservationStatus === 'active') {
      
      // Cancel option - always available for active reservations
      actions.push({ action: 'cancel', label: 'Cancel Reservation', icon: <CancelIcon /> });

      // No-show option - available for future reservations
      const reservationStart = new Date(reservation.checkInDate || reservation.dates?.split(' to ')[0] || '');
      const now = new Date();
      if (reservationStart <= now) {
        actions.push({ action: 'no-show', label: 'Mark No-Show', icon: <PersonOffIcon /> });
      }

      // Terminate option - always available for active reservations
      actions.push({ action: 'terminate', label: 'Terminate Early', icon: <StopIcon /> });
    }

    // Complete option - for checked-in guests
    const associatedGuests = guests.filter((g: any) => reservation.guestIds?.includes(g._id));
    const hasCheckedInGuests = associatedGuests.some((g: any) => g.status === 'checked-in');
    if (hasCheckedInGuests) {
      actions.push({ action: 'complete', label: 'Complete Reservation', icon: <EditIcon /> });
    }

    // Administrative delete option (always available)
    actions.push({ action: 'delete', label: 'Remove from System', icon: <DeleteIcon /> });

    return actions;
  };

  if (hotelLoading || loadingReservations || loadingGuests || loadingRooms) {
    return <Box display="flex" justifyContent="center" alignItems="center" p={3}><CircularProgress /></Box>;
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" gutterBottom>
            {currentHotel ? (
              <>Welcome to <b>{currentHotel.name}</b> Reservations
                <Tooltip title={`View and manage all reservations for ${currentHotel.name}. All changes apply only to this hotel.`}>
                  <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
                </Tooltip>
              </>
            ) : (
              'Reservations'
            )}
          </Typography>
          
          {/* View Toggle Buttons */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="table" aria-label="table view">
              <TableChartIcon sx={{ mr: 1 }} />
              TABLE
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarMonthIcon sx={{ mr: 1 }} />
              CALENDAR
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder={viewMode === 'calendar' ? "Search reservations in calendar..." : "Search reservations..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ 
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
              endAdornment: search && (
                <Box display="flex" alignItems="center" gap={1}>
                  {viewMode === 'calendar' && calendarSearchResults.hasResults && (
                    <Chip
                      label={`${calendarSearchResults.resultCount} found`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {viewMode === 'table' && filteredReservations.length !== currentReservations.length && (
                    <Chip
                      label={`${filteredReservations.length} found`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              )
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setEnhancedWizardOpen(true)}
            sx={{ ml: 'auto' }}
          >
            CREATE RESERVATION
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<EditIcon />}
            disabled={!selectedReservationId}
            onClick={() => {
              const res = sortedReservations.find((r: any) => r._id === selectedReservationId || r.id === selectedReservationId);
              if (res) handleEdit(res);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MoreVertIcon />}
            disabled={!selectedReservationId}
            onClick={(e) => {
              const res = sortedReservations.find((r: any) => r._id === selectedReservationId || r.id === selectedReservationId);
              if (res) handleBusinessActionClick(e, res);
            }}
          >
            Actions
          </Button>
        </Box>
      </Paper>

      {/* Business Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        {selectedReservationId && (() => {
          const reservation = sortedReservations.find((r: any) => r.id === selectedReservationId);
          const availableActions = reservation ? getAvailableActions(reservation) : [];
          
          return availableActions.map((actionItem, index) => (
            <MenuItem 
              key={actionItem.action}
              onClick={() => {
                if (actionItem.action === 'delete') {
                  handleRequestDelete(selectedReservationId!);
                  setActionMenuAnchor(null);
                } else {
                  handleBusinessAction(selectedReservationId!, actionItem.action as string);
                }
              }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: actionItem.action === 'delete' ? 'error.main' : 'inherit'
              }}
            >
              {actionItem.icon}
              {actionItem.label}
            </MenuItem>
          ));
        })()}
      </Menu>

      {/* Conditional View Rendering */}
      {viewMode === 'table' ? (
        <>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label={`Active (${activeReservations.length})`} />
            <Tab label={`Inactive (${inactiveReservations.length})`} />
          </Tabs>
          <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Reservation ID</TableCell>
              <TableCell onClick={() => handleSort('guestIds')} style={{ cursor: 'pointer' }}>Guest(s)</TableCell>
              <TableCell onClick={() => handleSort('rooms')} style={{ cursor: 'pointer' }}>Room(s)</TableCell>
              <TableCell onClick={() => handleSort('dates')} style={{ cursor: 'pointer' }}>Dates</TableCell>
              <TableCell onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Price</TableCell>
              <TableCell onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</TableCell>
              <TableCell onClick={() => handleSort('notes')} style={{ cursor: 'pointer' }}>Notes</TableCell>
              <TableCell onClick={() => handleSort('specialRequests')} style={{ cursor: 'pointer' }}>Special Requests</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedReservations.map((res: any) => {
              const guestNames = res.guestIds && Array.isArray(res.guestIds)
                ? res.guestIds.map((gid: string) => {
                    const g = guests.find((gg: any) => gg._id === gid);
                    return g ? g.name : gid;
                  })
                : [];
              const firstGuest = guestNames[0] || '';
              const moreCount = guestNames.length - 1;
              const expanded = expandedRows[res._id];
              // Normalize specialRequests to always be an array
              const specialRequests = Array.isArray(res.specialRequests) 
                ? res.specialRequests 
                : (res.specialRequests ? [res.specialRequests] : []);
              const hasMultipleSpecialRequests = specialRequests.length > 1;
              const hasMultipleGuests = moreCount > 0;
              const shouldShowExpandedRow = hasMultipleGuests || hasMultipleSpecialRequests;
              // Use business status for display
              const statusDisplay = getReservationStatusDisplay(res.reservationStatus, res.status);
              return (
                <React.Fragment key={res._id}>
                  <TableRow
                    hover
                    selected={selectedReservationId === res._id}
                    onClick={() => setSelectedReservationId(res._id)}
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedReservationId(res._id);
                    }}
                  >
                    <TableCell>{res._id}</TableCell>
                    <TableCell>
                      {firstGuest}
                      {moreCount > 0 && (
                        <>
                          {' '}
                          <IconButton size="small" onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res._id]: !expanded })); }}>
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                          <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res._id]: !expanded })); }}>
                            +{moreCount} more
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{(() => {
                      const room = rooms.find((r: Room) => r._id === res.roomId);
                      return room ? room.number : res.roomId;
                    })()}</TableCell>
                    <TableCell>{res.checkInDate} to {res.checkOutDate}</TableCell>
                    <TableCell>${res.totalAmount}</TableCell>
                    <TableCell>
                      <Tooltip title={statusDisplay.description} arrow>
                        <Chip 
                          label={statusDisplay.label}
                          size="small"
                          sx={{ 
                            backgroundColor: statusDisplay.color,
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{res.notes}</TableCell>
                    <TableCell>
                      {(() => {
                        if (specialRequests.length === 0) {
                          return '—';
                        }
                        if (specialRequests.length === 1) {
                          return specialRequests[0];
                        }
                        const firstRequest = specialRequests[0];
                        const moreCount = specialRequests.length - 1;
                        return (
                          <>
                            {firstRequest}
                            {' '}
                            <IconButton size="small" onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res._id]: !expanded })); }}>
                              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                            <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res._id]: !expanded })); }}>
                              +{moreCount} more
                            </span>
                          </>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                  {shouldShowExpandedRow && (
                    <TableRow>
                      <TableCell colSpan={8} style={{ padding: 0, background: '#f9f9f9' }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box pl={6} py={1}>
                            {hasMultipleGuests && (
                              <>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Additional Guests:</Typography>
                            {guestNames.slice(1).map((name: string, idx: number) => (
                              <Typography key={idx} variant="body2">{name}</Typography>
                            ))}
                              </>
                            )}
                            {hasMultipleSpecialRequests && (
                              <>
                                {hasMultipleGuests && <Divider sx={{ my: 1 }} />}
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Special Requests:</Typography>
                                {specialRequests.slice(1).map((request: string, idx: number) => (
                                  <Typography key={idx} variant="body2">• {request}</Typography>
                                ))}
                              </>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      ) : (
        /* Calendar View */
        <ReservationCalendar
          reservations={hotelReservations}
          rooms={rooms.filter((r: any) => r.hotelId === hotelId)}
          guests={guests}
          searchTerm={search}
          onSearchResult={handleCalendarSearchResult}
        />
      )}

      {/* Create/Edit Reservation Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditId(null); }}>
        <DialogTitle>{editId ? 'Edit Reservation' : 'Create Reservation'}</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={guests}
            getOptionLabel={(option: any) => option.name}
            value={guests.filter((g: any) => form.guestIds?.includes(g._id))}
            onChange={(_, value) => setForm(f => ({ ...f, guestIds: value.map((g: any) => g._id) }))}
            renderInput={(params) => <TextField {...params} label="Guests" margin="normal" fullWidth />}
          />
          <Box display="flex" gap={2} alignItems="center" mt={1}>
            <TextField label="New Guest Name" value={newGuest.name} onChange={e => setNewGuest(g => ({ ...g, name: e.target.value }))} />
            <TextField label="Email" value={newGuest.email} onChange={e => setNewGuest(g => ({ ...g, email: e.target.value }))} />
            <TextField label="Phone" value={newGuest.phone} onChange={e => setNewGuest(g => ({ ...g, phone: e.target.value }))} />
            <Button onClick={() => { if (newGuest.name) { setNewGuests(arr => [...arr, newGuest]); setNewGuest({ name: '', email: '', phone: '' }); } }}>Add Guest</Button>
          </Box>
          {newGuests.length > 0 && (
            <Box mt={1}>
              <Typography variant="subtitle2">Guests to be created:</Typography>
              {newGuests.map((g: Guest, i: number) => {
                return <Typography key={i}>{g.name} ({g.email})</Typography>
              })}
            </Box>
          )}
          <TextField
            select
            label="Room(s)"
            name="rooms"
            value={form.rooms}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            {availableRooms.map((r: Room) => <MenuItem key={r._id} value={r._id}>{r.number}</MenuItem>)}
          </TextField>
          <Box display="flex" gap={2}>
            <DatePicker
              label="Start Date"
              value={form.start}
              onChange={(value) => handleDateChange('start', value as Dayjs | null)}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
            <DatePicker
              label="End Date"
              value={form.end}
              onChange={(value) => handleDateChange('end', value as Dayjs | null)}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
          </Box>
          <TextField label="Price" name="price" value={form.price} onChange={handleChange} fullWidth margin="normal" type="number" />
          <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth margin="normal" multiline rows={2} />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditId(null); }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleCreateOrEdit}>{editId ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Business Action Confirmation Dialog */}
      <Dialog 
        open={businessActionDialog.open} 
        onClose={() => setBusinessActionDialog({ open: false, action: null, reservation: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {businessActionDialog.action === 'cancel' && 'Cancel Reservation'}
          {businessActionDialog.action === 'no-show' && 'Mark as No-Show'}
          {businessActionDialog.action === 'terminate' && 'Terminate Reservation'}
          {businessActionDialog.action === 'complete' && 'Complete Reservation'}
          {businessActionDialog.action === 'delete' && 'Remove from System'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {businessActionDialog.action === 'cancel' && 'Are you sure you want to cancel this reservation?'}
            {businessActionDialog.action === 'no-show' && 'Mark this reservation as a no-show? Guest did not arrive.'}
            {businessActionDialog.action === 'terminate' && 'Terminate this reservation early? This is for early checkout or eviction.'}
            {businessActionDialog.action === 'complete' && 'Mark this reservation as completed?'}
            {businessActionDialog.action === 'delete' && 'Permanently remove this reservation from the system? This action cannot be undone.'}
          </Typography>
          
          {businessActionDialog.action === 'cancel' && businessActionDialog.cancellationFee !== undefined && (
            <Box mt={2} p={2} bgcolor="warning.light" borderRadius={1}>
              <Typography variant="subtitle2" color="warning.dark">
                Cancellation Fee: ${businessActionDialog.cancellationFee.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Refund Amount: ${((businessActionDialog.reservation?.price || 0) - businessActionDialog.cancellationFee).toFixed(2)}
              </Typography>
            </Box>
          )}

          <TextField
            label="Reason (optional)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="Enter reason for this action..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBusinessActionDialog({ open: false, action: null, reservation: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color={businessActionDialog.action === 'cancel' || businessActionDialog.action === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmBusinessAction}
          >
            Confirm {businessActionDialog.action ? 
              businessActionDialog.action.charAt(0).toUpperCase() + businessActionDialog.action.slice(1) : 
              'Action'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Reservation Wizard */}
      <EnhancedReservationWizard
        open={enhancedWizardOpen}
        onClose={() => setEnhancedWizardOpen(false)}
        onSuccess={(reservation) => {
          // Close wizard and show success message
          setEnhancedWizardOpen(false);
          
          // Generate confirmation number
          if (hotelId) {
            const confirmationNumber = generateConfirmationNumber(hotelId, reservation.id);
            enqueueSnackbar(`Enhanced reservation created successfully! Confirmation: ${confirmationNumber}`, { 
              variant: 'success',
              autoHideDuration: 6000 
            });
          } else {
            enqueueSnackbar('Enhanced reservation created successfully!', { 
              variant: 'success' 
            });
          }
          
          // Note: React Query will automatically refetch the reservations due to the mutation
        }}
      />
    </Box>
  );
};

export default ReservationsPage; 