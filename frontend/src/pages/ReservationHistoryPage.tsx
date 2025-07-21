import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format } from 'date-fns';
import { useCurrentHotel } from '../services/hooks/useHotel';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ReservationHistoryEntry } from '../mocks/data/reservationHistory';

const fetchAllHistory = async (hotelId?: string) => {
  const url = hotelId ? `/api/reservation-history?hotelId=${hotelId}` : '/api/reservation-history';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reservation history');
  return res.json() as Promise<ReservationHistoryEntry[]>;
};

const getActionColor = (action: ReservationHistoryEntry['action']) => {
  switch (action) {
    case 'status_change':
      return 'primary';
    case 'guest_assigned':
      return 'success';
    case 'guest_removed':
      return 'error';
    case 'guest_status_change':
      return 'warning';
    case 'reservation_created':
      return 'info';
    case 'reservation_edited':
      return 'secondary';
    case 'reservation_deleted':
      return 'error';
    default:
      return 'default';
  }
};

const formatAction = (entry: ReservationHistoryEntry) => {
  switch (entry.action) {
    case 'status_change':
      return `Room status changed from ${entry.previousState.roomStatus} to ${entry.newState.roomStatus}`;
    case 'guest_assigned':
      return `Guest ${entry.newState.guestId} assigned to room`;
    case 'guest_removed':
      return `Guest ${entry.previousState.guestId} removed from room`;
    case 'guest_status_change':
      return `Guest ${entry.newState.guestId} status changed from ${entry.previousState.guestStatus} to ${entry.newState.guestStatus}`;
    case 'reservation_created':
      return `Reservation created for guest(s): ${(entry.newState.guestIds || []).join(', ')}`;
    case 'reservation_edited':
      return `Reservation edited. New guest(s): ${(entry.newState.guestIds || []).join(', ')}`;
    case 'reservation_deleted':
      return `Reservation deleted for guest(s): ${(entry.previousState.guestIds || []).join(', ')}`;
    default:
      return entry.action;
  }
};

const ReservationHistoryPage: React.FC = () => {
  // Use the new hotel entities instead of hotel configuration
  const { data: currentHotel, isLoading: hotelLoading } = useCurrentHotel();
  const hotelId = currentHotel?._id;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: history, isLoading, error } = useQuery<ReservationHistoryEntry[]>({
    queryKey: ['reservationHistory', hotelId],
    queryFn: () => fetchAllHistory(hotelId),
    enabled: !!hotelId,
  });

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => (await fetch('/api/rooms')).json() });

  const filteredHistory = history?.filter(entry => {
    const matchesSearch = 
      entry.roomId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      formatAction(entry).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;

    const entryDate = new Date(entry.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    const matchesDate = entryDate >= startDate && entryDate <= endDate;

    return matchesSearch && matchesAction && matchesDate;
  });

  const filtered = filteredHistory?.filter(r =>
    r.roomId.toLowerCase().includes(search.toLowerCase()) ||
    r.performedBy.toLowerCase().includes(search.toLowerCase()) ||
    (r.notes?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ) || [];

  if (hotelLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{(error as Error).message}</Alert>
      </Box>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Box p={3}>
        <Typography color="textSecondary">No reservation history available.</Typography>
      </Box>
    );
  }

  // Calculate some stats
  const totalEntries = filteredHistory?.length ?? 0;
  const actionCounts = filteredHistory?.reduce((acc, entry) => {
    acc[entry.action] = (acc[entry.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {currentHotel ? (
            <>Reservation History for <b>{currentHotel.name}</b>
              <Tooltip title="View and filter the complete history of room status changes, guest assignments, and check-ins/outs.">
                <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
              </Tooltip>
            </>
          ) : (
            'Reservation History'
          )}
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
            sx={{ width: 300 }}
          />
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={!selectedId}
            onClick={() => setSelectedId(filtered.find(r => r.id === selectedId)?.id || null)}
          >
            View
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by room, guest, or action..."
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionFilter}
              label="Action Type"
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="status_change">Status Changes</MenuItem>
              <MenuItem value="guest_assigned">Guest Assignments</MenuItem>
              <MenuItem value="guest_removed">Guest Removals</MenuItem>
              <MenuItem value="guest_status_change">Guest Status Changes</MenuItem>
              <MenuItem value="reservation_created">Reservation Created</MenuItem>
              <MenuItem value="reservation_edited">Reservation Edited</MenuItem>
              <MenuItem value="reservation_deleted">Reservation Deleted</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Entries</Typography>
              <Typography variant="h4">{totalEntries}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(actionCounts).map(([action, count]) => (
          <Grid item xs={12} md={3} key={action}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {action.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="h4">{count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((entry) => (
              <TableRow
                key={entry.id}
                hover
                selected={selectedId === entry.id}
                onClick={() => setSelectedId(entry.id)}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedId(entry.id);
                }}
              >
                <TableCell>
                  {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>{(() => {
                  const room = rooms.find((r: any) => r.id === entry.roomId);
                  return room ? room.number : entry.roomId;
                })()}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.action.replace('_', ' ')}
                    color={getActionColor(entry.action)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatAction(entry)}
                  </Typography>
                </TableCell>
                <TableCell>{entry.performedBy}</TableCell>
                <TableCell>
                  {entry.notes && (
                    <Tooltip title={entry.notes}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReservationHistoryPage; 