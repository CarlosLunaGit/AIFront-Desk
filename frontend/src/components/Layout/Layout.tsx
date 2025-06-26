import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Message as MessageIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Logout as LogoutIcon,
  Event as EventIcon,
  EventNote as EventNoteIcon,
  History as HistoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAllHotels, useCurrentHotel, useCurrentConfig, useSetCurrentHotel } from '../../services/hooks/useHotel';
import type { HotelConfiguration } from '../../types/hotel';

// Create a context for the selected hotel configuration
export const HotelConfigContext = React.createContext<{
  selectedConfigId: string;
  setSelectedConfigId: (id: string) => void;
  currentConfig: HotelConfiguration | undefined;
}>(
  {
    selectedConfigId: '',
    setSelectedConfigId: () => {},
    currentConfig: undefined,
  }
);

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Reservations', icon: <EventIcon />, path: '/reservations' },
  { text: 'Reservations History', icon: <EventNoteIcon />, path: '/reservations-history' },
  { text: 'Activity History', icon: <HistoryIcon />, path: '/activity-history' },
  { text: 'Communications', icon: <MessageIcon />, path: '/communications' },
  { text: 'Room Management', icon: <HotelIcon />, path: '/rooms' },
  { text: 'Guest Management', icon: <PeopleIcon />, path: '/guests' },
  { text: 'Hotel Configuration', icon: <BusinessIcon />, path: '/hotel-config' },
  { text: 'Subscriptions', icon: <CreditCardIcon />, path: '/subscriptions' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const { logout, user } = useAuth();

  // Fetch all hotels
  const { data: hotels = [], isLoading: hotelsLoading } = useAllHotels();

  // Fetch current hotel and configuration with room types
  const { data: currentConfig, isLoading: currentConfigLoading } = useCurrentConfig();

  // Hotel switching mutation
  const setCurrentHotelMutation = useSetCurrentHotel();

  // Debug logging for room types
  React.useEffect(() => {
    if (currentConfig) {
      console.log('🏨 Layout: Current config loaded:', currentConfig);
      console.log('🏠 Layout: Room types count:', currentConfig.roomTypes?.length || 0);
      console.log('📋 Layout: Room types:', currentConfig.roomTypes);
    }
  }, [currentConfig]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleHotelChange = (event: SelectChangeEvent<string>) => {
    const newHotelId = event.target.value;
    setSelectedHotelId(newHotelId);
    
    // Actually switch the hotel using the API
    console.log('🔄 Switching to hotel:', newHotelId);
    setCurrentHotelMutation.mutate(newHotelId, {
      onSuccess: (switchedHotel) => {
        console.log('✅ Successfully switched to hotel:', switchedHotel.name);
      },
      onError: (error) => {
        console.error('❌ Failed to switch hotel:', error);
        // Revert the UI selection on error
        setSelectedHotelId(hotels.find(h => h._id !== newHotelId)?._id || '');
      }
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (
      hotels && 
      Array.isArray(hotels) && 
      hotels.length > 0 &&
      (!selectedHotelId || !hotels.some((hotel: any) => hotel?._id === selectedHotelId))
    ) {
      const firstHotel = hotels[0];
      if (firstHotel && firstHotel._id) {
        setSelectedHotelId(firstHotel._id);
      }
    }
  }, [selectedHotelId, hotels]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Hotel AI
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            button
            key={`${item.text}-${index}`}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <HotelConfigContext.Provider value={{ selectedConfigId: selectedHotelId, setSelectedConfigId: setSelectedHotelId, currentConfig: currentConfig }}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Hotel AI
            </Typography>
            {!hotelsLoading && !currentConfigLoading && hotels && hotels.length > 0 && (
              <FormControl sx={{ minWidth: 200, ml: 2 }}>
                <InputLabel>Hotel</InputLabel>
                <Select<string>
                  value={selectedHotelId || (hotels && hotels.length > 0 ? hotels[0]?._id : '') || ''}
                  onChange={handleHotelChange}
                  label="Hotel"
                  size="small"
                >
                  {hotels?.map((hotel: any) => (
                    <MenuItem key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {user && (
              <Tooltip title={user.email}>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1 }}>
                    {(() => {
                      // If user has a name, try to generate initials
                      if (user.name && typeof user.name === 'string' && user.name.trim()) {
                        const trimmedName = user.name.trim();
                        const nameParts = trimmedName.split(' ').filter((n: string) => n && n.length > 0);
                        const initials = nameParts.map((n: string) => n[0]).join('').toUpperCase();
                        
                        if (initials && initials.length > 0) {
                          return initials;
                        }
                      }
                      
                      // Fallback to email initial
                      if (user.email && user.email.length > 0) {
                        return user.email[0].toUpperCase();
                      }
                      
                      // Last resort fallback
                      return 'U';
                    })()}
                  </Avatar>
                  <Typography variant="subtitle1" color="inherit" sx={{ fontWeight: 500 }}>
                    {user.name}
                  </Typography>
                </Box>
              </Tooltip>
            )}
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </HotelConfigContext.Provider>
  );
};

export default Layout; 