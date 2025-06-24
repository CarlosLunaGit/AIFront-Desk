import React, { useState, useContext } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem, CircularProgress, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import Autocomplete from '@mui/material/Autocomplete';
import { HotelConfigContext } from '../components/Layout/Layout';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useReservations, useCreateReservation, useUpdateReservation } from '../services/hooks/useReservations';
import { useGuests } from '../services/hooks/useGuests';
import { useRooms } from '../services/hooks/useRooms';

const ReservationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedConfigId, currentConfig } = useContext(HotelConfigContext);
  const { enqueueSnackbar } = useSnackbar();
  // Fetch reservations
  const { data: reservations = [], isLoading: loadingReservations } = useReservations();
  // Fetch guests
  const { data: guests = [], isLoading: loadingGuests } = useGuests();
  // Fetch rooms
  const { data: rooms = [], isLoading: loadingRooms } = useRooms();

  // Only show reservations for rooms in the current hotel config, using room ID
  const roomIdsForConfig = rooms.filter((r: any) => r.hotelConfigId === selectedConfigId).map((r: any) => r.id);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dates');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});

  const filteredReservations = reservations
    .filter((res: any) => roomIdsForConfig.includes(res.rooms))
    .filter((res: any) => {
      if (!search) return true;
      return (
        res.id.toLowerCase().includes(search.toLowerCase()) ||
        (res.guestIds && res.guestIds.some((gid: string) => {
          const g = guests.find((gg: any) => gg.id === gid);
          return g && g.name.toLowerCase().includes(search.toLowerCase());
        })) ||
        res.rooms.toLowerCase().includes(search.toLowerCase())
      );
    });

  // Only show available rooms for new reservations
  const availableRooms = rooms.filter((r: any) => (r.status === 'available' || r.status === 'partially-reserved') && r.hotelConfigId === selectedConfigId);

  // Mutations
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ guestIds: [] as string[], rooms: '', notes: '', price: '', start: null as Dayjs | null, end: null as Dayjs | null });
  const [error, setError] = useState('');
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  const [newGuests, setNewGuests] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    if (editId) { await updateMutation.mutateAsync({ id: editId, ...payload }); } else { await createMutation.mutateAsync(payload); }
    setOpen(false); setEditId(null); setNewGuests([]);
  };

  const handleEdit = (res: any) => {
    const [start, end] = res.dates.split(' to ').map((d: string) => dayjs(d));
    setForm({ guestIds: res.guestIds, rooms: res.rooms, notes: res.notes || '', price: String(res.price || ''), start, end });
    setEditId(res.id);
    setOpen(true);
  };

  const handleRequestDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      enqueueSnackbar('Reservation deleted and guests released.', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      setSelectedReservationId(null);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'dates') {
      aVal = a.dates?.split(' to ')[0] || '';
      bVal = b.dates?.split(' to ')[0] || '';
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (loadingReservations || loadingGuests || loadingRooms) {
    return <Box display="flex" justifyContent="center" alignItems="center" p={3}><CircularProgress /></Box>;
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {currentConfig ? (
            <>Welcome to <b>{currentConfig.name}</b> Reservations
              <Tooltip title={`View and manage all reservations for ${currentConfig.name}. All changes apply only to this hotel configuration.`}>
                <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
              </Tooltip>
            </>
          ) : (
            'Reservations'
          )}
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search reservations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
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
              const res = filteredReservations.find((r: any) => r.id === selectedReservationId);
              if (res) handleEdit(res);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!selectedReservationId}
            onClick={() => handleRequestDelete(selectedReservationId!)}
          >
            Delete
          </Button>
        </Box>
      </Paper>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedReservations.map((res: any) => {
              const guestNames = res.guestIds && Array.isArray(res.guestIds)
                ? res.guestIds.map((gid: string) => {
                    const g = guests.find((gg: any) => gg.id === gid);
                    return g ? g.name : gid;
                  })
                : [];
              const firstGuest = guestNames[0] || '';
              const moreCount = guestNames.length - 1;
              const expanded = expandedRows[res.id];
              return (
                <React.Fragment key={res.id}>
                  <TableRow
                    hover
                    selected={selectedReservationId === res.id}
                    onClick={() => setSelectedReservationId(res.id)}
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedReservationId(res.id);
                    }}
                  >
                    <TableCell>{res.id}</TableCell>
                    <TableCell>
                      {firstGuest}
                      {moreCount > 0 && (
                        <>
                          {' '}
                          <IconButton size="small" onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res.id]: !expanded })); }}>
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                          <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [res.id]: !expanded })); }}>
                            +{moreCount} more
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{(() => {
                      const room = rooms.find((r: any) => r.id === res.rooms || r.number === res.rooms);
                      return room ? room.number : res.rooms;
                    })()}</TableCell>
                    <TableCell>{res.dates}</TableCell>
                    <TableCell>{res.price}</TableCell>
                    <TableCell>{res.status}</TableCell>
                    <TableCell>{res.notes}</TableCell>
                  </TableRow>
                  {moreCount > 0 && (
                    <TableRow>
                      <TableCell colSpan={7} style={{ padding: 0, background: '#f9f9f9' }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box pl={6} py={1}>
                            {guestNames.slice(1).map((name: string, idx: number) => (
                              <Typography key={idx} variant="body2">{name}</Typography>
                            ))}
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
      <Dialog open={open} onClose={() => { setOpen(false); setEditId(null); }}>
        <DialogTitle>{editId ? 'Edit Reservation' : 'Create Reservation'}</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={guests}
            getOptionLabel={(option: any) => option.name}
            value={guests.filter((g: any) => form.guestIds?.includes(g.id))}
            onChange={(_, value) => setForm(f => ({ ...f, guestIds: value.map((g: any) => g.id) }))}
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
              {newGuests.map((g, i) => <Typography key={i}>{g.name} ({g.email})</Typography>)}
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
            {availableRooms.map((r: any) => <MenuItem key={r.id} value={r.id}>{r.number}</MenuItem>)}
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
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Reservation"
        description="Are you sure you want to delete this reservation? Guests will be released but not deleted. This action cannot be undone."
      />
    </Box>
  );
};

export default ReservationsPage; 