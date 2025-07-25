import React, { useContext, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import { HotelConfigContext } from './Layout/Layout';
import { useGuests, useCreateGuest, useUpdateGuest, useDeleteGuest, useCheckInGuest, useCheckOutGuest, useToggleKeepOpen } from '../services/hooks/useGuests';
import { useRooms } from '../services/hooks/useRooms';
import { Room } from '../types/room';

const GuestManagement: React.FC = () => {
  const { currentConfig } = useContext(HotelConfigContext);
  const hotelId = (currentConfig as any)?.id || (currentConfig as any)?._id;
  
  const { data: guests, isLoading, error, isFetching } = useGuests(hotelId);

  // Modal state for viewing guest details
  const [viewGuest, setViewGuest] = useState<any | null>(null);
  // Modal state for editing guest
  const [editGuest, setEditGuest] = useState<any | null>(null);
  // State for delete confirmation
  const [deleteGuest, setDeleteGuest] = useState<any | null>(null);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '', status: 'booked', roomId: '', reservationStart: '', reservationEnd: '', keepOpen: false });
  const [search, setSearch] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // const rooms = Has all available rooms within the hotel under selection
  const { data: rooms = [] as Room[] } = useRooms({ hotelId: hotelId });

  // const availableRooms = Has only rooms that are available or partially-reserved (not occupied/maintenance/cleaning/reserved/checked-in)
  const availableRooms = rooms.filter(
    (room: any) =>
      (room.status === 'available' || room.status === 'partially-reserved') &&
      (Array.isArray(guests) ? !guests.some((g: any) => g.roomId === room._id && g.status === 'checked-in') : true)
  );

  // Filter guests by search
  const filteredGuests = Array.isArray(guests)
    ? guests.filter((g: any) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedGuest = filteredGuests.find((g: any) => g._id === selectedGuestId) || null;

  // Pass hotelId to all mutation hooks for proper cache invalidation
  const { mutate: addGuest, isPending: isAddingGuest } = useCreateGuest(hotelId);
  const { mutate: updateGuestMutation, isPending: isUpdatingGuest } = useUpdateGuest(hotelId);
  const { mutate: removeGuest, isPending: isDeletingGuest } = useDeleteGuest(hotelId);
  const { mutate: checkInGuestMutation, isPending: isCheckingIn } = useCheckInGuest(hotelId);
  const { mutate: checkOutGuestMutation, isPending: isCheckingOut } = useCheckOutGuest(hotelId);
  const { mutate: toggleKeepOpenMutation, isPending: isTogglingKeepOpen } = useToggleKeepOpen(hotelId);

  // Reset selected guest when hotel changes or guests data changes
  React.useEffect(() => {
    setSelectedGuestId(null);
    setSearch('');
  }, [hotelId]);

  // Handler for edit (now actually saves to backend)
  const handleEditSave = async () => {
    if (!editGuest) return;
    try {
      updateGuestMutation({ id: editGuest._id, ...editGuest });
      setEditGuest(null);
    } catch (err) {
      alert('Failed to save guest');
    }
  };

  // Handler for delete
  const handleDelete = async () => {
    if (!deleteGuest) return;
    try {
      removeGuest(deleteGuest._id);
      setDeleteGuest(null);
    } catch (err) {
      alert('Failed to delete guest');
    }
  };

  // Handler for Add Guest (POST to API)
  const handleAddGuest = async () => {
    try {
      addGuest({
        ...newGuest,
        status: newGuest.status,
        roomId: newGuest.roomId,
        reservationStart: newGuest.reservationStart,
        reservationEnd: newGuest.reservationEnd,
        checkIn: '',
        checkOut: '',
        keepOpen: newGuest.keepOpen,
        hotelId: hotelId, // Add hotelId for Hotel entity approach
      });
      setAddGuestOpen(false);
      setNewGuest({ name: '', email: '', phone: '', status: 'booked', roomId: '', reservationStart: '', reservationEnd: '', keepOpen: false });
    } catch (err) {
      alert('Failed to add guest');
    }
  };

  // Handler for check-in action
  const handleCheckIn = async (guest: any) => {
    try {
      checkInGuestMutation(guest._id);
    } catch (err) {
      alert('Failed to check in guest');
    }
  };

  // Handler for check-out action
  const handleCheckout = async (guest: any) => {
    try {
      checkOutGuestMutation(guest._id);
    } catch (err) {
      alert('Failed to check out guest');
    }
  };

  // Handler for toggle keepOpen
  const handleToggleKeepOpen = async (guest: any) => {
    try {
      toggleKeepOpenMutation({ id: guest._id, keepOpen: !guest.keepOpen });
    } catch (err) {
      alert('Failed to update keepOpen');
    }
  };

  function renderDateField(val: string) {
    if (!val || val === '—') return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  // Show loading state when no hotel is selected
  if (!hotelId) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading hotel configuration...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we load your hotel data.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {currentConfig ? (
            <>Welcome to <b>{currentConfig.name}</b> Guest Management
              <Tooltip title={`View and manage all guests for ${currentConfig.name}. All changes apply only to this hotel configuration.`}>
                <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
              </Tooltip>
            </>
          ) : (
            'Guest Management'
          )}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <TextField
            size="small"
            label="Search guests"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 300 }}
            disabled={isLoading || isFetching}
          />
          <Button
            variant="contained"
            startIcon={isAddingGuest ? <CircularProgress size={16} /> : <AddIcon />}
            onClick={() => setAddGuestOpen(true)}
            sx={{ ml: 2 }}
            disabled={isAddingGuest || isLoading}
          >
            {isAddingGuest ? 'Adding...' : 'Add Guest'}
          </Button>
        </Box>
      </Paper>
      
      {/* Action Buttons with Loading States */}
      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          color="error"
          disabled={!selectedGuest || isDeletingGuest}
          onClick={() => selectedGuest && setDeleteGuest(selectedGuest)}
          startIcon={isDeletingGuest ? <CircularProgress size={16} /> : undefined}
        >
          {isDeletingGuest ? 'Deleting...' : 'Delete'}
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || isUpdatingGuest}
          onClick={() => selectedGuest && setEditGuest(selectedGuest)}
          startIcon={isUpdatingGuest ? <CircularProgress size={16} /> : undefined}
        >
          {isUpdatingGuest ? 'Updating...' : 'Edit'}
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status === 'checked-in' || isCheckingIn}
          onClick={() => selectedGuest && handleCheckIn(selectedGuest)}
          startIcon={isCheckingIn ? <CircularProgress size={16} /> : undefined}
        >
          {isCheckingIn ? 'Checking In...' : 'Check In'}
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status !== 'checked-in' || isCheckingOut}
          onClick={() => selectedGuest && handleCheckout(selectedGuest)}
          startIcon={isCheckingOut ? <CircularProgress size={16} /> : undefined}
        >
          {isCheckingOut ? 'Checking Out...' : 'Check Out'}
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || isTogglingKeepOpen}
          onClick={() => selectedGuest && handleToggleKeepOpen(selectedGuest)}
          startIcon={isTogglingKeepOpen ? <CircularProgress size={16} /> : undefined}
        >
          {isTogglingKeepOpen ? 'Updating...' : (selectedGuest?.keepOpen ? 'Close' : 'Keep Open')}
        </Button>
      </Box>
      
      <Paper>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Box textAlign="center">
              <CircularProgress />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading guests...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we fetch guest data for {currentConfig?.name}
              </Typography>
            </Box>
          </Box>
        ) : error ? (
          <Alert severity="error">{(error as Error).message}</Alert>
        ) : (
          <>
            {/* Show loading overlay when fetching (e.g., during hotel switch) */}
            {isFetching && !isLoading && (
              <Box 
                sx={{ 
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    zIndex: 2,
                    textAlign: 'center'
                  }}
                >
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Updating data...
                  </Typography>
                </Box>
              </Box>
            )}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>
                      Status
                      <span title="Partially Occupied: Some guests have checked in, others are still booked." style={{ cursor: 'help', marginLeft: 4 }}>🛈</span>
                    </TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>
                      Room Open State
                      <span title="Shows if the room is open to more guests (all assigned guests have keepOpen true) or closed (at least one assigned guest has keepOpen false)." style={{ cursor: 'help', marginLeft: 4 }}>🛈</span>
                    </TableCell>
                    <TableCell>Guest keepOpen (debug)</TableCell>
                    <TableCell>Reservation Start</TableCell>
                    <TableCell>Reservation End</TableCell>
                    <TableCell>Check-in</TableCell>
                    <TableCell>Check-out</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGuests.map((guest: any) => (
                    <TableRow
                      key={guest._id}
                      hover
                      selected={selectedGuestId === guest._id}
                      onClick={() => setSelectedGuestId(guest._id)}
                      sx={{ 
                        cursor: 'pointer', 
                        backgroundColor: selectedGuestId === guest._id ? 'rgba(25, 118, 210, 0.08)' : undefined,
                        opacity: isFetching ? 0.6 : 1 // Show visual feedback during data updates
                      }}
                    >
                      <TableCell>{guest.name}</TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>{guest.phone}</TableCell>
                      <TableCell>{guest.status}</TableCell>
                      <TableCell>{rooms.find((room: Room) => room._id === guest.roomId)?.number}</TableCell>
                      <TableCell>{guest.keepOpen ? 'Open to more guests' : 'Closed room'}</TableCell>
                      <TableCell>{guest.keepOpen ? 'true' : 'false'}</TableCell>
                      <TableCell>{renderDateField(guest.reservationStart)}</TableCell>
                      <TableCell>{renderDateField(guest.reservationEnd)}</TableCell>
                      <TableCell>{renderDateField(guest.checkIn)}</TableCell>
                      <TableCell>{renderDateField(guest.checkOut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
      {/* Guest Details Modal */}
      <Dialog open={!!viewGuest} onClose={() => setViewGuest(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Guest Details</DialogTitle>
        <DialogContent>
          {viewGuest && (
            <Box>
              <Typography><b>Name:</b> {viewGuest.name}</Typography>
              <Typography><b>Email:</b> {viewGuest.email}</Typography>
              <Typography><b>Phone:</b> {viewGuest.phone}</Typography>
              <Typography><b>Status:</b> {viewGuest.status}</Typography>
              <Typography><b>Room:</b> {availableRooms.find((room: Room) => room._id === viewGuest.roomId)?.number}</Typography>
              <Typography><b>Check-in:</b> {viewGuest.checkIn}</Typography>
              <Typography><b>Check-out:</b> {viewGuest.checkOut}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewGuest(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Guest Modal */}
      <Dialog open={!!editGuest} onClose={() => setEditGuest(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Guest</DialogTitle>
        <DialogContent>
          {editGuest && (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Name"
                value={editGuest.name}
                onChange={e => setEditGuest({ ...editGuest, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Email"
                value={editGuest.email}
                onChange={e => setEditGuest({ ...editGuest, email: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={editGuest.phone}
                onChange={e => setEditGuest({ ...editGuest, phone: e.target.value })}
                fullWidth
              />
              <TextField
                label="Reservation Start"
                type="datetime-local"
                value={editGuest.reservationStart}
                onChange={e => setEditGuest({ ...editGuest, reservationStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label="Reservation End (optional)"
                type="datetime-local"
                value={editGuest.reservationEnd}
                onChange={e => setEditGuest({ ...editGuest, reservationEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={editGuest.status}
                onChange={e => setEditGuest({ ...editGuest, status: e.target.value })}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="booked">Booked</option>
                <option value="checked-in">Checked-in</option>
                <option value="checked-out">Checked-out</option>
              </TextField>
              <TextField
                select
                label="Room"
                value={editGuest.roomId}
                onChange={e => setEditGuest({ ...editGuest, roomId: e.target.value })}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="">-- Select Room --</option>
                {availableRooms.map((room: any) => (
                  <option key={room._id} value={room._id}>
                    {room.number}
                  </option>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editGuest.keepOpen}
                    onChange={e => setEditGuest({ ...editGuest, keepOpen: e.target.checked })}
                  />
                }
                label="Keep Room Open to add more guests"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGuest(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Guest Confirmation */}
      <Dialog open={!!deleteGuest} onClose={() => setDeleteGuest(null)} maxWidth="xs">
        <DialogTitle>Delete Guest</DialogTitle>
        <DialogContent>
          {deleteGuest && (
            <Typography>Are you sure you want to delete <b>{deleteGuest.name}</b>?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGuest(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Add Guest Modal */}
      <Dialog open={addGuestOpen} onClose={() => setAddGuestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Guest</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              value={newGuest.name}
              onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={newGuest.email}
              onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={newGuest.phone}
              onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Reservation Start"
              type="datetime-local"
              value={newGuest.reservationStart}
              onChange={e => setNewGuest({ ...newGuest, reservationStart: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Reservation End (optional)"
              type="datetime-local"
              value={newGuest.reservationEnd}
              onChange={e => setNewGuest({ ...newGuest, reservationEnd: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={newGuest.status}
              onChange={e => setNewGuest({ ...newGuest, status: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="booked">Booked</option>
              <option value="checked-in">Checked-in</option>
              <option value="checked-out">Checked-out</option>
            </TextField>
            <TextField
              select
              label="Room"
              value={newGuest.roomId}
              onChange={e => setNewGuest({ ...newGuest, roomId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">-- Select Room --</option>
              {availableRooms.map((room: any) => (
                <option key={room._id} value={room._id}>
                  {room.number}
                </option>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newGuest.keepOpen}
                  onChange={e => setNewGuest({ ...newGuest, keepOpen: e.target.checked })}
                />
              }
              label="Keep Room Open to add more guests"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGuestOpen(false)}>Cancel</Button>
          <Button onClick={handleAddGuest} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestManagement; 