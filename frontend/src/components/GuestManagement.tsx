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
import { HotelConfigContext } from './Layout/Layout';
import { api } from '../services/api';
import { useRooms } from '../services/roomService';

const fetchGuests = async () => {
  const res = await fetch('/api/guests');
  if (!res.ok) throw new Error('Failed to fetch guests');
  return res.json();
};

const GuestManagement: React.FC = () => {
  const { selectedConfigId, currentConfig } = useContext(HotelConfigContext);
  const { data: guests, isLoading, error, refetch } = useQuery({
    queryKey: ['guests', currentConfig?.id],
    queryFn: fetchGuests,
    enabled: !!currentConfig,
  });

  const queryClient = useQueryClient();

  // Modal state for viewing guest details
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  // Modal state for editing guest
  const [editGuest, setEditGuest] = useState<any | null>(null);
  // State for delete confirmation
  const [deleteGuest, setDeleteGuest] = useState<any | null>(null);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '', status: 'booked', roomId: '', reservationStart: '', reservationEnd: '', keepOpen: false });
  const [search, setSearch] = useState('');

  // Fetch available rooms for assignment
  const { data: rooms = [] } = useRooms({ hotelConfigId: currentConfig?.id });
  // Only rooms that are available or partially-reserved (not occupied/maintenance/cleaning/reserved/checked-in)
  const availableRooms = rooms.filter((room: any) => (room.status === 'available' || room.status === 'partially-reserved') && !guests?.some((g: any) => g.roomId === room.id && g.status === 'checked-in'));

  // Filter guests by search
  const filteredGuests = Array.isArray(guests)
    ? guests.filter((g: any) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.phone.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Handler for edit (now actually saves to backend)
  const handleEditSave = async () => {
    if (!editGuest) return;
    try {
      await api.patch(`/api/guests/${editGuest.id}`, editGuest);
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
      await api.delete(`/api/guests/${deleteGuest.id}`);
      setDeleteGuest(null);
      refetch();
    } catch (err) {
      alert('Failed to delete guest');
    }
  };

  // Handler for Add Guest (POST to API)
  const handleAddGuest = async () => {
    try {
      await api.post('/api/guests', {
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
      await api.patch(`/api/guests/${guest.id}`, { status: 'checked-in', checkIn: new Date().toISOString() });
      refetch();
    } catch (err) {
      alert('Failed to check in guest');
    }
  };

  // Handler for check-out action
  const handleCheckout = async (guest: any) => {
    try {
      await api.patch(`/api/guests/${guest.id}`, { status: 'checked-out', checkOut: new Date().toISOString() });
      refetch();
    } catch (err) {
      alert('Failed to check out guest');
    }
  };

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {currentConfig ? (
            <>Welcome to <b>{currentConfig.name}</b> Guest Management</>
          ) : (
            'Guest Management'
          )}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentConfig
            ? <>View and manage all guests for <b>{currentConfig.name}</b>. All changes apply only to this hotel configuration.</>
            : 'View and manage all guests for the current hotel configuration.'}
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests.map((guest: any) => {
                  const room = rooms.find((r: any) => r.id === guest.roomId);
                  let openState = '—';
                  if (room) {
                    console.log('DEBUG Room for guest', guest.name, room);
                    openState = room.keepOpen ? 'Open to more guests' : 'Closed room';
                  }
                  return (
                    <TableRow key={guest.id}>
                      <TableCell>{guest.name}</TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>{guest.phone}</TableCell>
                      <TableCell>{guest.status}</TableCell>
                      <TableCell>{guest.roomId}</TableCell>
                      <TableCell>{openState}</TableCell>
                      <TableCell>{guest.keepOpen ? 'true' : 'false'}</TableCell>
                      <TableCell>{guest.reservationStart ? new Date(guest.reservationStart).toLocaleString() : ''}</TableCell>
                      <TableCell>{guest.reservationEnd ? new Date(guest.reservationEnd).toLocaleString() : ''}</TableCell>
                      <TableCell>{guest.checkIn ? new Date(guest.checkIn).toLocaleString() : ''}</TableCell>
                      <TableCell>{guest.checkOut ? new Date(guest.checkOut).toLocaleString() : ''}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => setSelectedGuest(guest)} size="small" title="View Details">
                          <VisibilityIcon />
                        </IconButton>
                        {guest.status === 'checked-in' && (
                          <IconButton onClick={() => handleCheckout(guest)} size="small" title="Check-out">
                            <LogoutIcon sx={{ color: 'warning.main' }} />
                          </IconButton>
                        )}
                        {guest.status === 'booked' && (
                          <IconButton onClick={() => handleCheckIn(guest)} size="small" title="Check-in">
                            <LoginIcon sx={{ color: 'success.main' }} />
                          </IconButton>
                        )}
                        <IconButton onClick={() => setEditGuest(guest)} size="small" title="Edit">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => setDeleteGuest(guest)} size="small" title="Delete">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {/* Guest Details Modal */}
      <Dialog open={!!selectedGuest} onClose={() => setSelectedGuest(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Guest Details</DialogTitle>
        <DialogContent>
          {selectedGuest && (
            <Box>
              <Typography><b>Name:</b> {selectedGuest.name}</Typography>
              <Typography><b>Email:</b> {selectedGuest.email}</Typography>
              <Typography><b>Phone:</b> {selectedGuest.phone}</Typography>
              <Typography><b>Status:</b> {selectedGuest.status}</Typography>
              <Typography><b>Room:</b> {selectedGuest.roomId}</Typography>
              <Typography><b>Check-in:</b> {selectedGuest.checkIn}</Typography>
              <Typography><b>Check-out:</b> {selectedGuest.checkOut}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGuest(null)}>Close</Button>
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