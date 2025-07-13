import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Tooltip, IconButton, Button, Card, CardContent,
  Chip, useTheme, alpha, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Stack
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CalendarViewMonth as CalendarViewMonthIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';

interface ReservationCalendarProps {
  reservations: any[];
  rooms: any[];
  guests: any[];
  searchTerm?: string;
  onSearchResult?: (hasResults: boolean, resultCount: number) => void;
}

// Improved room color palette - darker colors for better contrast with white text
const ROOM_COLORS = [
  '#D32F2F', // Red 700
  '#1976D2', // Blue 700
  '#388E3C', // Green 700
  '#F57C00', // Orange 700
  '#7B1FA2', // Purple 700
  '#C2185B', // Pink 700
  '#00796B', // Teal 700
  '#5D4037', // Brown 700
  '#455A64', // Blue Grey 700
  '#E64A19', // Deep Orange 700
  '#303F9F', // Indigo 700
  '#689F38', // Light Green 700
  '#FBC02D', // Yellow 700 (darker yellow)
  '#0097A7', // Cyan 700
  '#8BC34A', // Light Green 500 (readable)
  '#FF5722', // Deep Orange 500
  '#9C27B0', // Purple 500
  '#FF9800', // Orange 500
  '#4CAF50', // Green 500
  '#2196F3'  // Blue 500
];

// Function to determine if a color is light or dark for text color selection
const isLightColor = (hexColor: string): boolean => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate brightness using luminance formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if light (brightness > 128)
  return brightness > 128;
};

// Function to get appropriate text color based on background
const getTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
};

const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  reservations,
  rooms,
  guests,
  searchTerm,
  onSearchResult
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Search functionality
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Filter reservations based on search term
  const filteredReservations = useMemo(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return reservations;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const matchingReservations = reservations.filter((res: any) => {
      // Search by reservation ID
      if (res._id && res._id.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by confirmation number
      if (res.confirmationNumber && res.confirmationNumber.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by guest names
      if (res.guestIds && Array.isArray(res.guestIds)) {
        const hasMatchingGuest = res.guestIds.some((gid: string) => {
          const guest = guests.find(g => g._id === gid);
          if (guest && guest.name) {
            const guestName = guest.name.toLowerCase();
            const isMatch = guestName.includes(searchLower);
            return isMatch;
          }
          return false;
        });
        if (hasMatchingGuest) return true;
      }
      
      // Search by room number
      const room = rooms.find(r => r._id === res.roomId || r._id === res.rooms);
      if (room && room.number && room.number.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by notes and special requests
      if (res.notes && res.notes.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (res.specialRequests && res.specialRequests.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    setSearchResults(matchingReservations);
    onSearchResult && onSearchResult(matchingReservations.length > 0, matchingReservations.length);
    
    return matchingReservations;
  }, [searchTerm, reservations, guests, rooms, onSearchResult]);

  // Reset search index when search term changes
  useEffect(() => {
    setCurrentSearchIndex(0);
  }, [searchTerm]);

  // Navigate to search results
  useEffect(() => {
    if (searchTerm && searchResults.length > 0) {
      // Use the current search index instead of always using the first result
      const currentResult = searchResults[currentSearchIndex] || searchResults[0];
      const checkInDate = dayjs(currentResult.checkInDate || currentResult.reservationStart);
      
      // More detailed logging for debugging
      const currentWeekStart = currentDate.startOf('week').add(1, 'day'); // Monday
      const currentWeekEnd = currentDate.endOf('week').add(1, 'day'); // Sunday
      const currentMonthStart = currentDate.startOf('month');
      const currentMonthEnd = currentDate.endOf('month');
      
      // Fix: Use proper date comparison that handles year differences
      const isInCurrentWeek = checkInDate.isSame(currentDate, 'week');
      const isInCurrentMonth = checkInDate.isSame(currentDate, 'month') && checkInDate.isSame(currentDate, 'year');
      
      // Check if navigation is needed based on current view
      const needsNavigation = viewMode === 'week' ? !isInCurrentWeek : !isInCurrentMonth;
      
      if (needsNavigation) {
        setCurrentDate(checkInDate);
      }
    }
  }, [searchTerm, searchResults, currentSearchIndex, currentDate, viewMode]);

  // Notify parent about search results
  useEffect(() => {
    if (onSearchResult) {
      onSearchResult(searchResults.length > 0, searchResults.length);
    }
  }, [searchResults, onSearchResult]);

  // Navigate between search results
  const navigateSearchResults = (direction: 'prev' | 'next') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    const targetReservation = searchResults[newIndex];
    const targetDate = dayjs(targetReservation.checkInDate || targetReservation.reservationStart);
    setCurrentDate(targetDate);
  };

  // Check if a reservation is highlighted by search
  const isSearchHighlighted = (reservation: any) => {
    const isHighlighted = searchTerm && searchResults.some(sr => sr._id === reservation._id);
    return isHighlighted;
  };

  // Generate room color mapping based on room number for consistency
  const roomColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const sortedRooms = [...rooms].sort((a, b) => a.number.localeCompare(b.number));
    sortedRooms.forEach((room, index) => {
      map[room._id] = ROOM_COLORS[index % ROOM_COLORS.length];
      map[room.number] = ROOM_COLORS[index % ROOM_COLORS.length];
    });
    return map;
  }, [rooms]);

  // Generate calendar days based on view type
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = currentDate.startOf('week');
      const endOfWeek = currentDate.endOf('week');
      const days = [];
      let current = startOfWeek;
      
      while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
        days.push(current);
        current = current.add(1, 'day');
      }
      return days;
    } else {
      // Month view - start from Monday of the first week
      const startOfMonth = currentDate.startOf('month');
      const endOfMonth = currentDate.endOf('month');
      const startOfCalendar = startOfMonth.startOf('week').add(1, 'day'); // Start from Monday
      const endOfCalendar = endOfMonth.endOf('week').add(1, 'day'); // End on Sunday
      
      const days = [];
      let current = startOfCalendar;
      
      while (current.isBefore(endOfCalendar)) {
        days.push(current);
        current = current.add(1, 'day');
      }
      return days;
    }
  }, [currentDate, viewMode]);

  // Group days into weeks for proper calendar layout
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  // Get reservations for a specific date with enhanced info
  const getReservationsForDate = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    
    // Determine which reservations to use based on search state
    let reservationsToUse;
    if (searchTerm && searchResults.length > 1 && currentSearchIndex >= 0) {
      // When navigating between multiple search results, show only the current one
      const currentResult = searchResults[currentSearchIndex];
      reservationsToUse = currentResult ? [currentResult] : filteredReservations;
    } else if (searchTerm) {
      // When searching but not navigating, show all matching results
      reservationsToUse = filteredReservations;
    } else {
      // No search, show all reservations
      reservationsToUse = reservations;
    }
    
    return reservationsToUse.filter(res => {
      const startDate = dayjs(res.reservationStart || res.checkInDate).format('YYYY-MM-DD');
      const endDate = dayjs(res.reservationEnd || res.checkOutDate).format('YYYY-MM-DD');
      return dateStr >= startDate && dateStr <= endDate;
    }).map(res => {
      const startDate = dayjs(res.reservationStart || res.checkInDate).format('YYYY-MM-DD');
      const endDate = dayjs(res.reservationEnd || res.checkOutDate).format('YYYY-MM-DD');
      return {
        ...res,
        isCheckIn: dateStr === startDate,
        isCheckOut: dateStr === endDate,
        isMiddleStay: dateStr !== startDate && dateStr !== endDate
      };
    });
  };

  // Get all reservations visible in current view for dynamic legend
  const visibleReservations = useMemo(() => {
    const allVisibleReservations = [];
    for (const day of calendarDays) {
      const dayReservations = getReservationsForDate(day);
      allVisibleReservations.push(...dayReservations);
    }
    // Remove duplicates by reservation ID
    const uniqueReservations = allVisibleReservations.filter((res, index, self) => 
      index === self.findIndex(r => r._id === res._id)
    );
    return uniqueReservations;
  }, [calendarDays, searchTerm]); // Only include what actually affects the calculation

  // Get rooms that have reservations in current view for dynamic legend
  const roomsWithReservations = useMemo(() => {
    const roomIds = new Set(visibleReservations.map(res => res.roomId || res.rooms));
    return rooms.filter(room => roomIds.has(room._id));
  }, [visibleReservations, rooms]);

  // Get guest name for a reservation
  const getGuestName = (reservation: any) => {
    if (reservation.guestIds && reservation.guestIds.length > 0) {
      const guest = guests.find(g => g._id === reservation.guestIds[0]);
      const guestName = guest?.name || 'Unknown Guest';
      if (reservation.guestIds.length > 1) {
        return `${guestName} +${reservation.guestIds.length - 1}`;
      }
      return guestName;
    }
    return 'No Guest';
  };

  // Get room number for a reservation
  const getRoomNumber = (reservation: any) => {
    const room = rooms.find(r => r._id === (reservation.roomId || reservation.rooms));
    return room?.number || 'Unknown';
  };

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const unit = viewMode === 'week' ? 'week' : 'month';
    setCurrentDate(prev => prev.add(direction === 'next' ? 1 : -1, unit));
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  // Helper functions
  const isCurrentMonth = (date: Dayjs) => date.month() === currentDate.month();
  const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');

  return (
    <Box>
      {/* Enhanced Calendar Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigateMonth('prev')}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {viewMode === 'week' 
                ? `Week of ${currentDate.startOf('week').add(1, 'day').format('MMM D')} - ${currentDate.endOf('week').add(1, 'day').format('MMM D, YYYY')}`
                : currentDate.format('MMMM YYYY')
              }
            </Typography>
            <IconButton onClick={() => navigateMonth('next')}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Search Navigation - only show when there are search results */}
            {searchTerm && searchResults.length > 0 && (
              <Box display="flex" alignItems="center" gap={1} sx={{ 
                px: 1, 
                py: 0.5, 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}>
                <SearchIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.main">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </Typography>
                {searchResults.length > 1 && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      ({currentSearchIndex + 1}/{searchResults.length})
                    </Typography>
                    <Box display="flex" gap={0.5}>
                      <IconButton 
                        size="small" 
                        onClick={() => navigateSearchResults('prev')}
                        disabled={searchResults.length <= 1}
                      >
                        <ChevronLeftIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => navigateSearchResults('next')}
                        disabled={searchResults.length <= 1}
                      >
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </>
                )}
              </Box>
            )}
            
            {/* View Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newView) => newView && setViewMode(newView)}
              size="small"
            >
              <ToggleButton value="month" aria-label="month view">
                <CalendarViewMonthIcon sx={{ mr: 0.5 }} />
                Month
              </ToggleButton>
              <ToggleButton value="week" aria-label="week view">
                <CalendarViewWeekIcon sx={{ mr: 0.5 }} />
                Week
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={goToToday}
              size="small"
            >
              Today
            </Button>
          </Box>
        </Box>
        
        {/* Quick Stats */}
        <Box display="flex" gap={2} mt={2} flexWrap="wrap">
          <Chip 
            icon={<CheckInIcon />} 
            label={`${reservations.filter(r => dayjs(r.reservationStart || r.checkInDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')).length} Check-ins Today`}
            color="primary" 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            icon={<CheckOutIcon />} 
            label={`${reservations.filter(r => dayjs(r.reservationEnd || r.checkOutDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')).length} Check-outs Today`}
            color="secondary" 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={`${reservations.length} Total Active Reservations`}
            variant="outlined" 
            size="small" 
          />
        </Box>
      </Paper>

      {/* Dynamic Room Color Legend - Only rooms with reservations in current view */}
      {roomsWithReservations.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {searchTerm ? (
              searchResults.length > 1 && currentSearchIndex >= 0 ? 
                `Search Result ${currentSearchIndex + 1} of ${searchResults.length}: ${roomsWithReservations.length} room${roomsWithReservations.length !== 1 ? 's' : ''}` :
                `Search Results: ${roomsWithReservations.length} rooms with matching reservations`
            ) : (
              `Room Legend (${roomsWithReservations.length} rooms with reservations in ${viewMode} view)`
            )}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {roomsWithReservations.map(room => {
              const backgroundColor = roomColorMap[room._id];
              const textColor = getTextColor(backgroundColor);
              
              return (
                <Chip
                  key={room._id}
                  label={`Room ${room.number}`}
                  size="small"
                  sx={{
                    backgroundColor,
                    color: textColor,
                    fontWeight: 'bold',
                    '&:hover': {
                      opacity: 0.85,
                      transform: 'scale(1.05)',
                      transition: 'all 0.2s ease',
                      filter: 'brightness(1.1)'
                    }
                  }}
                />
              );
            })}
          </Box>
          
          {/* Legend for check-in/check-out indicators */}
          <Box display="flex" gap={2} mt={1} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#4CAF50',
                  border: '3px dotted #2E7D32',
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckInIcon sx={{ fontSize: '0.8rem', color: 'white' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Check-in Day
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#FF9800',
                  border: '3px dotted #F57C00',
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckOutIcon sx={{ fontSize: '0.8rem', color: 'white' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Check-out Day
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Calendar Grid */}
      <Paper sx={{ p: 2 }}>
        {/* Day Headers */}
        <Box display="flex" mb={1}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Box key={day} flex={1} textAlign="center">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: 'text.secondary',
                  py: 1
                }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Weeks */}
        <Box display="flex" flexDirection="column" gap={1}>
          {calendarWeeks.map((week, weekIndex) => (
            <Box key={weekIndex} display="flex" gap={1}>
              {week.map(date => {
                const dayReservations = getReservationsForDate(date);
                const isCurrentMonthDay = viewMode === 'week' || isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <Box key={date.format('YYYY-MM-DD')} flex={1}>
                    <Card
                      sx={{
                        minHeight: viewMode === 'week' ? 150 : 120,
                        backgroundColor: isTodayDate 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : isCurrentMonthDay 
                            ? 'background.paper' 
                            : alpha(theme.palette.action.disabled, 0.1),
                        border: isTodayDate ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        borderColor: isTodayDate ? theme.palette.primary.main : 'divider'
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        {/* Date Number */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isTodayDate ? 'bold' : 'normal',
                            color: isCurrentMonthDay ? 'text.primary' : 'text.disabled',
                            mb: 0.5
                          }}
                        >
                          {date.format('D')}
                        </Typography>

                        {/* Enhanced Reservations Display */}
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          {dayReservations.slice(0, viewMode === 'week' ? 6 : 4).map((reservation, index) => {
                            const roomNumber = getRoomNumber(reservation);
                            const guestName = getGuestName(reservation);
                            const roomColor = roomColorMap[reservation.roomId] || roomColorMap[reservation.rooms] || '#999';
                            const textColor = getTextColor(roomColor);
                            const isHighlighted = isSearchHighlighted(reservation);

                            return (
                              <Tooltip
                                key={`${reservation._id}-${index}`}
                                title={
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      Room {roomNumber} - {guestName}
                                    </Typography>
                                    <Typography variant="body2">
                                      {dayjs(reservation.reservationStart || reservation.checkInDate).format('MMM D')} - {dayjs(reservation.reservationEnd || reservation.checkOutDate).format('MMM D')}
                                    </Typography>
                                    <Typography variant="body2">
                                      Status: {reservation.status || 'Active'}
                                    </Typography>
                                    {reservation.isCheckIn && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        ✅ Check-in Day
                                      </Typography>
                                    )}
                                    {reservation.isCheckOut && (
                                      <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                        🚪 Check-out Day
                                      </Typography>
                                    )}
                                    {isHighlighted && (
                                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        🔍 Search Result
                                      </Typography>
                                    )}
                                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                      Click for details
                                    </Typography>
                                  </Box>
                                }
                              >
                                <Box
                                  onClick={() => {
                                    setSelectedReservation(reservation);
                                    setDetailsOpen(true);
                                  }}
                                  sx={{
                                    backgroundColor: roomColor,
                                    color: textColor,
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    // Enhanced borders for better visibility
                                    border: isHighlighted
                                      ? `3px solid ${theme.palette.primary.main}`
                                      : reservation.isCheckIn 
                                        ? '3px dotted #2E7D32' 
                                        : reservation.isCheckOut 
                                          ? '3px dotted #F57C00' 
                                          : '1px solid transparent',
                                    boxShadow: isHighlighted
                                      ? `0 0 12px ${alpha(theme.palette.primary.main, 0.8)}`
                                      : reservation.isCheckIn 
                                        ? `0 0 8px ${alpha('#4CAF50', 0.6)}` 
                                        : reservation.isCheckOut 
                                          ? `0 0 8px ${alpha('#FF9800', 0.6)}` 
                                          : 'none',
                                    '&:hover': {
                                      opacity: 0.9,
                                      transform: 'scale(1.03)',
                                      filter: 'brightness(1.1)',
                                      boxShadow: isHighlighted
                                        ? `0 0 16px ${alpha(theme.palette.primary.main, 0.9)}`
                                        : reservation.isCheckIn 
                                          ? `0 0 12px ${alpha('#4CAF50', 0.8)}` 
                                          : reservation.isCheckOut 
                                            ? `0 0 12px ${alpha('#FF9800', 0.8)}` 
                                            : `0 2px 8px ${alpha(roomColor, 0.6)}`
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="inherit" sx={{ flexGrow: 1, fontSize: 'inherit' }}>
                                      {roomNumber}: {guestName.length > 6 ? `${guestName.slice(0, 6)}...` : guestName}
                                    </Typography>
                                    {reservation.isCheckIn && (
                                      <CheckInIcon sx={{ 
                                        fontSize: '0.9rem', 
                                        ml: 0.5,
                                        color: '#E8F5E8',
                                        filter: 'drop-shadow(0 0 2px #2E7D32)'
                                      }} />
                                    )}
                                    {reservation.isCheckOut && (
                                      <CheckOutIcon sx={{ 
                                        fontSize: '0.9rem', 
                                        ml: 0.5,
                                        color: '#FFF3E0',
                                        filter: 'drop-shadow(0 0 2px #F57C00)'
                                      }} />
                                    )}
                                  </Box>
                                </Box>
                              </Tooltip>
                            );
                          })}
                          
                          {/* Show count if more reservations */}
                          {dayReservations.length > (viewMode === 'week' ? 6 : 4) && (
                            <Chip
                              label={`+${dayReservations.length - (viewMode === 'week' ? 6 : 4)} more`}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                }
                              }}
                              onClick={() => {
                                console.log('Show all reservations for', date.format('YYYY-MM-DD'));
                              }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Reservation Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            Reservation Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Room {getRoomNumber(selectedReservation)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {getGuestName(selectedReservation)}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Stay Period
                </Typography>
                <Typography variant="body2">
                  <strong>Check-in:</strong> {dayjs(selectedReservation.reservationStart || selectedReservation.checkInDate).format('MMMM D, YYYY')}
                </Typography>
                <Typography variant="body2">
                  <strong>Check-out:</strong> {dayjs(selectedReservation.reservationEnd || selectedReservation.checkOutDate).format('MMMM D, YYYY')}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {dayjs(selectedReservation.reservationEnd || selectedReservation.checkOutDate).diff(dayjs(selectedReservation.reservationStart || selectedReservation.checkInDate), 'day')} nights
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Reservation Info
                </Typography>
                <Typography variant="body2">
                  <strong>Confirmation:</strong> {selectedReservation.confirmationNumber || selectedReservation._id}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedReservation.status || 'Active'}
                </Typography>
                {selectedReservation.totalAmount && (
                  <Typography variant="body2">
                    <strong>Total:</strong> ${selectedReservation.totalAmount}
                  </Typography>
                )}
              </Box>
              
              {(selectedReservation.notes || selectedReservation.specialRequests) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Information
                    </Typography>
                    {selectedReservation.notes && (
                      <Typography variant="body2">
                        <strong>Notes:</strong> {selectedReservation.notes}
                      </Typography>
                    )}
                    {selectedReservation.specialRequests && (
                      <Typography variant="body2">
                        <strong>Special Requests:</strong> {
                          Array.isArray(selectedReservation.specialRequests) 
                            ? selectedReservation.specialRequests.join(', ')
                            : selectedReservation.specialRequests
                        }
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationCalendar; 