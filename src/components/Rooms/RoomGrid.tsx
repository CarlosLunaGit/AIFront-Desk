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
import { useCreateRoomAction } from '../../services/roomService';

interface RoomGridProps {
  rooms: Room[];
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const createRoomAction = useCreateRoomAction();

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

  return (
    <Grid container spacing={2}>
      {rooms.map((room) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Room {room.number}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, room)}
                >
                  <MoreIcon />
                </IconButton>
              </Box>

              <Box mt={2}>
                <Chip
                  label={room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  color={getStatusColor(room.status)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Floor ${room.floor}`}
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

              {room.currentGuest && (
                <Box mt={2} p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">
                    Current Guest: {room.currentGuest.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Check-out: {new Date(room.currentGuest.checkOut).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              <Box mt={2} display="flex" flexWrap="wrap" gap={0.5}>
                {room.features.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature.replace('-', ' ')}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

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
    </Grid>
  );
};

export default RoomGrid; 