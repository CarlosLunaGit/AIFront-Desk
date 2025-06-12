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
  MoreVert as MoreIcon,
  CleaningServices as CleaningIcon,
  Build as MaintenanceIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { Room } from '../../types/room';
import type { RoomType, Floor, HotelFeature } from '../../types/hotel';
import { useCreateRoomAction } from '../../services/roomService';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CircleIcon from '@mui/icons-material/Circle';

interface RoomGridProps {
  rooms: Room[];
  roomTypes: RoomType[];
  floors: Floor[];
  features: HotelFeature[];
  mapView?: boolean;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, roomTypes, floors, features, mapView = false }) => {
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, room: Room) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoom(room);
  };

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


  if (mapView) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <React.Fragment>
          {rooms.map((room) => {
            const roomType = roomTypes.find(rt => rt.id === room.typeId);
            const floor = floorMap[room.floorId];
            const statusColor = {
              available: 'success.main',
              occupied: 'error.main',
              maintenance: 'warning.main',
              cleaning: 'info.main',
              reserved: 'secondary.main',
            }[room.status] || 'grey.400';
            return (
              <Card key={room.id} sx={{
                width: 220,
                minWidth: 220,
                margin: '0 auto',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 6, borderColor: 'primary.main' },
                border: 1,
                borderColor: 'grey.200',
              }}>
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
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Room" arrow>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box mt={2} display="flex" alignItems="center" gap={1}>
                    <Tooltip title={room.status.charAt(0).toUpperCase() + room.status.slice(1)} arrow>
                      <CircleIcon sx={{ color: statusColor, fontSize: 18 }} />
                    </Tooltip>
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
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 2,
    }}>
      {rooms.map((room) => {
        const roomType = roomTypes.find(rt => rt.id === room.typeId);
        const floor = floorMap[room.floorId];
        const statusColor = {
          available: 'success.main',
          occupied: 'error.main',
          maintenance: 'warning.main',
          cleaning: 'info.main',
          reserved: 'secondary.main',
        }[room.status] || 'grey.400';
        return (
          <Card key={room.id} sx={{
            minWidth: 220,
            maxWidth: 1,
            margin: '0 auto',
            height: '100%',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 6, borderColor: 'primary.main' },
            border: 1,
            borderColor: 'grey.200',
          }}>
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
                    <IconButton size="small">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Room" arrow>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box mt={2} display="flex" alignItems="center" gap={1}>
                <Tooltip title={room.status.charAt(0).toUpperCase() + room.status.slice(1)} arrow>
                  <CircleIcon sx={{ color: statusColor, fontSize: 18 }} />
                </Tooltip>
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
      
    </Box>
  );
};

export default RoomGrid; 