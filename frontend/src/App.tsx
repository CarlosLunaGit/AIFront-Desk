import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import HotelConfigWizard from './components/HotelConfig/HotelConfigWizard';
import Login from './components/Auth/Login';
import { CommunicationsDashboard } from './components/Communications/CommunicationsDashboard';
import RoomManagement from './components/Rooms/RoomManagement';
import GuestManagement from './components/GuestManagement';

import ReservationsPage from './pages/ReservationsPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import ReservationsHistoryPage from './pages/ReservationsHistoryPage';
import { AuthProvider } from './contexts/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient();

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Create router with future flags enabled
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/dashboard',
          element: (
            <Layout>
              <Dashboard />
            </Layout>
          ),
        },
        {
          path: '/reservations',
          element: (
            <Layout>
              <ReservationsPage />
            </Layout>
          ),
        },
        {
          path: '/activity-history',
          element: (
            <Layout>
              <ActivityHistoryPage />
            </Layout>
          ),
        },
        {
          path: '/communications',
          element: (
            <Layout>
              <CommunicationsDashboard />
            </Layout>
          ),
        },
        {
          path: '/hotel-config',
          element: (
            <Layout>
              <HotelConfigWizard />
            </Layout>
          ),
        },
        {
          path: '/rooms',
          element: (
            <Layout>
              <RoomManagement />
            </Layout>
          ),
        },
        {
          path: '/guests',
          element: (
            <Layout>
              <GuestManagement />
            </Layout>
          ),
        },
        {
          path: '/subscriptions',
          element: (
            <Layout>
              <div>Subscriptions (Coming Soon)</div>
            </Layout>
          ),
        },
        {
          path: '/settings',
          element: (
            <Layout>
              <div>Settings (Coming Soon)</div>
            </Layout>
          ),
        },
        {
          path: '/analytics',
          element: (
            <Layout>
              <div>Analytics (Coming Soon)</div>
            </Layout>
          ),
        },
        {
          path: '/reservations-history',
          element: (
            <Layout>
              <ReservationsHistoryPage />
            </Layout>
          ),
        },
        {
          path: '*',
          element: <Navigate to="/dashboard" replace />,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
