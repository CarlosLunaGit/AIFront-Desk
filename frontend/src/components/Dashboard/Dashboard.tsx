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
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
import { HotelConfigContext } from '../Layout/Layout';

// Helper functions for SVG pie chart
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z',
  ].join(' ');
}

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

  // Pie chart for Reserved vs Free vs Occupied
  let roomStatusPieChart: React.ReactNode = null;
  if (stats) {
    const reserved = stats.reservedRooms || 0;
    const free = stats.availableRooms || 0;
    const occupied = stats.occupiedRooms || 0;
    const total = reserved + free + occupied;
    const reservedPct = total ? reserved / total : 0;
    const freePct = total ? free / total : 0;
    const occupiedPct = total ? occupied / total : 0;
    const reservedAngle = reservedPct * 360;
    const freeAngle = freePct * 360;
    const r = 60;
    const cx = 80;
    const cy = 80;
    let start = 0;
    const reservedArc = describeArc(cx, cy, r, start, start + reservedAngle);
    start += reservedAngle;
    const freeArc = describeArc(cx, cy, r, start, start + freeAngle);
    start += freeAngle;
    const occupiedArc = describeArc(cx, cy, r, start, start + occupiedPct * 360);
    roomStatusPieChart = (
      <Box display="flex" alignItems="center" gap={2}>
        <svg width={160} height={160}>
          <path d={reservedArc} fill="#616161" />
          <path d={freeArc} fill="#43a047" />
          <path d={occupiedArc} fill="#d32f2f" />
        </svg>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Box width={16} height={16} borderRadius={8} bgcolor="#616161" />
            <Typography variant="body2">Reserved ({reserved})</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Box width={16} height={16} borderRadius={8} bgcolor="#43a047" />
            <Typography variant="body2">Free ({free})</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box width={16} height={16} borderRadius={8} bgcolor="#d32f2f" />
            <Typography variant="body2">Occupied ({occupied})</Typography>
          </Box>
        </Box>
      </Box>
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
        <Grid item xs={12}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <Paper sx={{ p: 2, flex: 1, minWidth: 180 }}>
              <Typography variant="h6" gutterBottom>Total Rooms</Typography>
              <Typography variant="h4">{stats?.totalRooms || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 180 }}>
              <Typography variant="h6" gutterBottom>Reserved Rooms</Typography>
              <Typography variant="h4">{stats?.reservedRooms || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 180 }}>
              <Typography variant="h6" gutterBottom>Free Rooms</Typography>
              <Typography variant="h4">{stats?.availableRooms || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 180 }}>
              <Typography variant="h6" gutterBottom>Occupied Rooms</Typography>
              <Typography variant="h4">{stats?.occupiedRooms || 0}</Typography>
            </Paper>
          </Box>
        </Grid>
        <Grid item xs={12} style={{ height: 16 }} /> {/* Spacer */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Room Status Distribution
            </Typography>
            {roomStatusPieChart}
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
      </Grid>
    </Box>
  );
};

export default Dashboard; 