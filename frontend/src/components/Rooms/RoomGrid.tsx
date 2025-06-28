import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CleaningServices as CleaningIcon,
  Build as MaintenanceIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { Room } from '../../types/room';
import type { RoomType, Floor, HotelFeature } from '../../types/hotel';
import { useCreateRoomAction } from '../../services/hooks/useRooms';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BuildIcon from '@mui/icons-material/Build';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface RoomGridProps {
  rooms: Room[];
  roomTypes: RoomType[];
  floors: Floor[];
  features: HotelFeature[];
  mapView?: boolean;
  selectedRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, roomTypes, floors, features, mapView = false, selectedRoomId, onSelectRoom }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const createRoomAction = useCreateRoomAction();

  //  Memoize a map of floorId to floor for fast and always up-to-date lookup
  const floorMap = React.useMemo(() => {
    const map: Record<string, Floor> = {};
    for (const f of floors) map[f.id] = f;
    return map;
  }, [floors]);

  // Memoize a map of featureId to feature name
  const featureMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of features) map[f.id] = f.name;
    return map;
  }, [features]);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRoom(null);
  };

  const handleAction = (type: 'cleaning' | 'maintenance' | 'check-in' | 'check-out') => {
    if (!selectedRoom) return;

    createRoomAction.mutate({
      roomId: selectedRoom.id,
      type,
      requestedBy: 'staff',
      notes: `Requested by staff for room ${selectedRoom.number}`,
    });

    handleMenuClose();
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'success.main';
      case 'occupied':
        return 'error.main';
      case 'maintenance':
        return '#FFD600';
      case 'cleaning':
        return 'info.main';
      case 'reserved':
        return '#616161';
      case 'partially-occupied':
        return 'orange';
      case 'partially-reserved':
        return '#BDBDBD';
      default:
        return 'grey.400';
    }
  };

  const getStatusInitials = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'A';
      case 'occupied':
        return 'O';
      case 'maintenance':
        return 'M';
      case 'cleaning':
        return 'C';
      case 'reserved':
        return 'R';
      case 'partially-occupied':
        return 'PO';
      case 'partially-reserved':
        return 'PR';
      default:
        return '?';
    }
  };

  const StatusBadge: React.FC<{ status: Room['status'] }> = ({ status }) => {
    const initials = getStatusInitials(status);
    const color = getStatusColor(status);
    const statusName = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    
    return (
      <Tooltip title={statusName} arrow>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            textShadow: '0 1px 1px rgba(0,0,0,0.5)',
            flexShrink: 0,
          }}
        >
          {initials}
        </Box>
      </Tooltip>
    );
  };

  const handleSetMaintenance = async (room: Room) => {
    await fetch(`/api/rooms/${room.id}/maintenance`, { method: 'PATCH' });
    window.location.reload();
  };

  const handleTerminateReservation = async (room: Room) => {
    await fetch(`/api/rooms/${room.id}/terminate`, { method: 'POST' });
    window.location.reload();
  };

  if (mapView) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <React.Fragment>
          {rooms.map((room) => {
            const roomType = roomTypes.find(rt => rt.id === room.typeId);
            const floor = floorMap[room.floorId];
            const isSelected = selectedRoomId === room.id;
            return (
              <Card
                key={room.id}
                onClick={() => onSelectRoom && onSelectRoom(room.id)}
                sx={{
                  width: 220,
                  minWidth: 220,
                  margin: '0 auto',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6, borderColor: 'primary.main' },
                  border: isSelected ? '2px solid #1976d2' : undefined,
                  borderColor: 'grey.200',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined,
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Room {room.number}
                      </Typography>
                      <Tooltip title={roomType ? roomType.name : room.typeId} arrow>
                        <Typography variant="body2" color="textSecondary">
                          {roomType ? roomType.name : room.typeId}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Box>
                      <Tooltip title="View Details" arrow>
                        <IconButton size="small" onClick={() => console.log('View room:', room.number)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Set to Maintenance" arrow>
                        <IconButton size="small" onClick={() => handleSetMaintenance(room)}>
                          <BuildIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Terminate Reservation" arrow>
                        <IconButton size="small" onClick={() => handleTerminateReservation(room)}>
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box mt={2} display="flex" alignItems="center" gap={1}>
                    <StatusBadge status={room.status} />
                    <Chip
                      label={floor ? `Floor ${floor.number} - ${floor.name}` : `Floor ${room.floorId}`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box mt={2}>
                    <Typography variant="body2">
                      Capacity: {room.capacity} persons
                    </Typography>
                    <Typography variant="body2">
                      Rate: ${room.rate}/night
                    </Typography>
                  </Box>
                  {room.notes && (
                    <Box mt={2}>
                      <Tooltip title={room.notes} arrow>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          Notes: {room.notes}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                  <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
                    {room.features.map((featureId) => (
                      <Chip
                        key={featureId}
                        label={featureMap[featureId] || featureId}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleAction('cleaning')}>
              <ListItemIcon>
                <CleaningIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Request Cleaning</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('maintenance')}>
              <ListItemIcon>
                <MaintenanceIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Request Maintenance</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('check-in')}>
              <ListItemIcon>
                <CheckInIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Check In</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('check-out')}>
              <ListItemIcon>
                <CheckOutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Check Out</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>
          </Menu>
        </React.Fragment>
        
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {rooms.map((room) => {
        const isSelected = selectedRoomId === room.id;
        const roomType = roomTypes.find(rt => rt.id === room.typeId);
        const floor = floors.find(f => f.id === room.floorId);
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
            <Card
              onClick={() => onSelectRoom && onSelectRoom(room.id)}
              sx={{
                border: isSelected ? '2px solid #1976d2' : undefined,
                boxShadow: isSelected ? 6 : undefined,
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined,
                transition: 'box-shadow 0.2s, border 0.2s',
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Room {room.number}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {roomType ? roomType.name : room.typeId}
                    </Typography>
                  </Box>
                </Box>
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <StatusBadge status={room.status} />
                  <Chip
                    label={floor ? `Floor ${floor.number} - ${floor.name}` : `Floor ${room.floorId}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="body2">
                    Capacity: {room.capacity} persons
                  </Typography>
                  <Typography variant="body2">
                    Rate: ${room.rate}/night
                  </Typography>
                </Box>
                {room.notes && (
                  <Box mt={2}>
                    <Tooltip title={room.notes} arrow>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        Notes: {room.notes}
                      </Typography>
                    </Tooltip>
                  </Box>
                )}
                <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
                  {room.features.map((featureId) => (
                    <Chip
                      key={featureId}
                      label={featureMap[featureId] || featureId}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default RoomGrid; 