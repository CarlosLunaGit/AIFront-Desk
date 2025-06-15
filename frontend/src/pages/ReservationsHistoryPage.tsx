import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

const mockHistory = [
  { id: 'R-001', guests: 'John Doe', rooms: '101', created: '2024-05-20', status: 'Confirmed', notes: 'VIP guest', price: 500 },
  { id: 'R-002', guests: 'Jane Smith', rooms: '102, 103', created: '2024-05-25', status: 'Cancelled', notes: '', price: 300 },
];

const ReservationsHistoryPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const filtered = mockHistory.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.guests.toLowerCase().includes(search.toLowerCase()) ||
    r.rooms.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );
  const selected = filtered.find(r => r.id === selectedId) || null;

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Reservations History
          <Tooltip title="View and filter the complete history of reservations.">
            <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
          </Tooltip>
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search history..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
            sx={{ width: 300, mr: 'auto' }}
          />
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={!selectedId}
            onClick={() => setShowDialog(true)}
            sx={{ ml: 'auto' }}
          >
            View
          </Button>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reservation ID</TableCell>
              <TableCell>Guest(s)</TableCell>
              <TableCell>Room(s)</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((res) => (
              <TableRow
                key={res.id}
                hover
                selected={selectedId === res.id}
                onClick={() => setSelectedId(res.id)}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedId(res.id);
                }}
              >
                <TableCell>{res.id}</TableCell>
                <TableCell>{res.guests}</TableCell>
                <TableCell>{res.rooms}</TableCell>
                <TableCell>{res.created}</TableCell>
                <TableCell>{res.status}</TableCell>
                <TableCell>{res.price}</TableCell>
                <TableCell>{res.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Reservation Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography><b>Reservation ID:</b> {selected.id}</Typography>
              <Typography><b>Guest(s):</b> {selected.guests}</Typography>
              <Typography><b>Room(s):</b> {selected.rooms}</Typography>
              <Typography><b>Created Date:</b> {selected.created}</Typography>
              <Typography><b>Status:</b> {selected.status}</Typography>
              <Typography><b>Price:</b> {selected.price}</Typography>
              <Typography><b>Notes:</b> {selected.notes}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationsHistoryPage; 