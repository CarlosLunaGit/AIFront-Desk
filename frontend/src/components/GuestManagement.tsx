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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import { HotelConfigContext } from './Layout/Layout';
import { useGuests } from '../services/hooks/useGuests';
import { useRooms } from '../services/hooks/useRooms';
import { createGuest, updateGuest, deleteGuest, checkInGuest, checkOutGuest, toggleKeepOpen } from '../services/api/guest';

const GuestManagement: React.FC = () => {
  const { selectedConfigId, currentConfig } = useContext(HotelConfigContext);
  const { data: guests, isLoading, error, refetch } = useQuery({
    queryKey: ['guests', currentConfig?.id],
    queryFn: useGuests,
    enabled: !!currentConfig,
  });

  const queryClient = useQueryClient();

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

  // Fetch available rooms for assignment
  const { data: rooms = [] } = useRooms({ hotelConfigId: currentConfig?.id });
  // Only rooms that are available or partially-reserved (not occupied/maintenance/cleaning/reserved/checked-in)
  const availableRooms = rooms.filter(
    (room: any) =>
      (room.status === 'available' || room.status === 'partially-reserved') &&
      (Array.isArray(guests) ? !guests.some((g: any) => g.roomId === room.id && g.status === 'checked-in') : true)
  );

  // Filter guests by search
  const filteredGuests = Array.isArray(guests)
    ? guests.filter((g: any) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedGuest = filteredGuests.find((g: any) => g.id === selectedGuestId) || null;

  // Handler for edit (now actually saves to backend)
  const handleEditSave = async () => {
    if (!editGuest) return;
    try {
      await updateGuest(editGuest.id, editGuest);
      setEditGuest(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (err) {
      alert('Failed to save guest');
    }
  };

  // Handler for delete
  const handleDelete = async () => {
    if (!deleteGuest) return;
    try {
      await deleteGuest(deleteGuest.id);
      setDeleteGuest(null);
      refetch();
    } catch (err) {
      alert('Failed to delete guest');
    }
  };

  // Handler for Add Guest (POST to API)
  const handleAddGuest = async () => {
    try {
      await createGuest({
        ...newGuest,
        status: newGuest.status,
        roomId: newGuest.roomId,
        reservationStart: newGuest.reservationStart,
        reservationEnd: newGuest.reservationEnd,
        checkIn: '',
        checkOut: '',
        keepOpen: newGuest.keepOpen,
      });
      setAddGuestOpen(false);
      setNewGuest({ name: '', email: '', phone: '', status: 'booked', roomId: '', reservationStart: '', reservationEnd: '', keepOpen: false });
      refetch();
    } catch (err) {
      alert('Failed to add guest');
    }
  };

  // Handler for check-in action
  const handleCheckIn = async (guest: any) => {
    try {
      await checkInGuest(guest.id);
      refetch();
    } catch (err) {
      alert('Failed to check in guest');
    }
  };

  // Handler for check-out action
  const handleCheckout = async (guest: any) => {
    try {
      await checkOutGuest(guest.id);
      refetch();
    } catch (err) {
      alert('Failed to check out guest');
    }
  };

  // Handler for toggle keepOpen
  const handleToggleKeepOpen = async (guest: any) => {
    try {
      await toggleKeepOpen(guest.id, !guest.keepOpen);
      refetch();
    } catch (err) {
      alert('Failed to update keepOpen');
    }
  };

  function renderDateField(val: string) {
    if (!val || val === '—') return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
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
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddGuestOpen(true)}
            sx={{ ml: 2 }}
          >
            Add Guest
          </Button>
        </Box>
      </Paper>
      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          color="error"
          disabled={!selectedGuest}
          onClick={() => selectedGuest && setDeleteGuest(selectedGuest)}
        >
          Delete
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest}
          onClick={() => selectedGuest && setEditGuest(selectedGuest)}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status === 'checked-in'}
          onClick={() => selectedGuest && handleCheckIn(selectedGuest)}
        >
          Check In
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status !== 'checked-in'}
          onClick={() => selectedGuest && handleCheckout(selectedGuest)}
        >
          Check Out
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest}
          onClick={() => selectedGuest && handleToggleKeepOpen(selectedGuest)}
        >
          {selectedGuest?.keepOpen ? 'Close' : 'Keep Open'}
        </Button>
      </Box>
      <Paper>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{(error as Error).message}</Alert>
        ) : (
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
                    key={guest.id}
                    hover
                    selected={selectedGuestId === guest.id}
                    onClick={() => setSelectedGuestId(guest.id)}
                    sx={{ cursor: 'pointer', backgroundColor: selectedGuestId === guest.id ? 'rgba(25, 118, 210, 0.08)' : undefined }}
                  >
                    <TableCell>{guest.name}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>{guest.status}</TableCell>
                    <TableCell>{guest.roomId}</TableCell>
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
              <Typography><b>Room:</b> {viewGuest.roomId}</Typography>
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
                  <option key={room.id} value={room.id}>
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
                <option key={room.id} value={room.id}>
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