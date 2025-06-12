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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelConfigService } from '../../services/hotelConfigService';
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
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Communications', icon: <MessageIcon />, path: '/communications' },
  { text: 'Room Management', icon: <HotelIcon />, path: '/rooms' },
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
  const queryClient = useQueryClient();
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // Fetch all hotel configurations
  const { data: hotelConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['hotelConfigs'],
    queryFn: hotelConfigService.getAllConfigs,
  });

  // Fetch current hotel configuration
  const { data: currentConfig, refetch: refetchCurrentConfig, isLoading: currentConfigLoading } = useQuery({
    queryKey: ['hotelConfig', selectedConfigId],
    queryFn: () => hotelConfigService.getCurrentConfig(),
  });

  // Set current configuration mutation
  const setCurrentConfigMutation = useMutation({
    mutationFn: (configId: string) => hotelConfigService.setCurrentConfig(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelConfig'] });
    },
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleConfigChange = (event: SelectChangeEvent<string>) => {
    const newConfigId = event.target.value;
    setSelectedConfigId(newConfigId);
    hotelConfigService.setCurrentConfig(newConfigId).then(() => {
      refetchCurrentConfig();
    });
  };

  useEffect(() => {
    if (
      hotelConfigs && hotelConfigs.length > 0 &&
      (!selectedConfigId || !hotelConfigs.some(cfg => cfg.id === selectedConfigId))
    ) {
      setSelectedConfigId(hotelConfigs[0].id);
      hotelConfigService.setCurrentConfig(hotelConfigs[0].id).then(() => {
        refetchCurrentConfig();
      });
    }
  }, [selectedConfigId, hotelConfigs, refetchCurrentConfig]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Hotel AI
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            selected={location.pathname === item.path}
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
                  value={selectedConfigId || hotelConfigs[0]?.id || ''}
                  onChange={handleConfigChange}
                  label="Hotel Configuration"
                  size="small"
                >
                  {hotelConfigs.map((config) => (
                    <MenuItem key={config.id} value={config.id}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
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