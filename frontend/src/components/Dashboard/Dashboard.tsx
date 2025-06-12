import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
import { HotelConfigContext } from '../Layout/Layout';

const Dashboard: React.FC = () => {
  const { currentConfig } = React.useContext(HotelConfigContext);
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', currentConfig?.id],
    queryFn: () => hotelConfigService.getDashboardStats(),
    enabled: !!currentConfig,
  });

  if (isLoadingStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }
  console.log(stats);
  if (!currentConfig) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please select a hotel configuration from the dropdown in the header to get started.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Welcome to <b>{currentConfig.name}</b> Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Overview and quick actions for <b>{currentConfig.name}</b>. All changes apply only to this hotel configuration.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.totalRooms || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Available Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.availableRooms || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Occupied Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.occupiedRooms || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Occupancy Rate
            </Typography>
            <Typography variant="h4">
              {stats?.occupancyRate ? `${Math.round(stats.occupancyRate * 100)}%` : '0%'}
            </Typography>
            <LinearProgress variant="determinate" value={Math.round((stats?.occupancyRate || 0) * 100)} sx={{ mt: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rooms by Status
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary={`Available: ${stats?.availableRooms || 0}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Occupied: ${stats?.occupiedRooms || 0}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Maintenance: ${stats?.maintenanceRooms || 0}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Cleaning: ${stats?.cleaningRooms || 0}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Reserved: ${stats?.reservedRooms || 0}`} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rooms by Type
            </Typography>
            <List>
              {stats?.byType && Object.entries(stats.byType).map(([typeId, count]) => {
                const type = currentConfig.roomTypes.find(rt => rt.id === typeId);
                return (
                  <ListItem key={typeId}>
                    <ListItemText primary={`${type ? type.name : typeId}: ${count}`} />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 