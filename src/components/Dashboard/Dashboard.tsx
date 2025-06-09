import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Button,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

interface DashboardStats {
  activeGuests: number;
  availableRooms: number;
  pendingMessages: number;
  todayBookings: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
  });

  const menuItems = [
    {
      title: 'Communications',
      icon: <MessageIcon />,
      path: '/communications',
      color: '#2196f3',
    },
    {
      title: 'Room Management',
      icon: <PersonIcon />,
      path: '/rooms',
      color: '#4caf50',
    },
    {
      title: 'Subscriptions',
      icon: <NotificationsIcon />,
      path: '/subscriptions',
      color: '#ff9800',
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      color: '#9c27b0',
    },
    {
      title: 'Analytics',
      icon: <NotificationsIcon />,
      path: '/analytics',
      color: '#f44336',
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Dashboard</Typography>
            <Box>
              <IconButton>
                <MessageIcon />
              </IconButton>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* Stats Overview */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Guests
              </Typography>
              <Typography variant="h5">
                {stats?.activeGuests || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available Rooms
              </Typography>
              <Typography variant="h5">
                {stats?.availableRooms || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Messages
              </Typography>
              <Typography variant="h5">
                {stats?.pendingMessages || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Bookings
              </Typography>
              <Typography variant="h5">
                {stats?.todayBookings || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Access Menu */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Quick Access
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: item.color }}>
                    {item.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={item.title} />
                <IconButton 
                  size="small"
                  onClick={() => navigate(item.path)}
                >
                  <NotificationsIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 