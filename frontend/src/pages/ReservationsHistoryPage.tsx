import React, { useState, useContext } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Tooltip, CircularProgress, Alert, IconButton, Collapse
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery } from '@tanstack/react-query';
import { HotelConfigContext } from '../components/Layout/Layout';
import { format } from 'date-fns';

interface ReservationHistoryEntry {
  id: string;
  roomId: string;
  timestamp: string;
  action: 'reservation_created' | 'reservation_edited' | 'reservation_deleted';
  previousState: {
    guestIds?: string[];
    dates?: string[];
    rooms?: string[];
    status?: string;
    price?: number;
    notes?: string;
  };
  newState: {
    guestIds?: string[];
    dates?: string[];
    rooms?: string[];
    status?: string;
    price?: number;
    notes?: string;
  };
  performedBy: string;
}

const fetchAllHistory = async () => {
  const res = await fetch('/api/reservation-history');
  if (!res.ok) throw new Error('Failed to fetch reservation history');
  return res.json() as Promise<ReservationHistoryEntry[]>;
};

const getActionColor = (action: ReservationHistoryEntry['action']) => {
  switch (action) {
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

// Removed unused formatAction function

const ReservationsHistoryPage: React.FC = () => {
  const { selectedConfigId } = useContext(HotelConfigContext);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ReservationHistoryEntry | null>(null);

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['reservationHistory', selectedConfigId],
    queryFn: fetchAllHistory,
    enabled: !!selectedConfigId,
  });
  const { data: guests = [] } = useQuery({ queryKey: ['guests'], queryFn: async () => (await fetch('/api/guests')).json() });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => (await fetch('/api/rooms')).json() });

  // Only show reservation actions
  const reservationActions = history.filter((entry: ReservationHistoryEntry) =>
    ['reservation_created', 'reservation_edited', 'reservation_deleted'].includes(entry.action)
  );

  const filtered = reservationActions.filter((entry: ReservationHistoryEntry) => {
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const guestNames = [
      ...(entry.newState.guestIds || []),
      ...(entry.previousState.guestIds || [])
    ].map(gid => guests.find((g: any) => g.id === gid)?.name || gid).join(', ');
    const room = rooms.find((r: any) => r.id === entry.roomId || r.number === entry.roomId);
    return (
      matchesAction && (
        entry.id.toLowerCase().includes(search.toLowerCase()) ||
        guestNames.toLowerCase().includes(search.toLowerCase()) ||
        (room ? String(room.number) : entry.roomId).toLowerCase().includes(search.toLowerCase()) ||
        ((entry.newState.notes ?? entry.previousState.notes ?? '').toLowerCase().includes(search.toLowerCase()))
      )
    );
  });

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    if (sortBy === 'timestamp') {
      aVal = a.timestamp;
      bVal = b.timestamp;
    } else if (sortBy === 'action') {
      aVal = a.action;
      bVal = b.action;
    } else if (sortBy === 'roomId') {
      aVal = a.roomId;
      bVal = b.roomId;
    } else if (sortBy === 'guestIds') {
      aVal = ((a.newState.guestIds || a.previousState.guestIds || [])[0] || '') as string;
      bVal = ((b.newState.guestIds || b.previousState.guestIds || [])[0] || '') as string;
    } else if (sortBy === 'performedBy') {
      aVal = a.performedBy;
      bVal = b.performedBy;
    } else if (sortBy === 'notes') {
      aVal = a.newState.notes ?? a.previousState.notes ?? '';
      bVal = b.newState.notes ?? b.previousState.notes ?? '';
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" p={3}><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{(error as Error).message}</Alert></Box>;

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Reservations History
          <Tooltip title="View and filter the complete history of reservation actions (created, edited, deleted).">
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
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionFilter}
              label="Action Type"
              onChange={e => setActionFilter(e.target.value)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="reservation_created">Reservation Created</MenuItem>
              <MenuItem value="reservation_edited">Reservation Edited</MenuItem>
              <MenuItem value="reservation_deleted">Reservation Deleted</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={!selectedEntry}
            onClick={() => setViewModalOpen(true)}
          >
            View
          </Button>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>Timestamp</TableCell>
              <TableCell onClick={() => handleSort('action')} style={{ cursor: 'pointer' }}>Action</TableCell>
              <TableCell onClick={() => handleSort('roomId')} style={{ cursor: 'pointer' }}>Reservation/Room</TableCell>
              <TableCell onClick={() => handleSort('guestIds')} style={{ cursor: 'pointer' }}>Guest(s)</TableCell>
              <TableCell onClick={() => handleSort('performedBy')} style={{ cursor: 'pointer' }}>Performed By</TableCell>
              <TableCell onClick={() => handleSort('notes')} style={{ cursor: 'pointer' }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((entry) => {
              const guestIds = entry.newState.guestIds && entry.newState.guestIds.length > 0
                ? entry.newState.guestIds
                : entry.previousState.guestIds || [];
              const uniqueGuestIds = Array.from(new Set(guestIds));
              const guestNames = uniqueGuestIds.map(gid => guests.find((g: any) => g.id === gid)?.name || gid);
              const firstGuest = guestNames[0] || '';
              const moreCount = guestNames.length - 1;
              const expanded = expandedRows[entry.id];
              const room = rooms.find((r: any) => r.id === entry.roomId || r.number === entry.roomId);
              return (
                <React.Fragment key={entry.id}>
                  <TableRow
                    hover
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    selected={selectedEntry?.id === entry.id}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell>{format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Chip label={entry.action.replace('reservation_', '').replace('_', ' ').toUpperCase()} color={getActionColor(entry.action)} size="small" />
                    </TableCell>
                    <TableCell>{room ? room.number : entry.roomId}</TableCell>
                    <TableCell>
                      {firstGuest}
                      {moreCount > 0 && (
                        <>
                          {' '}
                          <IconButton size="small" onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [entry.id]: !expanded })); }}>
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                          <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedRows(r => ({ ...r, [entry.id]: !expanded })); }}>
                            +{moreCount} more
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{entry.performedBy}</TableCell>
                    <TableCell>{entry.newState.notes ?? entry.previousState.notes ?? ''}</TableCell>
                  </TableRow>
                  {moreCount > 0 && (
                    <TableRow>
                      <TableCell colSpan={6} style={{ padding: 0, background: '#f9f9f9' }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box pl={6} py={1}>
                            {guestNames.slice(1).map((name: string, idx: number) => (
                              <Typography key={idx} variant="body2">{name}</Typography>
                            ))}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={viewModalOpen && !!selectedEntry} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reservation Change Details</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={4}>
            <Box flex={1}>
              <Typography variant="subtitle1" gutterBottom>FROM</Typography>
              {/* Guests diff */}
              {(() => {
                const prevGuests = (selectedEntry?.previousState.guestIds || []).slice().sort();
                const nextGuests = (selectedEntry?.newState.guestIds || []).slice().sort();
                if (prevGuests.length === nextGuests.length && prevGuests.every((gid, i) => gid === nextGuests[i])) {
                  return <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Guests:</b> {prevGuests.map(gid => guests.find((g: any) => g.id === gid)?.name || gid).join(', ') || '—'}</Typography>;
                } else {
                  return <Typography variant="body2" sx={{ color: 'text.primary' }}><b>Guests:</b> {prevGuests.map(gid => guests.find((g: any) => g.id === gid)?.name || gid).join(', ') || '—'}</Typography>;
                }
              })()}
              {/* Dates diff */}
              {selectedEntry?.previousState.dates !== selectedEntry?.newState.dates ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Dates:</b> {selectedEntry?.previousState.dates || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Dates:</b> {selectedEntry?.previousState.dates || '—'}</Typography>
              )}
              {/* Room diff */}
              {selectedEntry?.previousState.rooms !== selectedEntry?.newState.rooms ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Room:</b> {(() => { const room = rooms.find((r: any) => r.id === selectedEntry?.previousState.rooms); return room ? room.number : (selectedEntry?.previousState.rooms || '—'); })()}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Room:</b> {(() => { const room = rooms.find((r: any) => r.id === selectedEntry?.previousState.rooms); return room ? room.number : (selectedEntry?.previousState.rooms || '—'); })()}</Typography>
              )}
              {/* Status diff */}
              {selectedEntry?.previousState.status !== selectedEntry?.newState.status ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Status:</b> {selectedEntry?.previousState.status || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Status:</b> {selectedEntry?.previousState.status || '—'}</Typography>
              )}
              {/* Price diff */}
              {selectedEntry?.previousState.price !== selectedEntry?.newState.price ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Price:</b> {selectedEntry?.previousState.price !== undefined ? selectedEntry?.previousState.price : '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Price:</b> {selectedEntry?.previousState.price !== undefined ? selectedEntry?.previousState.price : '—'}</Typography>
              )}
              {/* Notes diff */}
              {selectedEntry?.previousState.notes !== selectedEntry?.newState.notes ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Notes:</b> {selectedEntry?.previousState.notes || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Notes:</b> {selectedEntry?.previousState.notes || '—'}</Typography>
              )}
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle1" gutterBottom>TO</Typography>
              {/* Guests diff */}
              {(() => {
                const prevGuests = (selectedEntry?.previousState.guestIds || []).slice().sort();
                const nextGuests = (selectedEntry?.newState.guestIds || []).slice().sort();
                const added = nextGuests.filter(gid => !prevGuests.includes(gid));
                if (prevGuests.length === nextGuests.length && prevGuests.every((gid, i) => gid === nextGuests[i])) {
                  return <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Guests:</b> {nextGuests.map(gid => guests.find((g: any) => g.id === gid)?.name || gid).join(', ') || '—'}</Typography>;
                } else {
                  return <Typography variant="body2" sx={{ color: 'text.primary' }}><b>Guests:</b> {nextGuests.map(gid => {
                    const name = guests.find((g: any) => g.id === gid)?.name || gid;
                    return added.includes(gid)
                      ? <span key={gid} style={{ color: '#388e3c', fontWeight: 600 }}>{name}</span>
                      : name;
                  }).reduce((prev, curr, i) => prev === null ? [curr] : [...prev, ', ', curr], null) || '—'}</Typography>;
                }
              })()}
              {/* Dates diff */}
              {selectedEntry?.previousState.dates !== selectedEntry?.newState.dates ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Dates:</b> {selectedEntry?.newState.dates || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Dates:</b> {selectedEntry?.newState.dates || '—'}</Typography>
              )}
              {/* Room diff */}
              {selectedEntry?.previousState.rooms !== selectedEntry?.newState.rooms ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Room:</b> {(() => { const room = rooms.find((r: any) => r.id === selectedEntry?.newState.rooms); return room ? room.number : (selectedEntry?.newState.rooms || '—'); })()}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Room:</b> {(() => { const room = rooms.find((r: any) => r.id === selectedEntry?.newState.rooms); return room ? room.number : (selectedEntry?.newState.rooms || '—'); })()}</Typography>
              )}
              {/* Status diff */}
              {selectedEntry?.previousState.status !== selectedEntry?.newState.status ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Status:</b> {selectedEntry?.newState.status || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Status:</b> {selectedEntry?.newState.status || '—'}</Typography>
              )}
              {/* Price diff */}
              {selectedEntry?.previousState.price !== selectedEntry?.newState.price ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Price:</b> {selectedEntry?.newState.price !== undefined ? selectedEntry?.newState.price : '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Price:</b> {selectedEntry?.newState.price !== undefined ? selectedEntry?.newState.price : '—'}</Typography>
              )}
              {/* Notes diff */}
              {selectedEntry?.previousState.notes !== selectedEntry?.newState.notes ? (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}><b>Notes:</b> {selectedEntry?.newState.notes || '—'}</Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}><b>Notes:</b> {selectedEntry?.newState.notes || '—'}</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationsHistoryPage; 