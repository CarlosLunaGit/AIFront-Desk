import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const ActivityHistory: React.FC = () => (
  <Box p={3}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Activity History
      </Typography>
      <Typography variant="body1" color="text.secondary">
        All room, guest, and maintenance actions will be shown here.
      </Typography>
    </Paper>
  </Box>
);

export default ActivityHistory; 