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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Stack
} from '@mui/material';
import {
  InfoOutlined as InfoOutlinedIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Hotel as HotelIcon,
  People as PeopleIcon,
  Room as RoomIcon,
  Build as BuildIcon,
  CleaningServices as CleaningIcon,
  Computer as SystemIcon,
  Message as MessageIcon,
  Payment as PaymentIcon,
  AccountCircle as UserIcon,
  CheckCircle as CheckInIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCurrentHotel } from '../services/hooks/useHotel';
import { ActivityHistoryEntry } from '../mocks/data/activityHistory';

const fetchActivityHistory = async (hotelId?: string) => {
  const url = hotelId ? `/api/activity-history?hotelId=${hotelId}` : '/api/activity-history';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch activity history');
  return res.json() as Promise<ActivityHistoryEntry[]>;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'reservation': return <HotelIcon fontSize="small" />;
    case 'guest_management': return <PeopleIcon fontSize="small" />;
    case 'room_management': return <RoomIcon fontSize="small" />;
    case 'check_in_out': return <CheckInIcon fontSize="small" />;
    case 'maintenance': return <BuildIcon fontSize="small" />;
    case 'housekeeping': return <CleaningIcon fontSize="small" />;
    case 'system': return <SystemIcon fontSize="small" />;
    case 'communication': return <MessageIcon fontSize="small" />;
    case 'payment': return <PaymentIcon fontSize="small" />;
    case 'user_management': return <UserIcon fontSize="small" />;
    default: return <HistoryIcon fontSize="small" />;
  }
};

const getCategoryColor = (category: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
  switch (category) {
    case 'reservation': return 'primary';
    case 'guest_management': return 'info';
    case 'room_management': return 'secondary';
    case 'check_in_out': return 'success';
    case 'maintenance': return 'warning';
    case 'housekeeping': return 'info';
    case 'system': return 'default';
    case 'communication': return 'primary';
    case 'payment': return 'success';
    case 'user_management': return 'secondary';
    default: return 'default';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'success': return '#4caf50';
    case 'warning': return '#ff9800';
    case 'error': return '#f44336';
    case 'info':
    default: return '#2196f3';
  }
};

const ActivityHistory: React.FC = () => {
  // Use the new hotel entities
  const { data: currentHotel, isLoading: hotelLoading } = useCurrentHotel();
  const hotelId = currentHotel?._id;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const { data: activities, isLoading, error } = useQuery<ActivityHistoryEntry[]>({
    queryKey: ['activityHistory', hotelId],
    queryFn: () => fetchActivityHistory(hotelId),
    enabled: !!hotelId,
  });

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

  // Filter activities
  const filteredActivities = activities?.filter(activity => {
    const matchesSearch = 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.details?.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter;

    let matchesTime = true;
    if (timeFilter !== 'all') {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      switch (timeFilter) {
        case '24h':
          matchesTime = (now.getTime() - activityDate.getTime()) <= 24 * 60 * 60 * 1000;
          break;
        case '7d':
          matchesTime = (now.getTime() - activityDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          matchesTime = (now.getTime() - activityDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return matchesSearch && matchesCategory && matchesSeverity && matchesTime;
  }) || [];

  // Calculate statistics
  const stats = {
    total: filteredActivities.length,
    byCategory: filteredActivities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: filteredActivities.reduce((acc, activity) => {
      acc[activity.severity] = (acc[activity.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  if (!activities || activities.length === 0) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {currentHotel ? (
              <>Activity History for <b>{currentHotel.name}</b>
                <Tooltip title="Complete activity log showing all operations, maintenance, guest interactions, and system events across the hotel.">
                  <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
                </Tooltip>
              </>
            ) : (
              'Activity History'
            )}
          </Typography>
        </Paper>
        <Typography color="textSecondary">No activity history available.</Typography>
      </Box>
    );
  }

  return (
  <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
          {currentHotel ? (
            <>Activity History for <b>{currentHotel.name}</b>
              <Tooltip title="Complete activity log showing all operations, maintenance, guest interactions, and system events across the hotel.">
          <InfoOutlinedIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'middle', color: 'text.secondary', cursor: 'pointer' }} />
        </Tooltip>
            </>
          ) : (
            'Activity History'
          )}
      </Typography>
    </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="reservation">Reservations</MenuItem>
                <MenuItem value="guest_management">Guest Management</MenuItem>
                <MenuItem value="room_management">Room Management</MenuItem>
                <MenuItem value="check_in_out">Check In/Out</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="housekeeping">Housekeeping</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="communication">Communication</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="user_management">User Management</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timeFilter}
                label="Time Period"
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Activities</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Success Rate</Typography>
              <Typography variant="h4" color="success.main">
                {stats.total > 0 ? Math.round(((stats.bySeverity.success || 0) / stats.total) * 100) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Warnings</Typography>
              <Typography variant="h4" color="warning.main">
                {stats.bySeverity.warning || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Categories</Typography>
              <Typography variant="h4">
                {Object.keys(stats.byCategory).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.map((activity) => (
              <TableRow key={activity.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getCategoryIcon(activity.category)}
                    label={activity.category.replace('_', ' ')}
                    color={getCategoryColor(activity.category)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {activity.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.entityName || activity.entityType}
                    </Typography>
                    {activity.details?.roomNumber && (
                      <Typography variant="caption" color="text.secondary">
                        Room {activity.details.roomNumber}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar 
                      sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                      src={`/avatars/${activity.performedBy}.jpg`}
                    >
                      {activity.performedBy.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {activity.performedBy.replace('-', ' ')}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: getSeverityColor(activity.severity),
                      display: 'inline-block'
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  >
                    {activity.severity}
                  </Typography>
                </TableCell>
                <TableCell>
                  {activity.details?.notes && (
                    <Tooltip title={activity.details.notes}>
                      <InfoOutlinedIcon 
                        fontSize="small" 
                        sx={{ color: 'text.secondary', cursor: 'pointer' }}
                      />
                    </Tooltip>
                  )}
                  {activity.details?.amount && (
                    <Typography variant="caption" color="text.secondary">
                      ${activity.details.amount}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredActivities.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            No activities found matching your filters.
          </Typography>
        </Box>
      )}
  </Box>
);
};

export default ActivityHistory; 