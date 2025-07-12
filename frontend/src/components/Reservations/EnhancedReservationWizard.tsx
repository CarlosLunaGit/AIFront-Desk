// Enhanced Reservation Wizard
// Full-screen mobile-friendly wizard for creating multi-room, multi-guest reservations

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  IconButton,
  Grid,
  TextField,
  Paper,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  MenuItem
} from '@mui/material';
import {
  Close,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Add,
  Remove,
  People,
  CalendarToday,
  Hotel,
  AttachMoney
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, differenceInDays } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';

// Types
import {
  MultiRoomReservation,
  AvailableRoom,
  ReservationPricing,
  SPECIAL_REQUEST_OPTIONS
} from '../../types/reservation';
import { Guest } from '../../types/guest';

// Hooks
import { useCurrentHotel } from '../../services/hooks/useHotel';
import { 
  useRoomAvailability, 
  useReservationPricing, 
  useCreateMultiRoomReservation 
} from '../../services/hooks/useEnhancedReservations';

// Local interface for wizard state - allows mixed guest types
interface WizardRoomAssignment {
  roomId: string;
  guestIndexes: number[]; // Changed from guests: Guest[]
  roomSpecificNotes?: string;
  checkInStatus?: 'pending' | 'checked-in' | 'checked-out';
}

// Local wizard state interface that uses WizardRoomAssignment
interface WizardState {
  currentStep: number;
  data: Partial<MultiRoomReservation>;
  availableRooms?: AvailableRoom[];
  selectedRooms?: string[];
  roomAssignments?: WizardRoomAssignment[]; // Use the updated interface
  pricing?: ReservationPricing;
  errors?: Record<string, string>;
  isValid?: boolean;
  guests: Guest[];
  notes?: string;
  specialRequests?: string[];
  otherSpecialRequest?: string;
}

interface EnhancedReservationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (reservation: MultiRoomReservation) => void;
}

const WIZARD_STEPS = [
  'Dates',
  'Guests',
  'Rooms',
  'Assignment',
  'Pricing',
  'Guest Details',
  'Confirmation'
];

export const EnhancedReservationWizard: React.FC<EnhancedReservationWizardProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  const { data: currentHotel } = useCurrentHotel();
  const createReservationMutation = useCreateMultiRoomReservation();

  // Reset function to clear wizard state
  const resetWizard = useCallback(() => {
    setWizardState({
      currentStep: 0,
      data: {
        checkInDate: format(new Date(), 'yyyy-MM-dd'),
        checkOutDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        roomAssignments: [],
        pricing: undefined,
        status: 'confirmed',
        hotelId: currentHotel?._id || '',
        createdBy: 'staff'
      },
      availableRooms: [],
      selectedRooms: [],
      roomAssignments: [],
      errors: {},
      isValid: false,
      guests: [],
      notes: '',
      specialRequests: ['No special request'],
      otherSpecialRequest: ''
    });
    setGuestCount(2);
    setGuests([
      { name: '', email: '', phone: '', address: '' },
      { name: '', email: '', phone: '', address: '' }
    ]);
  }, [currentHotel?._id]);

  // Reset wizard when dialog opens/closes
  useEffect(() => {
    if (open) {
      console.log('🚀 EnhancedReservationWizard: Dialog opened, resetting wizard state');
      resetWizard();
    }
  }, [open, resetWizard]);

  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 0,
    data: {
      checkInDate: format(new Date(), 'yyyy-MM-dd'),
      checkOutDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      roomAssignments: [],
      pricing: undefined,
      status: 'confirmed',
      hotelId: currentHotel?._id || '',
      createdBy: 'staff'
    },
    availableRooms: [],
    selectedRooms: [],
    roomAssignments: [],
    errors: {},
    isValid: false,
    guests: [],
    notes: '',
    specialRequests: ['No special request'],
    otherSpecialRequest: ''
  });

  // Guest count state
  const [guestCount, setGuestCount] = useState(2);
  const [guests, setGuests] = useState<Partial<Guest>[]>([
    { name: '', email: '', phone: '', address: '' },
    { name: '', email: '', phone: '', address: '' }
  ]);

  // API hooks
  const availabilityQuery = useRoomAvailability({
    checkInDate: wizardState.data.checkInDate || '',
    checkOutDate: wizardState.data.checkOutDate || '',
    totalGuests: guestCount,
    hotelId: currentHotel?._id || ''
  }, !!(wizardState.data.checkInDate && wizardState.data.checkOutDate && currentHotel?._id));

  const pricingQuery = useReservationPricing({
    roomIds: wizardState.selectedRooms || [],
    checkInDate: wizardState.data.checkInDate || '',
    checkOutDate: wizardState.data.checkOutDate || '',
    guestCount,
    hotelId: currentHotel?._id || ''
  }, !!(wizardState.selectedRooms?.length && wizardState.data.checkInDate && wizardState.data.checkOutDate));

  // Update wizard state when data changes
  useEffect(() => {
    if (availabilityQuery.data) {
      console.log('🏠 EnhancedReservationWizard: Received room availability data:', {
        availableRoomsCount: availabilityQuery.data.availableRooms?.length || 0,
        availableRooms: availabilityQuery.data.availableRooms?.map(ar => ({
          roomId: ar.room._id,
          roomNumber: ar.room.number,
          roomType: ar.roomType.name,
          status: ar.room.status,
          capacity: ar.roomType.defaultCapacity
        })) || [],
        queryParams: {
          checkInDate: wizardState.data.checkInDate,
          checkOutDate: wizardState.data.checkOutDate,
          totalGuests: guestCount,
          hotelId: currentHotel?._id
        }
      });
      
      setWizardState(prev => ({
        ...prev,
        availableRooms: availabilityQuery.data.availableRooms || []
      }));
    }
  }, [availabilityQuery.data, wizardState.data.checkInDate, wizardState.data.checkOutDate, guestCount, currentHotel?._id]);

  useEffect(() => {
    if (pricingQuery.data) {
      setWizardState(prev => ({
        ...prev,
        pricing: pricingQuery.data.pricing
      }));
    }
  }, [pricingQuery.data]);

  // Step validation
  const validateCurrentStep = useCallback((): boolean => {
    const step = wizardState.currentStep;
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Dates
        if (!wizardState.data.checkInDate) {
          errors.checkInDate = 'Check-in date is required';
        }
        if (!wizardState.data.checkOutDate) {
          errors.checkOutDate = 'Check-out date is required';
        }
        if (wizardState.data.checkInDate && wizardState.data.checkOutDate) {
          const checkIn = new Date(wizardState.data.checkInDate);
          const checkOut = new Date(wizardState.data.checkOutDate);
          if (checkOut <= checkIn) {
            errors.checkOutDate = 'Check-out must be after check-in';
          }
        }
        break;

      case 1: // Guests
        if (guestCount < 1) {
          errors.guestCount = 'At least 1 guest is required';
        }
        break;

      case 2: // Rooms
        if (!wizardState.selectedRooms?.length) {
          errors.rooms = 'At least 1 room must be selected';
        }
        break;

      case 3: // Assignment
        // Validate room assignments
        const totalAssignedGuests = wizardState.roomAssignments?.reduce(
          (sum, assignment) => sum + (assignment.guestIndexes?.length || 0), 0
        ) || 0;
        if (totalAssignedGuests !== guestCount) {
          errors.assignment = 'All guests must be assigned to rooms';
        }
        break;

      case 5: // Guest Details
        const primaryGuest = guests[0];
        if (!primaryGuest?.name) {
          errors.primaryGuestName = 'Primary guest name is required';
        }
        if (!primaryGuest?.email) {
          errors.primaryGuestEmail = 'Primary guest email is required';
        }
        if (!primaryGuest?.phone) {
          errors.primaryGuestPhone = 'Primary guest phone is required';
        }
        break;
    }

    setWizardState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0
    }));

    return Object.keys(errors).length === 0;
  }, [wizardState.currentStep, wizardState.data.checkInDate, wizardState.data.checkOutDate, guestCount, wizardState.selectedRooms, wizardState.roomAssignments, guests]);

  // Navigation functions
  const handleNext = () => {
    if (validateCurrentStep()) {
      setWizardState(prev => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, WIZARD_STEPS.length - 1)
      }));
    }
  };

  const handleBack = () => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the current step
    // Do not allow jumping to future steps
    if (stepIndex <= wizardState.currentStep) {
      setWizardState(prev => ({
        ...prev,
        currentStep: stepIndex
      }));
      if (stepIndex === 2) {
        // Also force refetch if user clicks directly to Rooms step
        console.log('🔄 Forcing refetch of room availability and related data on Rooms step click');
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['guests'] });
      }
    }
  };

  // Auto-validate steps when data changes
  useEffect(() => {
    validateCurrentStep();
  }, [
    validateCurrentStep,
    wizardState.data.checkInDate, 
    wizardState.data.checkOutDate, 
    guestCount, 
    wizardState.selectedRooms, 
    wizardState.roomAssignments,
    guests
  ]);

  // Force refetch of room availability and related data on step change to 'Rooms'
  useEffect(() => {
    if (wizardState.currentStep === 2) { // Step 2: Rooms
      console.log('🔄 Forcing refetch of room availability and related data on entering Rooms step');
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    }
  }, [wizardState.currentStep, queryClient]);

  // Guest management
  const updateGuestCount = (newCount: number) => {
    setGuestCount(newCount);
    const newGuests = [...guests];
    
    if (newCount > guests.length) {
      // Add new guests
      for (let i = guests.length; i < newCount; i++) {
        newGuests.push({ name: '', email: '', phone: '', address: ''  });
      }
    } else {
      // Remove excess guests
      newGuests.splice(newCount);
    }
    
    setGuests(newGuests);
  };

  const updateGuest = (index: number, updates: Partial<Guest>) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], ...updates };
    setGuests(newGuests);
  };

  // Room selection
  const toggleRoomSelection = (roomId: string) => {
    setWizardState(prev => {
      const currentSelected = prev.selectedRooms || [];
      const isSelected = currentSelected.includes(roomId);
      
      const newSelected = isSelected
        ? currentSelected.filter(id => id !== roomId)
        : [...currentSelected, roomId];
      
      return {
        ...prev,
        selectedRooms: newSelected
      };
    });
  };

  // Assign guest to room (now takes guest index)
  const assignGuestToRoom = (guestIndex: number, roomId: string) => {
    console.log('[assignGuestToRoom] Called with guestIndex:', guestIndex, 'roomId:', roomId);
    setWizardState(prev => {
      const assignments = [...(prev.roomAssignments || [])];
      let roomAssignment = assignments.find(a => a.roomId === roomId);
      if (!roomAssignment) {
        roomAssignment = {
          roomId,
          guestIndexes: [] // Store indexes instead of Guest objects
        };
        assignments.push(roomAssignment);
      }
      if (!roomAssignment.guestIndexes.includes(guestIndex)) {
        roomAssignment.guestIndexes.push(guestIndex);
      }
      console.log('[assignGuestToRoom] Updated assignments:', assignments);
      return { ...prev, roomAssignments: assignments };
    });
  };

  // Remove guest from room (now takes guest index)
  const removeGuestFromRoom = (guestIndex: number, roomId: string) => {
    console.log('[removeGuestFromRoom] Called with guestIndex:', guestIndex, 'roomId:', roomId);
    setWizardState(prev => {
      const assignments = [...(prev.roomAssignments || [])];
      const roomAssignment = assignments.find(a => a.roomId === roomId);
      if (roomAssignment) {
        roomAssignment.guestIndexes = roomAssignment.guestIndexes.filter((idx: number) => idx !== guestIndex);
      }
      console.log('[removeGuestFromRoom] Updated assignments:', assignments);
      return { ...prev, roomAssignments: assignments };
    });
  };

  // Create reservation
  const handleCreateReservation = async () => {
    if (!validateCurrentStep()) return;

    const primaryGuest = guests[0];
    if (!primaryGuest?.name || !primaryGuest?.email || !primaryGuest?.phone) {
      enqueueSnackbar('Primary guest information is required', { variant: 'error' });
      return;
    }

    const notesToSend = wizardState.notes?.trim() || 'Created via Enhanced Wizard';
    let specialRequestsToSend = wizardState.specialRequests && wizardState.specialRequests.length > 0
      ? wizardState.specialRequests.filter(r => r !== 'Other')
      : ['No special request'];
    if ((wizardState.specialRequests || []).includes('Other') && wizardState.otherSpecialRequest?.trim()) {
      specialRequestsToSend = [...specialRequestsToSend, wizardState.otherSpecialRequest.trim()];
    }

    const reservationData: Omit<MultiRoomReservation, 'id' | 'createdAt' | 'updatedAt'> = {
      primaryGuest: {
        _id: '',
        name: primaryGuest.name,
        email: primaryGuest.email,
        phone: primaryGuest.phone,
        address: primaryGuest.address || '',
        status: 'booked',
        hotelId: currentHotel?._id || '',
        roomId: '',
        reservationStart: '',
        reservationEnd: '',
        checkIn: '',
        checkOut: '',
        keepOpen: false,
        createdAt: '',
        updatedAt: ''
      },
      roomAssignments: (wizardState.roomAssignments || [])
        .filter(assignment => assignment.roomId) // Ensure roomId exists
        .map(assignment => ({
          roomId: assignment.roomId as string, // Ensure string type
 // Type assertion to resolve compatibility
          guests: (assignment.guestIndexes || [])
            .map((guestIndex: any) => {
              // Handle both number indices and Guest objects
              if (typeof guestIndex === 'number') {
                return guests[guestIndex];
              }
              return guestIndex;
            })
            .filter(Boolean) as Guest[],
          roomSpecificNotes: '',
          checkInStatus: 'pending'
        })),
      checkInDate: wizardState.data.checkInDate || '',
      checkOutDate: wizardState.data.checkOutDate || '',
      pricing: wizardState.pricing || {
        breakdown: [],
        subtotal: 0,
        taxes: 0,
        fees: 0,
        total: 0,
        currency: 'USD'
      },
      status: 'confirmed',
      notes: notesToSend,
      specialRequests: specialRequestsToSend,
      hotelId: currentHotel?._id || '',
      createdBy: 'staff'
    };

    try {
      const newReservation = await createReservationMutation.mutateAsync(reservationData);
      enqueueSnackbar('Reservation created successfully!', { variant: 'success' });
      onSuccess?.(newReservation);
      // 🎯 CRITICAL FIX: Invalidate and refetch all related queries
      console.log('🔄 Forcing refetch of all related queries after reservation creation');
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      resetWizard();
      onClose();
    } catch (error) {
      enqueueSnackbar('Failed to create reservation', { variant: 'error' });
    }
  };

  // Calculate nights and totals
  const nights = wizardState.data.checkInDate && wizardState.data.checkOutDate
    ? differenceInDays(new Date(wizardState.data.checkOutDate), new Date(wizardState.data.checkInDate))
    : 0;

  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 0: // Dates
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Select Your Dates
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose your check-in and check-out dates
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Check-in Date"
                    value={wizardState.data.checkInDate ? new Date(wizardState.data.checkInDate) : null}
                    onChange={(date) => {
                      if (date) {
                        setWizardState(prev => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            checkInDate: format(date, 'yyyy-MM-dd')
                          }
                        }));
                      }
                    }}
                    minDate={new Date()}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!wizardState.errors?.checkInDate}
                        helperText={wizardState.errors?.checkInDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Check-out Date"
                    value={wizardState.data.checkOutDate ? new Date(wizardState.data.checkOutDate) : null}
                    onChange={(date) => {
                      if (date) {
                        setWizardState(prev => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            checkOutDate: format(date, 'yyyy-MM-dd')
                          }
                        }));
                      }
                    }}
                    minDate={wizardState.data.checkInDate ? addDays(new Date(wizardState.data.checkInDate), 1) : addDays(new Date(), 1)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!wizardState.errors?.checkOutDate}
                        helperText={wizardState.errors?.checkOutDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            {nights > 0 && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>{nights} night{nights > 1 ? 's' : ''}</strong> selected
                  {wizardState.data.checkInDate && wizardState.data.checkOutDate && (
                    <>
                      <br />
                      {format(new Date(wizardState.data.checkInDate), 'MMM dd, yyyy')} → {format(new Date(wizardState.data.checkOutDate), 'MMM dd, yyyy')}
                    </>
                  )}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 1: // Guests
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Number of Guests
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              How many guests will be staying?
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <IconButton 
                onClick={() => updateGuestCount(Math.max(1, guestCount - 1))}
                disabled={guestCount <= 1}
              >
                <Remove />
              </IconButton>
              
              <Paper sx={{ px: 3, py: 2, minWidth: 100, textAlign: 'center' }}>
                <Typography variant="h4">{guestCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Guest{guestCount > 1 ? 's' : ''}
                </Typography>
              </Paper>
              
              <IconButton 
                onClick={() => updateGuestCount(guestCount + 1)}
                disabled={guestCount >= 10}
              >
                <Add />
              </IconButton>
            </Box>

            {wizardState.errors?.guestCount && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {wizardState.errors.guestCount}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You can add detailed guest information in a later step
            </Typography>
          </Box>
        );

      case 2: // Rooms
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Available Rooms
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select rooms for your {guestCount} guest{guestCount > 1 ? 's' : ''} ({nights} night{nights > 1 ? 's' : ''})
            </Typography>

            {availabilityQuery.isLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Checking availability...
                </Typography>
              </Box>
            )}

            {availabilityQuery.data?.availableRooms && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {availabilityQuery.data.availableRooms.map((availableRoom: AvailableRoom, index: number) => {
                  const isSelected = wizardState.selectedRooms?.includes(availableRoom.room._id) || false;
                  const capacity = availableRoom.roomType.defaultCapacity || 2;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={availableRoom.room._id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: isSelected ? 2 : 1,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => toggleRoomSelection(availableRoom.room._id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6">
                              Room {availableRoom.room.number}
                            </Typography>
                            {isSelected && (
                              <CheckCircle color="primary" />
                            )}
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {availableRoom.roomType.name}
                          </Typography>
                          
                          <Chip 
                            size="small" 
                            label={`${capacity} guests max`}
                            icon={<People />}
                            sx={{ mb: 1 }}
                          />
                          
                          <Typography variant="h6" color="primary">
                            ${availableRoom.pricing.finalAmount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${availableRoom.pricing.baseRate}/night × {nights} nights
                          </Typography>
                          
                          {availableRoom.pricing.adjustments.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              + adjustments
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {wizardState.errors?.rooms && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {wizardState.errors.rooms}
              </Alert>
            )}
          </Box>
        );

      case 3: // Assignment
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Assign Guests to Rooms
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Assign each guest to a room
            </Typography>

            {wizardState.selectedRooms?.map((roomId: string) => {
              const room = wizardState.availableRooms?.find(ar => ar.room._id === roomId)?.room;
              const roomType = wizardState.availableRooms?.find(ar => ar.room._id === roomId)?.roomType;
              const roomAssignment = wizardState.roomAssignments?.find(a => a.roomId === roomId);
              const assignedGuestIndexes = roomAssignment?.guestIndexes || [];
              
              // Calculate available guest indexes (indexes not assigned to any room)
              const allAssignedIndexes = wizardState.roomAssignments?.flatMap(a => a.guestIndexes) || [];
              const availableGuestIndexes = guests
                .map((_, index) => index)
                .filter(index => !allAssignedIndexes.includes(index));

              console.log(`[AssignmentStep] Room ${roomId}:`, {
                assignedGuestIndexes,
                availableGuestIndexes,
                allAssignedIndexes
              });

              if (!room || !roomType) return null;

              return (
                <Card key={roomId} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Room {room.number} - {roomType.name}
                  </Typography>
                  
                  {/* Assigned Guests */}
                  <Typography variant="subtitle2" gutterBottom>
                    Assigned Guests ({assignedGuestIndexes.length}):
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {assignedGuestIndexes.map((guestIndex: number) => (
                      <Chip
                        key={guestIndex}
                        label={`Guest ${guestIndex + 1}`}
                        onDelete={() => removeGuestFromRoom(guestIndex, roomId)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>

                  {/* Available Guests */}
                  <Typography variant="subtitle2" gutterBottom>
                    Available Guests:
                  </Typography>
                  <Box>
                    {availableGuestIndexes.map((guestIndex: number) => (
                      <Button
                        key={guestIndex}
                        onClick={() => assignGuestToRoom(guestIndex, roomId)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Guest {guestIndex + 1}
                      </Button>
                    ))}
                  </Box>
                </Card>
              );
            })}

            {wizardState.errors?.assignment && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {wizardState.errors.assignment}
              </Alert>
            )}
          </Box>
        );

      case 4: // Pricing
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Pricing Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Review the pricing breakdown for your reservation
            </Typography>

            {pricingQuery.isLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Calculating pricing...
                </Typography>
              </Box>
            )}

            {wizardState.pricing && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Pricing Breakdown
                </Typography>

                {wizardState.pricing.breakdown.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Room {item.roomNumber} - {item.roomType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">Base Amount:</Typography>
                      <Typography variant="body2">${item.baseAmount}</Typography>
                    </Box>
                    
                    {item.adjustments.map((adj, adjIndex) => (
                      <Box key={adjIndex} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {adj.description}:
                        </Typography>
                        <Typography variant="body2" color={adj.amount >= 0 ? 'error.main' : 'success.main'}>
                          {adj.amount >= 0 ? '+' : ''}${adj.amount}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <Typography variant="body1">Room Total:</Typography>
                      <Typography variant="body1">${item.finalAmount}</Typography>
                    </Box>
                    
                    {index < (wizardState.pricing?.breakdown.length || 0) - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">${wizardState.pricing.subtotal}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Taxes:</Typography>
                  <Typography variant="body1">${wizardState.pricing.taxes}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Fees:</Typography>
                  <Typography variant="body1">${wizardState.pricing.fees}</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ${wizardState.pricing.total} {wizardState.pricing.currency}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        );

      case 5: // Guest Details
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Guest Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Provide details for all guests
            </Typography>

            <Stack spacing={3} sx={{ mt: 2 }}>
              {guests.map((guest, index) => (
                <Card key={index} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Guest {index + 1} {index === 0 && '(Primary Contact)'}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={guest.name || ''}
                        onChange={(e) => updateGuest(index, { name: e.target.value })}
                        error={index === 0 && !!wizardState.errors?.primaryGuestName}
                        helperText={index === 0 ? wizardState.errors?.primaryGuestName : ''}
                        required={index === 0}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={guest.email || ''}
                        onChange={(e) => updateGuest(index, { email: e.target.value })}
                        error={index === 0 && !!wizardState.errors?.primaryGuestEmail}
                        helperText={index === 0 ? wizardState.errors?.primaryGuestEmail : ''}
                        required={index === 0}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={guest.phone || ''}
                        onChange={(e) => updateGuest(index, { phone: e.target.value })}
                        error={index === 0 && !!wizardState.errors?.primaryGuestPhone}
                        helperText={index === 0 ? wizardState.errors?.primaryGuestPhone : ''}
                        required={index === 0}
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Stack>
          </Box>
        );

      case 6: // Confirmation
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Confirm Reservation
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Review all details before creating the reservation
            </Typography>

            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Dates Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dates
                </Typography>
                <Typography variant="body1">
                  {wizardState.data.checkInDate && format(new Date(wizardState.data.checkInDate), 'MMM dd, yyyy')} → {wizardState.data.checkOutDate && format(new Date(wizardState.data.checkOutDate), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {nights} night{nights > 1 ? 's' : ''}
                </Typography>
              </Paper>

              {/* Guests Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Guests ({guestCount})
                </Typography>
                <Typography variant="body1">
                  Primary: {guests[0]?.name || 'Not specified'}
                </Typography>
                {guestCount > 1 && (
                  <Typography variant="body2" color="text.secondary">
                    + {guestCount - 1} additional guest{guestCount > 2 ? 's' : ''}
                  </Typography>
                )}
              </Paper>

              {/* Rooms Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <Hotel sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rooms ({wizardState.selectedRooms?.length || 0})
                </Typography>
                {wizardState.selectedRooms?.map(roomId => {
                  const room = wizardState.availableRooms?.find(ar => ar.room._id === roomId)?.room;
                  const roomType = wizardState.availableRooms?.find(ar => ar.room._id === roomId)?.roomType;
                  const assignment = wizardState.roomAssignments?.find(a => a.roomId === roomId);
                  
                  return (
                    <Box key={roomId} sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        Room {room?.number} - {roomType?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assignment?.guestIndexes?.length || 0} guest{(assignment?.guestIndexes?.length || 0) > 1 ? 's' : ''} assigned
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>

              {/* Pricing Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Total Cost
                </Typography>
                <Typography variant="h4" color="primary">
                  ${wizardState.pricing?.total || 0} {wizardState.pricing?.currency || 'USD'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Includes taxes and fees
                </Typography>
              </Paper>
            </Stack>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                This reservation will be created with "Confirmed" status. You can modify details or process payment after creation.
              </Typography>
            </Alert>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Reservation Notes</Typography>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              fullWidth
              value={wizardState.notes || ''}
              onChange={e => setWizardState(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes for this reservation (optional)"
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>Special Requests</Typography>
            <TextField
              select
              SelectProps={{ multiple: true }}
              label="Special Requests"
              fullWidth
              value={wizardState.specialRequests || ['No special request']}
              onChange={e => {
                const value = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
                setWizardState(prev => ({ ...prev, specialRequests: value }));
              }}
              sx={{ mb: 2 }}
            >
              {SPECIAL_REQUEST_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            {/* If 'Other' is selected, show a text input for custom request */}
            {(wizardState.specialRequests || []).includes('Other') && (
              <TextField
                label="Other Special Request"
                fullWidth
                value={wizardState.otherSpecialRequest || ''}
                onChange={e => setWizardState(prev => ({ ...prev, otherSpecialRequest: e.target.value }))}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetWizard();
        onClose();
      }}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: isMobile ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="h6">
            New Reservation
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stepper 
            activeStep={wizardState.currentStep} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'horizontal' : 'horizontal'}
          >
            {WIZARD_STEPS.map((label, index) => {
              const isCompleted = index < wizardState.currentStep;
              const isCurrent = index === wizardState.currentStep;
              const isClickable = index <= wizardState.currentStep;
              
              return (
                <Step 
                  key={label} 
                  completed={isCompleted}
                  sx={{ 
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isClickable ? 1 : 0.5,
                    '&:hover': isClickable ? {
                      '& .MuiStepLabel-root': {
                        color: 'primary.main'
                      }
                    } : {}
                  }}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: isCurrent ? 600 : 400
                      }
                    }}
                  >
                    {!isMobile ? label : ''}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderStepContent()}
        </Box>

        {/* Footer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <Button
            onClick={handleBack}
            disabled={wizardState.currentStep === 0}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {wizardState.currentStep < WIZARD_STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!wizardState.isValid}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleCreateReservation}
                disabled={!wizardState.isValid || createReservationMutation.isPending}
                startIcon={<CheckCircle />}
              >
                {createReservationMutation.isPending ? 'Creating...' : 'Create Reservation'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 