import React, { useState } from 'react';
import { TableCell, Box, Button } from '@mui/material';
import { useGuests } from "../../hooks/useGuests";
import { Room } from '../../types/room';
import { useQuery } from '@tanstack/react-query';

const GuestManagement: React.FC = () => {
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const { guests, onDeleteGuest, onCheckIn, onCheckOut, onToggleKeepOpen } = useGuests();
  const selectedGuest = guests.find(g => g._id === selectedGuestId);
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => (await fetch('/api/rooms')).json() });

  return (
    <div>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          disabled={!selectedGuest}
          onClick={() => { if (selectedGuest) { onDeleteGuest(selectedGuest._id); setSelectedGuestId(null); } }}
        >
          Delete
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest}
          onClick={() => { if (selectedGuest) { /* open edit modal (or navigate) */ } }}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status === 'checked-in'}
          onClick={() => { if (selectedGuest) { onCheckIn(selectedGuest._id); } }}
        >
          Check In
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest || selectedGuest.status !== 'checked-in'}
          onClick={() => { if (selectedGuest) { onCheckOut(selectedGuest._id); } }}
        >
          Check Out
        </Button>
        <Button
          variant="outlined"
          disabled={!selectedGuest}
          onClick={() => { if (selectedGuest) { onToggleKeepOpen(selectedGuest._id); } }}
        >
          {selectedGuest?.keepOpen ? "Close" : "Keep Open"}
        </Button>
      </Box>
      <TableCell>{(() => {
        const room = rooms.find((r: Room) => r._id === selectedGuest?.roomId);
        return room ? room.number : selectedGuest?.roomId;
      })()}</TableCell>
    </div>
  );
};

export default GuestManagement; 