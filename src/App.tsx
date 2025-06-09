import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Dashboard from './components/Dashboard/Dashboard';
import CommunicationInterface from './components/Communications/CommunicationInterface';
import Layout from './components/Layout/Layout';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Box sx={{ flexGrow: 1, p: 3 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/communications" element={<CommunicationInterface />} />
                <Route path="/rooms" element={<div>Room Management (Coming Soon)</div>} />
                <Route path="/subscriptions" element={<div>Subscriptions (Coming Soon)</div>} />
                <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
                <Route path="/analytics" element={<div>Analytics (Coming Soon)</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
