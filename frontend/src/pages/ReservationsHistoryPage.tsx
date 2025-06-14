import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const mockHistory = [
  { id: 'R-001', guests: 'John Doe', rooms: '101', created: '2024-05-20', status: 'Confirmed', notes: 'VIP guest', price: 500 },
  { id: 'R-002', guests: 'Jane Smith', rooms: '102, 103', created: '2024-05-25', status: 'Cancelled', notes: '', price: 300 },
];

const ReservationsHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<null | typeof mockHistory[0]>(null);
  const filtered = mockHistory.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.guests.toLowerCase().includes(search.toLowerCase()) ||
    r.rooms.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>Reservations History</Typography>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          margin="normal"
        />
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((res) => (
              <TableRow key={res.id}>
                <TableCell>{res.id}</TableCell>
                <TableCell>{res.guests}</TableCell>
                <TableCell>{res.rooms}</TableCell>
                <TableCell>{res.created}</TableCell>
                <TableCell>{res.status}</TableCell>
                <TableCell>{res.price}</TableCell>
                <TableCell>{res.notes}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setSelected(res)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!selected} onClose={() => setSelected(null)}>
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
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationsHistoryPage; 