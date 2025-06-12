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
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { HotelConfigContext } from './Layout/Layout';

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

  // Modal state for viewing guest details
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  // Modal state for editing guest
  const [editGuest, setEditGuest] = useState<any | null>(null);
  // State for delete confirmation
  const [deleteGuest, setDeleteGuest] = useState<any | null>(null);

  // Handler for check-out (mock only)
  const handleCheckout = (guest: any) => {
    alert(`Checked out ${guest.name}`);
    refetch();
  };

  // Handler for edit (mock only)
  const handleEditSave = () => {
    // In a real app, call a mutation here
    alert(`Saved changes for ${editGuest.name}`);
    setEditGuest(null);
    refetch();
  };

  // Handler for delete (mock only)
  const handleDelete = () => {
    // In a real app, call a mutation here
    alert(`Deleted guest ${deleteGuest.name}`);
    setDeleteGuest(null);
    refetch();
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
                  <TableCell>Status</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(guests) && guests.map((guest: any) => (
                  <TableRow key={guest.id}>
                    <TableCell>{guest.name}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>{guest.status}</TableCell>
                    <TableCell>{guest.roomId}</TableCell>
                    <TableCell>{guest.checkIn}</TableCell>
                    <TableCell>{guest.checkOut}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => setSelectedGuest(guest)} size="small" title="View Details">
                        <VisibilityIcon />
                      </IconButton>
                      {guest.status === 'checked-in' && (
                        <IconButton onClick={() => handleCheckout(guest)} size="small" title="Check-out">
                          <LogoutIcon />
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
                ))}
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
              {/* Add more fields as needed */}
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
    </Box>
  );
};

export default GuestManagement; 