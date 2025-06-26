import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Box,
  Typography,
} from '@mui/material';
import type { RoomFilter, RoomStatus, RoomFeature } from '../../types/room';
import type { RoomType } from '../../services/hooks/useRoomTypes';

interface RoomFiltersProps {
  filter: RoomFilter;
  onFilterChange: (filter: Partial<RoomFilter>) => void;
  roomTypes?: RoomType[];
}

const ROOM_STATUSES: RoomStatus[] = ['available', 'occupied', 'maintenance', 'cleaning', 'reserved'];
const ROOM_FEATURES: RoomFeature[] = ['wifi', 'minibar', 'balcony', 'ocean-view', 'jacuzzi', 'king-bed'];
const FLOORS = [1, 2, 3, 4, 5];

const RoomFilters: React.FC<RoomFiltersProps> = ({ filter, onFilterChange, roomTypes = [] }) => {
  const handleStatusChange = (event: any) => {
    onFilterChange({ status: event.target.value });
  };

  const handleTypeChange = (event: any) => {
    onFilterChange({ typeId: event.target.value });
  };

  const handleFloorChange = (event: any) => {
    onFilterChange({ floor: event.target.value });
  };

  const handleFeatureChange = (event: any) => {
    onFilterChange({ features: event.target.value });
  };

  const handleCapacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ minCapacity: Number(event.target.value) });
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ maxRate: Number(event.target.value) });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filter.status || []}
            onChange={handleStatusChange}
            input={<OutlinedInput label="Status" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value.charAt(0).toUpperCase() + value.slice(1)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {ROOM_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Room Type</InputLabel>
          <Select
            multiple
            value={filter.typeId || []}
            onChange={handleTypeChange}
            input={<OutlinedInput label="Room Type" />}
            renderValue={(selected: string[]) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value.charAt(0).toUpperCase() + value.slice(1)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {roomTypes.map((type) => (
              <MenuItem key={type._id} value={type._id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Floor</InputLabel>
          <Select
            multiple
            value={filter.floor || []}
            onChange={handleFloorChange}
            input={<OutlinedInput label="Floor" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={`Floor ${value}`}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {FLOORS.map((floor) => (
              <MenuItem key={floor} value={floor}>
                Floor {floor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Features</InputLabel>
          <Select
            multiple
            value={filter.features || []}
            onChange={handleFeatureChange}
            input={<OutlinedInput label="Features" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value.replace('-', ' ')}
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {ROOM_FEATURES.map((feature) => (
              <MenuItem key={feature} value={feature}>
                {feature.replace('-', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth>
          <InputLabel>Min Capacity</InputLabel>
          <Select
            value={filter.minCapacity || ''}
            onChange={(e) => onFilterChange({ minCapacity: Number(e.target.value) })}
            input={<OutlinedInput label="Min Capacity" />}
          >
            {[1, 2, 3, 4, 5, 6].map((capacity) => (
              <MenuItem key={capacity} value={capacity}>
                {capacity} {capacity === 1 ? 'person' : 'persons'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl fullWidth>
          <InputLabel>Max Rate</InputLabel>
          <Select
            value={filter.maxRate || ''}
            onChange={(e) => onFilterChange({ maxRate: Number(e.target.value) })}
            input={<OutlinedInput label="Max Rate" />}
          >
            {[100, 200, 300, 400, 500, 1000].map((rate) => (
              <MenuItem key={rate} value={rate}>
                ${rate}/night
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default RoomFilters; 