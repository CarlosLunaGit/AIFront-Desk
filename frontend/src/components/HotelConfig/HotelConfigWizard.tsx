import React, { useState, useCallback, useContext } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createConfig, updateConfig } from '../../services/api/hotel';
import { HotelConfigContext } from '../Layout/Layout';
import BasicInfoStep from './steps/BasicInfoStep';
import FeaturesStep from './steps/FeaturesStep';
import RoomTypesStep from './steps/RoomTypesStep';
import FloorsStep from './steps/FloorsStep';
import RoomTemplatesStep from './steps/RoomTemplatesStep';
import SettingsStep from './steps/SettingsStep';
import type { 
  HotelConfigFormData, 
  HotelFeature, 
  RoomType, 
  Floor, 
  RoomTemplate 
} from '../../types/hotel';

const steps = [
  'Basic Information',
  'Features & Amenities',
  'Room Types',
  'Floors',
  'Room Templates',
  'Settings',
];

const HotelConfigWizard: React.FC = () => {
  const navigate = useNavigate();
  const { currentConfig } = useContext(HotelConfigContext);
  const [activeStep, setActiveStep] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [formData, setFormData] = useState<Partial<HotelConfigFormData>>({
    features: [],
    roomTypes: [],
    floors: [],
    roomTemplates: [],
    settings: {
      roomNumberingFormat: 'numeric' as const,
      defaultStatus: 'available' as const,
      currency: 'USD',
      timezone: 'UTC',
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
  });

  // Initialize form data from current config if editing
  React.useEffect(() => {
    if (mode === 'edit' && currentConfig) {
      // Handle both old string address format and new object format for backward compatibility
      let addressData;
      const configAddress = currentConfig.address as any; // Type assertion for legacy compatibility
      
      if (typeof configAddress === 'string') {
        // Legacy string format - parse it into object
        const parts = configAddress.split(',').map((part: string) => part.trim());
        addressData = {
          street: parts[0] || '',
          city: parts[1] || '',
          state: parts[2] || '',
          zipCode: '',
          country: parts[parts.length - 1] || ''
        };
      } else if (configAddress && typeof configAddress === 'object') {
        // New object format
        addressData = configAddress;
      } else {
        // No address data
        addressData = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }

      console.log('Initializing form data from current config:', currentConfig);
      console.log('Current config room types:', (currentConfig as any).roomTypes);
      console.log('Room types array length:', (currentConfig as any).roomTypes?.length);
      console.log('Current config floors:', (currentConfig as any).floors);
      console.log('Floors array length:', (currentConfig as any).floors?.length);
      
      setFormData({
        name: currentConfig.name,
        description: currentConfig.description,
        address: addressData,
        contactInfo: currentConfig.contactInfo,
        features: [...((currentConfig as any).features || [])],
        roomTypes: [...((currentConfig as any).roomTypes || [])],
        floors: [...((currentConfig as any).floors || [])],
        roomTemplates: [...((currentConfig as any).roomTemplates || [])],
        settings: {
          roomNumberingFormat: (currentConfig as any).settings?.roomNumberingFormat || 'numeric',
          defaultStatus: (currentConfig as any).settings?.defaultStatus || 'available',
          currency: currentConfig.settings?.currency || 'USD',
          timezone: currentConfig.settings?.timezone || 'America/New_York',
          checkInTime: currentConfig.settings?.checkInTime || '15:00',
          checkOutTime: currentConfig.settings?.checkOutTime || '11:00',
        },
      });
    } 
    // If we're in new mode, reset to default values
    else if (mode === 'new') {
      console.log('Resetting to new mode');
      const initialFormData: HotelConfigFormData = {
        name: '',
        description: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        contactInfo: {
          email: '',
          phone: '',
          website: '',
        },
        features: [],
        roomTypes: [],
        floors: [],
        roomTemplates: [],
        settings: {
          roomNumberingFormat: 'numeric',
          defaultStatus: 'available',
          currency: 'USD',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          checkInTime: '15:00',
          checkOutTime: '11:00',
        },
      };
      setFormData(initialFormData);
    }
  }, [mode, currentConfig]); // Only depend on mode and currentConfig

  const handleModeChange = useCallback((newMode: 'new' | 'edit') => {
    console.log('Changing mode to:', newMode);
    setMode(newMode);
    setActiveStep(0); // Reset to first step when changing modes
  }, []);

  const createConfigMutation = useMutation({
    mutationFn: (data: HotelConfigFormData) => createConfig(data),
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: HotelConfigFormData) => updateConfig(currentConfig?.id || '', data),
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return !!formData.name;
      case 1: // Features
        return Array.isArray(formData.features) && formData.features.length > 0;
      case 2: // Room Types
        return Array.isArray(formData.roomTypes) && formData.roomTypes.length > 0;
      case 3: // Floors
        return Array.isArray(formData.floors) && formData.floors.length > 0;
      case 4: // Room Templates
        return Array.isArray(formData.roomTemplates) && formData.roomTemplates.length > 0;
      case 5: // Settings
        return !!formData.settings;
      default:
        return false;
    }
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateStep(activeStep)) {
      return;
    }
    if (mode === 'new') {
      createConfigMutation.mutate(formData as HotelConfigFormData);
    } else {
      updateConfigMutation.mutate(formData as HotelConfigFormData);
    }
  }, [activeStep, formData, validateStep, createConfigMutation, updateConfigMutation, mode]);

  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  }, [activeStep, handleSubmit]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const handleStepComplete = useCallback((stepData: Partial<HotelConfigFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  }, []);

  // NEW: Handle clicking on stepper steps for direct navigation
  const handleStepClick = useCallback((stepIndex: number) => {
    // Allow navigation to:
    // 1. Completed steps (have valid data)
    // 2. The first step (always accessible)
    // 3. Any step that comes before or is the current active step (previously visited)
    const isCompleted = validateStep(stepIndex);
    const isAccessible = isCompleted || stepIndex === 0 || stepIndex <= activeStep;
    
    if (isAccessible) {
      setActiveStep(stepIndex);
    }
  }, [validateStep, activeStep]);

  const handleExit = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const renderStepContent = useCallback((step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep
            initialData={formData}
            onComplete={handleStepComplete}
          />
        );
      case 1:
        return (
          <FeaturesStep
            initialData={formData.features || []}
            onComplete={(features: Omit<HotelFeature, 'id'>[]) => 
              handleStepComplete({ features })}
          />
        );
      case 2:
        return (
          <RoomTypesStep
            initialData={formData.roomTypes || []}
            features={formData.features || []}
            onComplete={(roomTypes: Omit<RoomType, 'id'>[]) => 
              handleStepComplete({ roomTypes })}
          />
        );
      case 3:
        return (
          <FloorsStep
            initialData={formData.floors || []}
            onComplete={(floors: Omit<Floor, 'id'>[]) => 
              handleStepComplete({ floors })}
          />
        );
      case 4:
        return (
          <RoomTemplatesStep
            initialData={formData.roomTemplates || []}
            roomTypes={formData.roomTypes || []}
            floors={formData.floors || []}
            features={formData.features || []}
            onComplete={(roomTemplates: Omit<RoomTemplate, 'id'>[]) => 
              handleStepComplete({ roomTemplates })}
          />
        );
      case 5:
        return (
          <SettingsStep
            initialData={formData.settings || {
              roomNumberingFormat: 'numeric',
              defaultStatus: 'available',
              currency: 'USD',
              timezone: 'UTC',
              checkInTime: '15:00',
              checkOutTime: '11:00',
            }}
            onComplete={(settings: HotelConfigFormData['settings']) => 
              handleStepComplete({ settings })}
          />
        );
      default:
        return null;
    }
  }, [formData, handleStepComplete]);

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Hotel Configuration
          </Typography>
          <Box>
            <Tabs
              value={mode}
              onChange={(_, newValue) => handleModeChange(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab 
                label="New Configuration" 
                value="new"
                disabled={!currentConfig}
              />
              <Tab 
                label="Edit Current Configuration" 
                value="edit"
                disabled={!currentConfig}
              />
            </Tabs>
            <Button
              variant="outlined"
              color="error"
              onClick={handleExit}
            >
              Exit Setup
            </Button>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {mode === 'new' 
            ? 'Create a new hotel configuration'
            : `Editing configuration: ${currentConfig?.name || ''}`
          }
        </Typography>

        {!currentConfig && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No hotel configuration selected. Please select a configuration from the dropdown in the header.
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label, index) => {
            const isCompleted = validateStep(index);
            const isAccessible = isCompleted || index === 0 || index <= activeStep;
            
            return (
              <Step key={label} completed={isCompleted}>
                <StepLabel 
                  onClick={() => handleStepClick(index)}
                  sx={{
                    cursor: isAccessible ? 'pointer' : 'default',
                    '&:hover': isAccessible ? {
                      '& .MuiStepLabel-label': {
                        color: 'primary.main',
                      }
                    } : {},
                    '& .MuiStepLabel-label': {
                      fontSize: '0.875rem',
                      transition: 'color 0.2s ease-in-out',
                      color: isAccessible ? 'inherit' : 'text.disabled',
                    },
                    '& .MuiStepIcon-root': {
                      cursor: isAccessible ? 'pointer' : 'default',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': isAccessible ? {
                        transform: 'scale(1.1)',
                      } : {},
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mb: 2,
            fontStyle: 'italic'
          }}
        >
          💡 Tip: Click on any accessible step to navigate directly (completed steps in blue or previously visited steps)
        </Typography>

        {(createConfigMutation.isError || updateConfigMutation.isError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error {mode === 'new' ? 'creating' : 'updating'} hotel configuration. Please try again.
          </Alert>
        )}

        <Box sx={{ mt: 2, position: 'relative' }}>
          {(createConfigMutation.isPending || updateConfigMutation.isPending) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || createConfigMutation.isPending || updateConfigMutation.isPending}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!validateStep(activeStep) || createConfigMutation.isPending || updateConfigMutation.isPending}
          >
            {activeStep === steps.length - 1 
              ? (mode === 'new' ? 'Create Configuration' : 'Update Configuration')
              : 'Next'
            }
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={showExitDialog}
        onClose={() => setShowExitDialog(false)}
      >
        <DialogTitle>Exit Configuration Setup?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to exit? Any unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmExit} color="error" variant="contained">
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HotelConfigWizard; 