import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Hotel as HotelIcon,
  Wifi as WifiIcon,
  LocalBar as MinibarIcon,
  Balcony as BalconyIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  CleaningServices as CleaningIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
import type { RoomTemplate, RoomType, Floor, HotelFeature } from '../../types/hotel';
import { RoomStatus, RoomFilter } from '../../types/room';
import RoomFilters from './RoomFilters';
import RoomGrid from './RoomGrid';
import { useRooms, useUpdateRoom } from '../../services/roomService';
import type { Room } from '../../types/room';
import { HotelConfigContext } from '../Layout/Layout';
import { Circle as CircleIcon } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const RoomManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoomFilter>({
    status: [],
    type: [],
    floor: [],
    features: [],
  });
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'view'>('view');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterFloor, setFilterFloor] = useState<string>('');
  const [search, setSearch] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFloor, setBulkFloor] = useState('');
  const [bulkType, setBulkType] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkFeatures, setBulkFeatures] = useState<string[]>([]);
  const [bulkCapacity, setBulkCapacity] = useState<number | ''>('');
  const [bulkRate, setBulkRate] = useState<number | ''>('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFloor, setAddFloor] = useState('');
  const [addType, setAddType] = useState('');
  const [addNumber, setAddNumber] = useState('');
  const [addFeatures, setAddFeatures] = useState<string[]>([]);
  const [addCapacity, setAddCapacity] = useState<number | ''>('');
  const [addRate, setAddRate] = useState<number | ''>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const { currentConfig, selectedConfigId } = React.useContext(HotelConfigContext);
  const {
    data: rooms = [],
    isLoading: roomsLoading,
    isFetching: roomsFetching,
    refetch: refetchRooms
  } = useRooms({ hotelConfigId: selectedConfigId });
  const isLoading = !currentConfig || roomsLoading || roomsFetching;
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [editRoomState, setEditRoomState] = useState<Room | null>(null);
  const updateRoom = useUpdateRoom();

  React.useEffect(() => {
    if (selectedConfigId && currentConfig?.id === selectedConfigId) {
      refetchRooms();
    }
  }, [selectedConfigId, currentConfig?.id, refetchRooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room =>
      (!filterStatus || room.status === filterStatus) &&
      (!filterType || room.typeId === filterType) &&
      (!filterFloor || room.floorId === filterFloor) &&
      (!search || room.number.includes(search))
    );
  }, [rooms, filterStatus, filterType, filterFloor, search]);

  const selectedRoom = filteredRooms.find(r => r.id === selectedRoomId) || null;

  const handleBulkCreate = async () => {
    setBulkError(null);
    if (!bulkFloor || !bulkType || !bulkNumbers.trim()) {
      setBulkError('Floor, Room Type, and Room Numbers are required.');
      return;
    }
    // Parse room numbers
    let numbers: string[] = [];
    bulkNumbers.split(',').forEach(part => {
      const trimmed = part.trim();
      if (/^\d+-\d+$/.test(trimmed)) {
        // Range
        const [start, end] = trimmed.split('-').map(Number);
        if (start && end && end >= start) {
          for (let n = start; n <= end; n++) numbers.push(String(n));
        }
      } else if (/^\d+$/.test(trimmed)) {
        numbers.push(trimmed);
      }
    });
    numbers = Array.from(new Set(numbers));
    if (!numbers.length) {
      setBulkError('Please enter valid room numbers or ranges.');
      return;
    }
    setBulkLoading(true);
    try {
      const payload = numbers.map(number => ({
        floorId: bulkFloor,
        typeId: bulkType,
        number,
        features: bulkFeatures,
        capacity: bulkCapacity === '' ? undefined : bulkCapacity,
        rate: bulkRate === '' ? undefined : bulkRate,
        status: 'available',
      }));
      await fetch('/api/rooms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setBulkLoading(false);
      setBulkDialogOpen(false);
      setBulkFloor(''); setBulkType(''); setBulkNumbers(''); setBulkFeatures([]); setBulkCapacity(''); setBulkRate('');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (e) {
      setBulkError('Failed to create rooms.');
      setBulkLoading(false);
    }
  };

  const handleAddRoom = async () => {
    setAddError(null);
    if (!addFloor || !addType || !addNumber.trim()) {
      setAddError('Floor, Room Type, and Room Number are required.');
      return;
    }
    setAddLoading(true);
    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorId: addFloor,
          typeId: addType,
          number: addNumber,
          features: addFeatures,
          capacity: addCapacity === '' ? undefined : addCapacity,
          rate: addRate === '' ? undefined : addRate,
          status: 'available',
        }),
      });
      setAddLoading(false);
      setAddDialogOpen(false);
      setAddFloor(''); setAddType(''); setAddNumber(''); setAddFeatures([]); setAddCapacity(''); setAddRate('');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (e) {
      setAddError('Failed to create room.');
      setAddLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedRoom) return;
    if (selectedRoom.status === 'maintenance') {
      // Unset maintenance
      await fetch(`/api/rooms/${selectedRoom.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' }),
      });
    } else if (['available', 'cleaning'].includes(selectedRoom.status)) {
      // Set to maintenance
      await fetch(`/api/rooms/${selectedRoom.id}/maintenance`, { method: 'PATCH' });
    }
    setSelectedRoomId(null);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const handleToggleCleaning = async () => {
    if (!selectedRoom) return;
    if (selectedRoom.status === 'cleaning') {
      // Unset cleaning
      await fetch(`/api/rooms/${selectedRoom.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' }),
      });
    } else {
      // Request cleaning
      await fetch(`/api/rooms/${selectedRoom.id}/cleaning`, { method: 'PATCH' });
    }
    setSelectedRoomId(null);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const handleCheckInOut = async () => {
    if (!selectedRoom || !selectedRoom.assignedGuests.length) return;
    const now = new Date().toISOString();
    if (["reserved", "partially-reserved", "partially-occupied"].includes(selectedRoom.status)) {
      // Check In: set all assigned guests to checked-in
      await Promise.all(selectedRoom.assignedGuests.map(guestId =>
        fetch(`/api/guests/${guestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkIn: now, status: 'checked-in' }),
        })
      ));
      // Set room to occupied
      await fetch(`/api/rooms/${selectedRoom.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'occupied' }),
      });
    } else if (selectedRoom.status === 'occupied') {
      // Check Out: set all assigned guests to checked-out
      await Promise.all(selectedRoom.assignedGuests.map(guestId =>
        fetch(`/api/guests/${guestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkOut: now, status: 'checked-out' }),
        })
      ));
      // Set room to cleaning
      await fetch(`/api/rooms/${selectedRoom.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cleaning' }),
      });
    }
    setSelectedRoomId(null);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const handleTerminateReservation = async () => {
    if (!selectedRoom || !selectedRoom.assignedGuests.length) return;
    await Promise.all(selectedRoom.assignedGuests.map(guestId =>
      fetch(`/api/guests/${guestId}`, { method: 'DELETE' })
    ));
    setSelectedRoomId(null);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const handleEditRoom = () => {
    if (selectedRoom) {
      setEditRoom(selectedRoom);
      setEditRoomState(selectedRoom);
    }
  };

  const handleViewDetails = () => {
    if (selectedRoom) {
      setViewRoom(selectedRoom);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentConfig) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Hotel configuration not found. Please configure your hotel first.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Welcome to <b>{currentConfig.name}</b> Room Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage rooms, floors, and features for <b>{currentConfig.name}</b>. All changes apply only to this hotel configuration.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
          <Box display="flex" gap={1}>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
              <ToggleButton value="grid">Grid View</ToggleButton>
              <ToggleButton value="map">Map View</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
              Add Room
            </Button>
            <Button variant="contained" onClick={() => setBulkDialogOpen(true)}>
              Bulk Create Rooms
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Filters
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="occupied">Occupied</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="cleaning">Cleaning</MenuItem>
                    <MenuItem value="reserved">Reserved</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select value={filterType} label="Type" onChange={e => setFilterType(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {currentConfig.roomTypes.map(rt => (
                      <MenuItem key={rt.id} value={rt.id}>{rt.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Floor</InputLabel>
                  <Select value={filterFloor} label="Floor" onChange={e => setFilterFloor(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {currentConfig.floors.map(f => (
                      <MenuItem key={f.id} value={f.id}>{f.name} (Floor {f.number})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Search" value={search} onChange={e => setSearch(e.target.value)} />
              </Box>
              {/* Status legend to the right */}
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                {[
                  { label: 'Available', color: 'success.main', description: 'Room is ready for booking' },
                  { label: 'Occupied', color: 'error.main', description: 'Room is fully occupied' },
                  { label: 'Partially Occupied', color: 'warning.dark', description: 'Room has some guests checked in' },
                  { label: 'Partially Reserved', color: '#BDBDBD', description: 'Room has some guests booked' },
                  { label: 'Reserved', color: '#616161', description: 'Room is fully booked' },
                  { label: 'Maintenance', color: '#FFD600', description: 'Room is under maintenance' },
                  { label: 'Cleaning', color: 'info.main', description: 'Room is being cleaned' },
                ].map(({ label, color, description }) => (
                  <Tooltip key={label} title={description} arrow>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CircleIcon sx={{ color, fontSize: 18 }} />
                      <Typography variant="body2">{label}</Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            {/* Maintenance Button */}
            <Tooltip title={selectedRoom ? (selectedRoom.status === 'maintenance' ? 'Unset maintenance (set to available)' : 'Set room to maintenance') : 'Select a room'}>
              <span>
                <Button
                  variant={selectedRoom && selectedRoom.status === 'maintenance' ? 'outlined' : 'contained'}
                  color={selectedRoom && selectedRoom.status === 'maintenance' ? 'success' : 'warning'}
                  startIcon={<BuildIcon />}
                  disabled={!selectedRoom || (!['available', 'cleaning', 'maintenance'].includes(selectedRoom.status))}
                  onClick={handleToggleMaintenance}
                >
                  {selectedRoom && selectedRoom.status === 'maintenance' ? 'Unset Maintenance' : 'Set to Maintenance'}
                </Button>
              </span>
            </Tooltip>
            {/* Cleaning Button */}
            <Tooltip title={selectedRoom ? (selectedRoom.status === 'cleaning' ? 'Unset cleaning (set to available)' : 'Request cleaning for this room') : 'Select a room'}>
              <span>
                <Button
                  variant={selectedRoom && selectedRoom.status === 'cleaning' ? 'outlined' : 'contained'}
                  color={selectedRoom && selectedRoom.status === 'cleaning' ? 'success' : 'info'}
                  startIcon={<CleaningIcon />}
                  disabled={!selectedRoom || (!['available', 'reserved', 'partially-reserved', 'occupied', 'partially-occupied', 'maintenance', 'cleaning'].includes(selectedRoom.status))}
                  onClick={handleToggleCleaning}
                >
                  {selectedRoom && selectedRoom.status === 'cleaning' ? 'Unset Cleaning' : 'Request Cleaning'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                !selectedRoom
                  ? 'Select a room'
                  : !selectedRoom.assignedGuests.length
                    ? 'Room has no assigned guests'
                    : (["reserved", "partially-reserved", "partially-occupied"].includes(selectedRoom.status)
                        ? 'Check in all guests'
                        : (selectedRoom.status === 'occupied' ? 'Check out all guests' : 'Cannot check in/out in this state'))
              }
            >
              <span>
                <Button
                  variant="contained"
                  color={selectedRoom && selectedRoom.status === 'occupied' ? 'error' : 'primary'}
                  startIcon={selectedRoom && selectedRoom.status === 'occupied' ? <CheckOutIcon /> : <CheckInIcon />}
                  disabled={
                    !selectedRoom ||
                    !selectedRoom.assignedGuests.length ||
                    !(["reserved", "partially-reserved", "partially-occupied", "occupied"].includes(selectedRoom.status))
                  }
                  onClick={handleCheckInOut}
                >
                  {selectedRoom && selectedRoom.status === 'occupied' ? 'Check Out' : 'Check In'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                !selectedRoom
                  ? 'Select a room'
                  : !selectedRoom.assignedGuests.length
                    ? 'Room has no assigned guests'
                    : 'Terminate reservation and delete all assigned guests'
              }
            >
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  disabled={!selectedRoom || !selectedRoom.assignedGuests.length}
                  onClick={handleTerminateReservation}
                >
                  Terminate Reservation
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={selectedRoom ? 'Edit this room' : 'Select a room to edit'}>
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  disabled={!selectedRoom}
                  onClick={handleEditRoom}
                >
                  Edit Room
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={selectedRoom ? 'View details for this room' : 'Select a room to view details'}>
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<VisibilityIcon />}
                  disabled={!selectedRoom}
                  onClick={handleViewDetails}
                >
                  View Details
                </Button>
              </span>
            </Tooltip>
          </Box>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
              <CircularProgress />
            </Box>
          ) : view === 'grid' ? (
            <RoomGrid
              rooms={filteredRooms}
              roomTypes={currentConfig.roomTypes}
              floors={currentConfig.floors}
              features={currentConfig.features}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
            />
          ) : (
            <Box>
              {currentConfig.floors.map(floor => (
                <Box key={floor.id} mb={3}>
                  <Typography variant="h6">Floor {floor.number} - {floor.name}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                    {filteredRooms.filter(r => r.floorId === floor.id).map(room => (
                      <Box key={room.id} sx={{ flex: '0 0 220px', width: 220, minWidth: 220 }}>
                        <RoomGrid rooms={[room]} roomTypes={currentConfig.roomTypes} floors={currentConfig.floors} features={currentConfig.features} mapView />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)}>
        <DialogTitle>Bulk Create Rooms</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={350}>
            <FormControl fullWidth required size="small">
              <InputLabel>Floor</InputLabel>
              <Select value={bulkFloor} label="Floor" onChange={e => setBulkFloor(e.target.value)}>
                {currentConfig.floors.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name} (Floor {f.number})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required size="small">
              <InputLabel>Room Type</InputLabel>
              <Select value={bulkType} label="Room Type" onChange={e => setBulkType(e.target.value)}>
                {currentConfig.roomTypes.map(rt => (
                  <MenuItem key={rt.id} value={rt.id}>{rt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Room Numbers (e.g. 101,102,201-210)"
              value={bulkNumbers}
              onChange={e => setBulkNumbers(e.target.value)}
              required
              size="small"
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Features</InputLabel>
              <Select
                multiple
                value={bulkFeatures}
                onChange={e => setBulkFeatures(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                label="Features"
                renderValue={selected => (selected as string[]).map(fid => currentConfig.features.find(f => f.id === fid)?.name).join(', ')}
              >
                {currentConfig.features.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Capacity (optional)"
              type="number"
              value={bulkCapacity}
              onChange={e => setBulkCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Rate (optional)"
              type="number"
              value={bulkRate}
              onChange={e => setBulkRate(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              fullWidth
            />
            {bulkError && <Alert severity="error">{bulkError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)} disabled={bulkLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkCreate} disabled={bulkLoading}>Bulk Create</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Room</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={350}>
            <FormControl fullWidth required size="small">
              <InputLabel>Floor</InputLabel>
              <Select value={addFloor} label="Floor" onChange={e => setAddFloor(e.target.value)}>
                {currentConfig.floors.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name} (Floor {f.number})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required size="small">
              <InputLabel>Room Type</InputLabel>
              <Select value={addType} label="Room Type" onChange={e => setAddType(e.target.value)}>
                {currentConfig.roomTypes.map(rt => (
                  <MenuItem key={rt.id} value={rt.id}>{rt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Room Number"
              value={addNumber}
              onChange={e => setAddNumber(e.target.value)}
              required
              size="small"
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Features</InputLabel>
              <Select
                multiple
                value={addFeatures}
                onChange={e => setAddFeatures(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                label="Features"
                renderValue={selected => (selected as string[]).map(fid => currentConfig.features.find(f => f.id === fid)?.name).join(', ')}
              >
                {currentConfig.features.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Capacity (optional)"
              type="number"
              value={addCapacity}
              onChange={e => setAddCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Rate (optional)"
              type="number"
              value={addRate}
              onChange={e => setAddRate(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              fullWidth
            />
            {addError && <Alert severity="error">{addError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} disabled={addLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleAddRoom} disabled={addLoading}>Add Room</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Room Modal */}
      {editRoom && editRoomState && (
        <Dialog open={!!editRoom} onClose={() => setEditRoom(null)}>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Room Number"
                value={editRoomState.number}
                onChange={e => setEditRoomState({ ...editRoomState, number: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Room Type"
                value={editRoomState.typeId}
                onChange={e => setEditRoomState({ ...editRoomState, typeId: e.target.value })}
                fullWidth
              >
                {currentConfig.roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </TextField>
              <TextField
                select
                label="Floor"
                value={editRoomState.floorId}
                onChange={e => setEditRoomState({ ...editRoomState, floorId: e.target.value })}
                fullWidth
              >
                {currentConfig.floors.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (Floor {f.number})</option>
                ))}
              </TextField>
              <TextField
                label="Capacity"
                type="number"
                value={editRoomState.capacity}
                onChange={e => setEditRoomState({ ...editRoomState, capacity: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Rate"
                type="number"
                value={editRoomState.rate}
                onChange={e => setEditRoomState({ ...editRoomState, rate: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Notes"
                value={editRoomState.notes}
                onChange={e => setEditRoomState({ ...editRoomState, notes: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Features"
                value={editRoomState.features}
                onChange={e => setEditRoomState({ ...editRoomState, features: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                SelectProps={{ multiple: true }}
                fullWidth
              >
                {currentConfig.features.map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditRoom(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (editRoomState) {
                  await updateRoom.mutateAsync(editRoomState);
                  setEditRoom(null);
                }
              }}
            >Save</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* View Room Details Modal */}
      {viewRoom && (
        <Dialog 
          open={!!viewRoom} 
          onClose={() => setViewRoom(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Room Details</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography><b>Room Number:</b> {viewRoom.number}</Typography>
              <Typography><b>Type:</b> {currentConfig.roomTypes.find(rt => rt.id === viewRoom.typeId)?.name || viewRoom.typeId}</Typography>
              <Typography><b>Floor:</b> {currentConfig.floors.find(f => f.id === viewRoom.floorId)?.name || viewRoom.floorId}</Typography>
              <Typography><b>Status:</b> {viewRoom.status}</Typography>
              <Typography><b>Capacity:</b> {viewRoom.capacity}</Typography>
              <Typography><b>Rate:</b> ${viewRoom.rate}/night</Typography>
              <Typography><b>Notes:</b> {viewRoom.notes}</Typography>
              <Typography><b>Features:</b> {viewRoom.features.map(fid => currentConfig.features.find(f => f.id === fid)?.name || fid).join(', ')}</Typography>
              <Typography><b>keepOpen:</b> {viewRoom.keepOpen ? 'true' : 'false'}</Typography>
              <Typography><b>Assigned Guests:</b></Typography>
              <ul>
                {viewRoom.assignedGuests.length === 0 ? <li>None</li> : viewRoom.assignedGuests.map(gid => <li key={gid}>{gid}</li>)}
              </ul>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewRoom(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default RoomManagement; 