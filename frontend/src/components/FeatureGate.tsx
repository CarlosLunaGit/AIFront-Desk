import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Alert, Button, Box, Typography } from '@mui/material';
import { Upgrade } from '@mui/icons-material';

interface FeatureGateProps {
  feature?: string;
  requireFeature?: keyof import('../contexts/UserContext').FeatureLimits;
  requireWithinLimits?: 'rooms' | 'aiResponses' | 'users';
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requireFeature,
  requireWithinLimits,
  fallback,
  children,
  showUpgrade = true,
}) => {
  const { canUseFeature, hasFeature, isWithinLimits, tenant } = useUser();

  // Check feature access
  let hasAccess = true;
  let reason = '';

  if (feature && !canUseFeature(feature)) {
    hasAccess = false;
    reason = `Feature "${feature}" not available in your current plan`;
  }

  if (requireFeature && !hasFeature(requireFeature)) {
    hasAccess = false;
    reason = `Feature "${requireFeature}" not available in your current plan`;
  }

  if (requireWithinLimits && !isWithinLimits(requireWithinLimits)) {
    hasAccess = false;
    reason = `You've reached your ${requireWithinLimits} limit`;
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (showUpgrade) {
    return (
      <UpgradePrompt 
        reason={reason}
        currentTier={tenant?.subscription.tier || 'basic'}
      />
    );
  }

  // Don't render anything if no upgrade prompt
  return null;
};

interface UpgradePromptProps {
  reason: string;
  currentTier: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ reason, currentTier }) => {
  const handleUpgrade = () => {
    // Navigate to subscription page or open upgrade modal
    window.location.href = '/subscription';
  };

  return (
    <Alert 
      severity="info" 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        '& .MuiAlert-message': { 
          flex: 1 
        }
      }}
      action={
        <Button 
          color="inherit" 
          size="small" 
          onClick={handleUpgrade}
          startIcon={<Upgrade />}
        >
          Upgrade
        </Button>
      }
    >
      <Box>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          {reason}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Current plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
        </Typography>
      </Box>
    </Alert>
  );
};

// Hook for easier feature checking
export const useFeatureAccess = () => {
  const { canUseFeature, hasFeature, isWithinLimits, getUsagePercentage } = useUser();

  return {
    canUseFeature,
    hasFeature,
    isWithinLimits,
    getUsagePercentage,
    
    // Specific feature checks for common use cases
    canMakeVoiceCalls: () => canUseFeature('voice_calls'),
    canUseSMS: () => canUseFeature('sms'),
    canUseWhatsApp: () => canUseFeature('whatsapp'),
    canUseAdvancedAnalytics: () => canUseFeature('advanced_analytics'),
    canUseCustomAI: () => canUseFeature('custom_ai'),
    canUseAPI: () => canUseFeature('api_access'),
    
    // Usage checks
    canAddMoreRooms: () => isWithinLimits('rooms'),
    canSendMoreAIResponses: () => isWithinLimits('aiResponses'),
    canAddMoreUsers: () => isWithinLimits('users'),
    
    // Usage percentages
    getRoomsUsage: () => getUsagePercentage('rooms'),
    getAIResponsesUsage: () => getUsagePercentage('aiResponses'),
    getUsersUsage: () => getUsagePercentage('users'),
  };
}; 