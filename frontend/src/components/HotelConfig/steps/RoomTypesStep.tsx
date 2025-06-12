import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RoomType, HotelFeature } from '../../../types/hotel';

interface RoomTypesStepProps {
  initialData: Omit<RoomType, 'id'>[];
  features: Omit<HotelFeature, 'id'>[];
  onComplete: (roomTypes: Omit<RoomType, 'id'>[]) => void;
}

interface RoomTypeFormData {
  name: string;
  description: string;
  baseRate: number;
  defaultCapacity: number;
  features: string[];
  amenities: string[];
}

const RoomTypesStep: React.FC<RoomTypesStepProps> = ({ initialData, features, onComplete }) => {
  const [roomTypes, setRoomTypes] = useState<Omit<RoomType, 'id'>[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomTypeFormData>({
    name: '',
    description: '',
    baseRate: 0,
    defaultCapacity: 2,
    features: [],
    amenities: [],
  });

  // Update local roomTypes state when initialData changes
  useEffect(() => {
    setRoomTypes(initialData);
  }, [initialData]);

  // Filter features and amenities
  const structuralFeatures = features.filter(f => f.type === 'feature');
  const amenities = features.filter(f => f.type === 'amenity');

  const handleOpenDialog = (index?: number) => {
    if (typeof index === 'number') {
      const roomType = roomTypes[index];
      setEditingIndex(index);
      setFormData({
        name: roomType.name,
        description: roomType.description || '',
        baseRate: roomType.baseRate,
        defaultCapacity: roomType.defaultCapacity,
        features: roomType.features,
        amenities: roomType.amenities,
      });
    } else {
      setEditingIndex(null);
      setFormData({
        name: '',
        description: '',
        baseRate: 0,
        defaultCapacity: 2,
        features: [],
        amenities: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      description: '',
      baseRate: 0,
      defaultCapacity: 2,
      features: [],
      amenities: [],
    });
  };

  const handleSaveRoomType = () => {
    if (!formData.name) return;

    const newRoomType: Omit<RoomType, 'id'> = {
      name: formData.name,
      description: formData.description || undefined,
      baseRate: formData.baseRate,
      defaultCapacity: formData.defaultCapacity,
      features: formData.features,
      amenities: formData.amenities,
    };

    let newRoomTypes: Omit<RoomType, 'id'>[];
    if (typeof editingIndex === 'number') {
      newRoomTypes = [...roomTypes];
      newRoomTypes[editingIndex] = newRoomType;
    } else {
      newRoomTypes = [...roomTypes, newRoomType];
    }
    setRoomTypes(newRoomTypes);
    onComplete(newRoomTypes);
    handleCloseDialog();
  };

  const handleDeleteRoomType = (index: number) => {
    const newRoomTypes = roomTypes.filter((_, i) => i !== index);
    setRoomTypes(newRoomTypes);
    onComplete(newRoomTypes);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Room Types
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define the different types of rooms available in your hotel. Each room type can have its own features, amenities, and pricing.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Room Type
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper>
            <List>
              {roomTypes.map((roomType, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={roomType.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          ${roomType.baseRate}/night • {roomType.defaultCapacity} {roomType.defaultCapacity === 1 ? 'person' : 'persons'}
                        </Typography>
                        <br />
                        {roomType.description}
                        <Box sx={{ mt: 1 }}>
                          {roomType.features.map((featureId) => {
                            const feature = features.find((f) => f.name === featureId);
                            return feature ? (
                              <Chip
                                key={featureId}
                                label={feature.name}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ) : null;
                          })}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(index)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteRoomType(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {roomTypes.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No room types added yet"
                    secondary="Click 'Add Room Type' to get started"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Room Type' : 'Add Room Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              required
              label="Room Type Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Base Rate"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Default Capacity"
                  value={formData.defaultCapacity}
                  onChange={(e) => setFormData({ ...formData, defaultCapacity: Number(e.target.value) })}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Features</InputLabel>
              <Select
                multiple
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value as string[] })}
                input={<OutlinedInput label="Features" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const feature = structuralFeatures.find((f) => f.name === value);
                      return feature ? (
                        <Chip 
                          key={value} 
                          label={feature.name} 
                          size="small"
                          icon={feature.icon ? <span className="material-icons">{feature.icon}</span> : undefined}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {structuralFeatures.map((feature) => (
                  <MenuItem key={feature.name} value={feature.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {feature.icon && <span className="material-icons">{feature.icon}</span>}
                      <Box>
                        <Typography variant="body1">{feature.name}</Typography>
                        {feature.description && (
                          <Typography variant="caption" color="text.secondary">
                            {feature.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select structural features of the room (e.g., balcony, ocean view)
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Amenities</InputLabel>
              <Select
                multiple
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value as string[] })}
                input={<OutlinedInput label="Amenities" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const amenity = amenities.find((a) => a.name === value);
                      return amenity ? (
                        <Chip 
                          key={value} 
                          label={amenity.name} 
                          size="small"
                          icon={amenity.icon ? <span className="material-icons">{amenity.icon}</span> : undefined}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {amenities.map((amenity) => (
                  <MenuItem key={amenity.name} value={amenity.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {amenity.icon && <span className="material-icons">{amenity.icon}</span>}
                      <Box>
                        <Typography variant="body1">{amenity.name}</Typography>
                        {amenity.description && (
                          <Typography variant="caption" color="text.secondary">
                            {amenity.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select provided amenities and services (e.g., minibar, room service)
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveRoomType}
            variant="contained"
            disabled={!formData.name || formData.baseRate <= 0 || formData.defaultCapacity < 1}
          >
            {editingIndex !== null ? 'Save Changes' : 'Add Room Type'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomTypesStep; 