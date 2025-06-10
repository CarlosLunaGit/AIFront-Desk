import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import HotelConfigWizard from './components/HotelConfig/HotelConfigWizard';
import Login from './components/Auth/Login';
import CommunicationInterface from './components/Communications/CommunicationInterface';
import RoomManagement from './components/Rooms/RoomManagement';
import { AuthProvider } from './contexts/AuthContext';

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
      path: '/',
      element: (
        <Layout>
          <Dashboard />
        </Layout>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <Layout>
          <Dashboard />
        </Layout>
      ),
    },
    {
      path: '/communications',
      element: (
        <Layout>
          <CommunicationInterface />
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
      path: '*',
      element: <Navigate to="/dashboard" replace />,
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
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
