import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';

const ActivityHistory: React.FC = () => (
  <Box p={3}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Activity History
        <Tooltip title="All room, guest, and maintenance actions will be shown here.">
          <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
        </Tooltip>
      </Typography>
    </Paper>
  </Box>
);

export default ActivityHistory; 