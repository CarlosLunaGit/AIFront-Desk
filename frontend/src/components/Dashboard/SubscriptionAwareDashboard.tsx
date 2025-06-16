import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import {
  Room,
  SmartToy,
  Analytics,
  Phone,
  Sms,
  WhatsApp,
  Api,
  Star,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { FeatureGate, useFeatureAccess } from '../FeatureGate';

export const SubscriptionAwareDashboard: React.FC = () => {
  const { tenant, user } = useUser();
  const {
    canMakeVoiceCalls,
    canUseSMS,
    canUseWhatsApp,
    canUseAdvancedAnalytics,
    canUseCustomAI,
    canUseAPI,
    getRoomsUsage,
    getAIResponsesUsage,
    getUsersUsage,
  } = useFeatureAccess();

  if (!tenant || !user) {
    return <div>Loading...</div>;
  }

  const { subscription, usage } = tenant;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with subscription info */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {tenant.name} - {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
          </Typography>
        </Box>
        <Chip
          icon={<Star />}
          label={subscription.tier.toUpperCase()}
          color={subscription.tier === 'enterprise' ? 'primary' : subscription.tier === 'professional' ? 'secondary' : 'default'}
          variant="outlined"
        />
      </Box>

      {/* Subscription Status Alert */}
      {subscription.status !== 'active' && subscription.status !== 'trialing' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your subscription is {subscription.status}. Please update your payment method to continue using all features.
        </Alert>
      )}

      {/* Usage Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Room sx={{ mr: 1 }} />
                <Typography variant="h6">Rooms</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {usage.currentRooms}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {subscription.features.maxRooms === -1 ? '∞' : subscription.features.maxRooms} rooms
              </Typography>
              {subscription.features.maxRooms !== -1 && (
                <LinearProgress
                  variant="determinate"
                  value={getRoomsUsage()}
                  sx={{ mt: 1 }}
                  color={getRoomsUsage() > 80 ? 'warning' : 'primary'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SmartToy sx={{ mr: 1 }} />
                <Typography variant="h6">AI Responses</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {usage.aiResponsesThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {subscription.features.maxAIResponses === -1 ? '∞' : subscription.features.maxAIResponses} this month
              </Typography>
              {subscription.features.maxAIResponses !== -1 && (
                <LinearProgress
                  variant="determinate"
                  value={getAIResponsesUsage()}
                  sx={{ mt: 1 }}
                  color={getAIResponsesUsage() > 80 ? 'warning' : 'primary'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Team Members</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {usage.usersCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {subscription.features.maxUsers === -1 ? '∞' : subscription.features.maxUsers} users
              </Typography>
              {subscription.features.maxUsers !== -1 && (
                <LinearProgress
                  variant="determinate"
                  value={getUsersUsage()}
                  sx={{ mt: 1 }}
                  color={getUsersUsage() > 80 ? 'warning' : 'primary'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Access */}
      <Grid container spacing={3}>
        {/* Communication Channels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Communication Channels
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* WhatsApp - Available in all plans */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WhatsApp sx={{ mr: 1, color: canUseWhatsApp() ? 'success.main' : 'grey.400' }} />
                    <Typography>WhatsApp</Typography>
                  </Box>
                  <Chip 
                    label={canUseWhatsApp() ? 'Active' : 'Upgrade Required'} 
                    size="small" 
                    color={canUseWhatsApp() ? 'success' : 'default'}
                  />
                </Box>

                {/* SMS - Professional+ */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Sms sx={{ mr: 1, color: canUseSMS() ? 'success.main' : 'grey.400' }} />
                    <Typography>SMS</Typography>
                  </Box>
                  <FeatureGate 
                    feature="sms" 
                    fallback={<Chip label="Professional+" size="small" />}
                    showUpgrade={false}
                  >
                    <Chip label="Active" size="small" color="success" />
                  </FeatureGate>
                </Box>

                {/* Voice Calls - Professional+ */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, color: canMakeVoiceCalls() ? 'success.main' : 'grey.400' }} />
                    <Typography>Voice Calls</Typography>
                  </Box>
                  <FeatureGate 
                    feature="voice_calls" 
                    fallback={<Chip label="Professional+" size="small" />}
                    showUpgrade={false}
                  >
                    <Chip label="Active" size="small" color="success" />
                  </FeatureGate>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Features */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Advanced Features
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Advanced Analytics - Professional+ */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 1, color: canUseAdvancedAnalytics() ? 'success.main' : 'grey.400' }} />
                    <Typography>Advanced Analytics</Typography>
                  </Box>
                  <FeatureGate 
                    feature="advanced_analytics" 
                    fallback={<Chip label="Professional+" size="small" />}
                    showUpgrade={false}
                  >
                    <Chip label="Active" size="small" color="success" />
                  </FeatureGate>
                </Box>

                {/* API Access - Professional+ */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Api sx={{ mr: 1, color: canUseAPI() ? 'success.main' : 'grey.400' }} />
                    <Typography>API Access</Typography>
                  </Box>
                  <FeatureGate 
                    feature="api_access" 
                    fallback={<Chip label="Professional+" size="small" />}
                    showUpgrade={false}
                  >
                    <Chip label="Active" size="small" color="success" />
                  </FeatureGate>
                </Box>

                {/* Custom AI - Enterprise */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmartToy sx={{ mr: 1, color: canUseCustomAI() ? 'success.main' : 'grey.400' }} />
                    <Typography>Custom AI Training</Typography>
                  </Box>
                  <FeatureGate 
                    feature="custom_ai" 
                    fallback={<Chip label="Enterprise" size="small" />}
                    showUpgrade={false}
                  >
                    <Chip label="Active" size="small" color="success" />
                  </FeatureGate>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature-Gated Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Add Room - Check room limits */}
                <FeatureGate requireWithinLimits="rooms">
                  <Button variant="contained" startIcon={<Room />}>
                    Add Room
                  </Button>
                </FeatureGate>

                {/* Advanced Analytics - Professional+ */}
                <FeatureGate feature="advanced_analytics">
                  <Button variant="outlined" startIcon={<Analytics />}>
                    View Analytics
                  </Button>
                </FeatureGate>

                {/* API Settings - Professional+ */}
                <FeatureGate feature="api_access">
                  <Button variant="outlined" startIcon={<Api />}>
                    API Settings
                  </Button>
                </FeatureGate>

                {/* Custom AI - Enterprise */}
                <FeatureGate feature="custom_ai">
                  <Button variant="outlined" startIcon={<SmartToy />}>
                    Train AI
                  </Button>
                </FeatureGate>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 