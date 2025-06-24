import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  Hotel as HotelIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Event as EventIcon,
  EventNote as EventNoteIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAllConfigs, useCurrentConfig, useSetCurrentConfig } from '../../services/hooks/useHotel';
import type { HotelConfiguration } from '../../types/hotel';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const { logout, user } = useAuth();

  // Fetch all hotel configurations
  const { data: hotelConfigs = [], isLoading: configsLoading } = useAllConfigs();

  // Fetch current hotel configuration
  const { data: currentConfig, isLoading: currentConfigLoading } = useCurrentConfig();

  // Set current configuration mutation
  const setCurrentConfigMutation = useSetCurrentConfig();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleConfigChange = (event: SelectChangeEvent<string>) => {
    const newConfigId = event.target.value;
    setSelectedConfigId(newConfigId);
    setCurrentConfigMutation.mutate(newConfigId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (
      hotelConfigs && 
      Array.isArray(hotelConfigs) && 
      hotelConfigs.length > 0 &&
      (!selectedConfigId || !hotelConfigs.some((cfg: any) => cfg?.id === selectedConfigId))
    ) {
      const firstConfig = hotelConfigs[0];
      if (firstConfig && firstConfig.id) {
        setSelectedConfigId(firstConfig.id);
        setCurrentConfigMutation.mutate(firstConfig.id);
      }
    }
  }, [selectedConfigId, hotelConfigs, setCurrentConfigMutation]);

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
    <HotelConfigContext.Provider value={{ selectedConfigId, setSelectedConfigId, currentConfig }}>
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
            {!configsLoading && !currentConfigLoading && hotelConfigs && hotelConfigs.length > 0 && (
              <FormControl sx={{ minWidth: 200, ml: 2 }}>
                <InputLabel>Hotel Configuration</InputLabel>
                <Select<string>
                  value={selectedConfigId || (hotelConfigs && hotelConfigs.length > 0 ? hotelConfigs[0]?.id : '') || ''}
                  onChange={handleConfigChange}
                  label="Hotel Configuration"
                  size="small"
                >
                  {hotelConfigs?.map((config: any) => (
                    <MenuItem key={config.id} value={config.id}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {user && (
              <Tooltip title={user.email}>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1 }}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : user.email[0].toUpperCase()}
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