import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
import { HotelConfigContext } from '../Layout/Layout';

const Dashboard: React.FC = () => {
  const { currentConfig } = React.useContext(HotelConfigContext);
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => hotelConfigService.getDashboardStats(),
  });

  if (isLoadingStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentConfig) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please select a hotel configuration from the dropdown in the header to get started.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome to {currentConfig.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.totalRooms || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Available Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.availableRooms || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Occupied Rooms
            </Typography>
            <Typography variant="h4">
              {stats?.occupiedRooms || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 