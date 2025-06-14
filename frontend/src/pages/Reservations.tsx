import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Reservations: React.FC = () => (
  <Box p={3}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reservations
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Reservation creation and management coming soon!
      </Typography>
    </Paper>
  </Box>
);

export default Reservations; 