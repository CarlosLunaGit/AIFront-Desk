import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import type { RoomStats as RoomStatsType } from '../../types/room';

interface RoomStatsProps {
  stats: RoomStatsType;
}

const RoomStats: React.FC<RoomStatsProps> = ({ stats }) => {
  const occupancyPercentage = Math.round(stats.occupancyRate * 100);

  return (
    <Grid container spacing={2}>
      {/* Overview Cards */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Total Rooms
          </Typography>
          <Typography variant="h4">
            {stats.total}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Available
          </Typography>
          <Typography variant="h4" color="success.main">
            {stats.available}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Occupied
          </Typography>
          <Typography variant="h4" color="error.main">
            {stats.occupied}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Occupancy Rate
          </Typography>
          <Typography variant="h4">
            {occupancyPercentage}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={occupancyPercentage}
            sx={{ mt: 1 }}
          />
        </Paper>
      </Grid>

      {/* Status Distribution */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Room Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Maintenance
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.maintenance}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Cleaning
                </Typography>
                <Typography variant="h6" color="info.main">
                  {stats.cleaning}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Reserved
                </Typography>
                <Typography variant="h6" color="secondary.main">
                  {stats.reserved}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Room Types */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Room Types
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <Grid item xs={6} key={type}>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                  <Typography variant="h6">
                    {count}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Additional Stats */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Additional Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Average Stay Duration
              </Typography>
              <Typography variant="h6">
                {stats.averageStayDuration} days
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Rooms by Floor
              </Typography>
              <Box display="flex" gap={2} mt={1}>
                {Object.entries(stats.byFloor).map(([floor, count]) => (
                  <Box key={floor}>
                    <Typography variant="body2" color="textSecondary">
                      Floor {floor}
                    </Typography>
                    <Typography variant="h6">
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RoomStats; 