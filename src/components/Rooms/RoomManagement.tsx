import React, { useState, useEffect } from 'react';
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

interface Room {
  id: string;
  template: RoomTemplate;
  status: RoomStatus;
  currentGuest?: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  notes?: string;
}

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

  // Fetch hotel configuration
  const { data: hotelConfig, isLoading } = useQuery({
    queryKey: ['hotelConfig'],
    queryFn: hotelConfigService.getCurrentConfig,
  });

  // Mock rooms data (this would come from an API in a real application)
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (hotelConfig) {
      // Convert room templates to rooms with mock statuses
      const mockRooms: Room[] = hotelConfig.roomTemplates.map((template) => ({
        id: template.id,
        template,
        status: 'available' as RoomStatus,
        notes: template.notes,
      }));
      setRooms(mockRooms);
    }
  }, [hotelConfig]);

  const handleFilterChange = (newFilter: Partial<RoomFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setDialogMode('view');
    setShowRoomDialog(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setDialogMode('edit');
    setShowRoomDialog(true);
  };

  const handleCloseDialog = () => {
    setShowRoomDialog(false);
    setSelectedRoom(null);
  };

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, status: newStatus } : room
      )
    );
  };

  const getRoomTypeInfo = (typeId: string) => {
    return hotelConfig?.roomTypes.find((rt) => rt.id === typeId);
  };

  const getFloorInfo = (floorId: string) => {
    return hotelConfig?.floors.find((f) => f.id === floorId);
  };

  const getFeatureInfo = (featureId: string) => {
    return hotelConfig?.features.find((f) => f.id === featureId);
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'maintenance':
        return 'warning';
      case 'cleaning':
        return 'info';
      case 'reserved':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const template = room.template;
    const roomType = getRoomTypeInfo(template.typeId);
    const floor = getFloorInfo(template.floorId);

    return (
      (!filter.status?.length || filter.status.includes(room.status)) &&
      (!filter.type?.length || (roomType && filter.type.includes(roomType.name as any))) &&
      (!filter.floor?.length || (floor && filter.floor.includes(floor.number))) &&
      (!filter.minCapacity || template.capacity >= filter.minCapacity) &&
      (!filter.maxRate || template.rate <= filter.maxRate) &&
      (!filter.features?.length ||
        filter.features.every((f) => template.features.includes(f)))
    );
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!hotelConfig) {
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
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Room Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                // TODO: Implement add room functionality
              }}
            >
              Add Room
            </Button>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <RoomFilters filter={filter} onFilterChange={handleFilterChange} />
          </Paper>
        </Grid>

        {/* Room Grid */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {filteredRooms.map((room) => {
              const roomType = getRoomTypeInfo(room.template.typeId);
              const floor = getFloorInfo(room.template.floorId);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6,
                      },
                    }}
                    onClick={() => handleRoomClick(room)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6" component="div">
                          {room.template.name}
                        </Typography>
                        <Chip
                          label={room.status}
                          color={getStatusColor(room.status)}
                          size="small"
                        />
                      </Box>

                      <Typography color="text.secondary" gutterBottom>
                        {roomType?.name} • Floor {floor?.number}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Capacity: {room.template.capacity} • Rate: ${room.template.rate}/night
                      </Typography>

                      <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                        {room.template.features.map((featureId) => {
                          const feature = getFeatureInfo(featureId);
                          if (!feature) return null;

                          let icon = <HotelIcon />;
                          switch (feature.icon) {
                            case 'wifi':
                              icon = <WifiIcon />;
                              break;
                            case 'local_bar':
                              icon = <MinibarIcon />;
                              break;
                            case 'balcony':
                              icon = <BalconyIcon />;
                              break;
                            case 'visibility':
                              icon = <ViewIcon />;
                              break;
                          }

                          return (
                            <Chip
                              key={featureId}
                              icon={icon}
                              label={feature.name}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    </CardContent>

                    <CardActions>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoom(room);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>

      {/* Room Dialog */}
      <Dialog
        open={showRoomDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedRoom && (
          <>
            <DialogTitle>
              {dialogMode === 'edit' ? 'Edit Room' : 'Room Details'}
            </DialogTitle>
            <DialogContent>
              {dialogMode === 'edit' ? (
                <Box sx={{ pt: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedRoom.status}
                      onChange={(e) =>
                        handleStatusChange(selectedRoom.id, e.target.value as RoomStatus)
                      }
                      label="Status"
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="occupied">Occupied</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="cleaning">Cleaning</MenuItem>
                      <MenuItem value="reserved">Reserved</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Notes"
                    value={selectedRoom.notes || ''}
                    onChange={(e) =>
                      setSelectedRoom((prev) =>
                        prev ? { ...prev, notes: e.target.value } : null
                      )
                    }
                  />
                </Box>
              ) : (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedRoom.template.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {getRoomTypeInfo(selectedRoom.template.typeId)?.name} • Floor{' '}
                    {getFloorInfo(selectedRoom.template.floorId)?.number}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Capacity: {selectedRoom.template.capacity} • Rate: $
                    {selectedRoom.template.rate}/night
                  </Typography>
                  {selectedRoom.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Notes: {selectedRoom.notes}
                    </Typography>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {dialogMode === 'edit' ? (
                <>
                  <Button onClick={handleCloseDialog}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // TODO: Implement save functionality
                      handleCloseDialog();
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCloseDialog}>Close</Button>
                  <Button
                    variant="contained"
                    onClick={() => setDialogMode('edit')}
                  >
                    Edit
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RoomManagement; 