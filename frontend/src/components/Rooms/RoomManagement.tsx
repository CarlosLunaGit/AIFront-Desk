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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
import type { RoomTemplate, RoomType, Floor, HotelFeature } from '../../types/hotel';
import { RoomStatus, RoomFilter } from '../../types/room';
import RoomFilters from './RoomFilters';
import RoomGrid from './RoomGrid';
import { useRooms } from '../../services/roomService';
import type { Room } from '../../types/room';
import { HotelConfigContext } from '../Layout/Layout';
import { Circle as CircleIcon } from '@mui/icons-material';

const RoomManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
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
              <Box display="flex" gap={2} alignItems="center">
                {[
                  { label: 'Available', color: 'success.main' },
                  { label: 'Occupied', color: 'error.main' },
                  { label: 'Maintenance', color: 'warning.main' },
                  { label: 'Cleaning', color: 'info.main' },
                  { label: 'Reserved', color: 'secondary.main' },
                ].map(({ label, color }) => (
                  <Box key={label} display="flex" alignItems="center" gap={0.5}>
                    <CircleIcon sx={{ color, fontSize: 18 }} />
                    <Typography variant="body2">{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
              <CircularProgress />
            </Box>
          ) : view === 'grid' ? (
            <RoomGrid rooms={filteredRooms} roomTypes={currentConfig.roomTypes} floors={currentConfig.floors} features={currentConfig.features} />
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
    </Box>
  );
};

export default RoomManagement; 