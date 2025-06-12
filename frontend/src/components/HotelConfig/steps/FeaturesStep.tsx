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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ListSubheader,
  Link,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, OpenInNew as OpenInNewIcon, Search as SearchIcon } from '@mui/icons-material';
import type { HotelFeature } from '../../../types/hotel';

interface FeaturesStepProps {
  initialData: Omit<HotelFeature, 'id'>[];
  onComplete: (features: Omit<HotelFeature, 'id'>[]) => void;
}

interface FeatureFormData {
  name: string;
  description: string;
  icon: string;
  type: 'feature' | 'amenity';
  category: 'room' | 'common' | 'service';
}

// Common icon suggestions grouped by category
const COMMON_ICONS = {
  'Room Features': [
    { name: 'balcony', label: 'Balcony' },
    { name: 'king_bed', label: 'King Bed' },
    { name: 'single_bed', label: 'Single Bed' },
    { name: 'air', label: 'Air Conditioning' },
    { name: 'tv', label: 'TV' },
    { name: 'desk', label: 'Desk' },
    { name: 'chair', label: 'Chair' },
    { name: 'table_bar', label: 'Table' },
  ],
  'Amenities': [
    { name: 'local_bar', label: 'Minibar' },
    { name: 'coffee', label: 'Coffee Maker' },
    { name: 'room_service', label: 'Room Service' },
    { name: 'cleaning_services', label: 'Housekeeping' },
    { name: 'spa', label: 'Spa' },
    { name: 'hot_tub', label: 'Hot Tub' },
    { name: 'fitness_center', label: 'Fitness Center' },
    { name: 'pool', label: 'Swimming Pool' },
  ],
  'Common Areas': [
    { name: 'restaurant', label: 'Restaurant' },
    { name: 'local_cafe', label: 'Cafe' },
    { name: 'meeting_room', label: 'Meeting Room' },
    { name: 'business_center', label: 'Business Center' },
    { name: 'elevator', label: 'Elevator' },
    { name: 'stairs', label: 'Stairs' },
    { name: 'parking', label: 'Parking' },
    { name: 'luggage', label: 'Luggage Storage' },
  ],
  'Services': [
    { name: 'wifi', label: 'WiFi' },
    { name: 'concierge', label: 'Concierge' },
    { name: 'security', label: 'Security' },
    { name: 'medical_services', label: 'Medical Services' },
    { name: 'child_care', label: 'Child Care' },
    { name: 'dry_cleaning', label: 'Dry Cleaning' },
    { name: 'shopping_bag', label: 'Shopping' },
    { name: 'local_taxi', label: 'Taxi Service' },
  ],
  'Views & Location': [
    { name: 'visibility', label: 'View' },
    { name: 'beach_access', label: 'Beach Access' },
    { name: 'landscape', label: 'Landscape' },
    { name: 'terrace', label: 'Terrace' },
    { name: 'garden', label: 'Garden' },
    { name: 'location_city', label: 'City View' },
    { name: 'waves', label: 'Ocean View' },
    { name: 'park', label: 'Park View' },
  ]
};

const FeaturesStep: React.FC<FeaturesStepProps> = ({ initialData, onComplete }) => {
  const [features, setFeatures] = useState<Omit<HotelFeature, 'id'>[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<FeatureFormData>({
    name: '',
    description: '',
    icon: '',
    type: 'feature',
    category: 'common'
  });
  const [iconSearch, setIconSearch] = useState('');

  // Update local features state when initialData changes
  useEffect(() => {
    setFeatures(initialData);
  }, [initialData]);

  // Filter icons based on search
  const filteredIcons = Object.entries(COMMON_ICONS).reduce((acc, [category, icons]) => {
    const filtered = icons.filter(icon => 
      icon.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
      icon.label.toLowerCase().includes(iconSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof COMMON_ICONS[keyof typeof COMMON_ICONS]>);

  const handleOpenDialog = (index?: number) => {
    if (typeof index === 'number') {
      const feature = features[index];
      setEditingIndex(index);
      setFormData({
        name: feature.name,
        description: feature.description || '',
        icon: feature.icon || '',
        type: feature.type,
        category: feature.category || 'common'
      });
    } else {
      setEditingIndex(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
        type: 'feature',
        category: 'common'
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setFormData({ name: '', description: '', icon: '', type: 'feature', category: 'common' });
  };

  const handleSaveFeature = () => {
    if (!formData.name) return;

    const newFeature: Omit<HotelFeature, 'id'> = {
      name: formData.name,
      description: formData.description || undefined,
      icon: formData.icon || undefined,
      type: formData.type,
      category: formData.category
    };

    let newFeatures: Omit<HotelFeature, 'id'>[];
    if (typeof editingIndex === 'number') {
      newFeatures = [...features];
      newFeatures[editingIndex] = newFeature;
    } else {
      newFeatures = [...features, newFeature];
    }
    setFeatures(newFeatures);
    onComplete(newFeatures);
    handleCloseDialog();
  };

  const handleDeleteFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    onComplete(newFeatures);
  };

  const handleIconSelect = (iconName: string) => {
    setFormData({ ...formData, icon: iconName });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Features & Amenities
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define the features and amenities available in your hotel. These can be used to describe rooms and common areas.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Feature
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper>
            <List>
              {features.map((feature, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={feature.name}
                    secondary={feature.description}
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
                      onClick={() => handleDeleteFeature(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {features.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No features added yet"
                    secondary="Click 'Add Feature' to get started"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Feature' : 'Add Feature'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Icon</InputLabel>
              <Select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                label="Icon"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selected && <span className="material-icons">{selected}</span>}
                    <Typography>{selected || 'Select an icon'}</Typography>
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 400 }
                  }
                }}
              >
                <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search icons..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </Box>
                {Object.entries(filteredIcons).map(([category, icons]) => [
                  <ListSubheader key={category}>{category}</ListSubheader>,
                  ...icons.map((icon) => (
                    <MenuItem key={icon.name} value={icon.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span className="material-icons">{icon.name}</span>
                        <Typography>{icon.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))
                ])}
                {Object.keys(filteredIcons).length === 0 && (
                  <MenuItem disabled>
                    <Typography color="text.secondary">No icons found</Typography>
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>
                Select a Material Icon to represent this feature. 
                <Link
                  href="https://fonts.google.com/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}
                >
                  Browse all icons
                  <OpenInNewIcon sx={{ fontSize: 16, ml: 0.5 }} />
                </Link>
              </FormHelperText>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'feature' | 'amenity' })}
                label="Type"
              >
                <MenuItem value="feature">Feature (Structural)</MenuItem>
                <MenuItem value="amenity">Amenity (Service/Item)</MenuItem>
              </Select>
              <FormHelperText>
                Features are structural elements, while amenities are provided services or items
              </FormHelperText>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'room' | 'common' | 'service' })}
                label="Category"
              >
                <MenuItem value="room">Room-specific</MenuItem>
                <MenuItem value="common">Common Area</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
              <FormHelperText>
                Where this feature or amenity is available
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveFeature}
            variant="contained"
            disabled={!formData.name}
          >
            {editingIndex !== null ? 'Save Changes' : 'Add Feature'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeaturesStep; 