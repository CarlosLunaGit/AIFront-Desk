import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  OutlinedInput,
} from '@mui/material';
import type { HotelConfiguration } from '../../../types/hotel';

interface SettingsStepProps {
  initialData: HotelConfiguration['settings'];
  onComplete: (settings: HotelConfiguration['settings']) => void;
}

const ROOM_NUMBERING_FORMATS = [
  { value: 'numeric', label: 'Numeric (e.g., 101, 102)' },
  { value: 'alphanumeric', label: 'Alphanumeric (e.g., A1, B2)' },
  { value: 'custom', label: 'Custom (e.g., Presidential Suite 1)' },
];

const ROOM_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'reserved', label: 'Reserved' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'MXN', label: 'Mexican Peso (MXN$)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
];

const SettingsStep: React.FC<SettingsStepProps> = ({ initialData, onComplete }) => {
  const [settings, setSettings] = useState(initialData);

  // Update local settings state when initialData changes
  useEffect(() => {
    setSettings(initialData);
  }, [initialData]);

  const handleChange = (field: keyof HotelConfiguration['settings'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    onComplete({
      ...settings,
      [field]: value,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Hotel Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the general settings for your hotel. These settings will be used throughout the system.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Room Numbering Format</InputLabel>
            <Select
              value={settings.roomNumberingFormat}
              onChange={(e) => handleChange('roomNumberingFormat', e.target.value)}
              input={<OutlinedInput label="Room Numbering Format" />}
            >
              {ROOM_NUMBERING_FORMATS.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Choose how room numbers will be displayed in the system
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Default Room Status</InputLabel>
            <Select
              value={settings.defaultStatus}
              onChange={(e) => handleChange('defaultStatus', e.target.value)}
              input={<OutlinedInput label="Default Room Status" />}
            >
              {ROOM_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              The default status for new rooms
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Currency</InputLabel>
            <Select
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              input={<OutlinedInput label="Currency" />}
            >
              {CURRENCIES.map((currency) => (
                <MenuItem key={currency.value} value={currency.value}>
                  {currency.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              The currency used for all monetary values
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              input={<OutlinedInput label="Timezone" />}
            >
              {TIMEZONES.map((tz) => (
                <MenuItem key={tz.value} value={tz.value}>
                  {tz.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              The timezone for your hotel
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="time"
            label="Check-in Time"
            value={settings.checkInTime}
            onChange={(e) => handleChange('checkInTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }} // 5 minutes
            helperText="Standard check-in time for guests"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="time"
            label="Check-out Time"
            value={settings.checkOutTime}
            onChange={(e) => handleChange('checkOutTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }} // 5 minutes
            helperText="Standard check-out time for guests"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsStep; 