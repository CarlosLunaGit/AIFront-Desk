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
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RoomTemplate, Floor, HotelFeature } from '../../../types/hotel';
import { RoomType } from '../../../types/room';

interface RoomTemplatesStepProps {
  initialData: Omit<RoomTemplate, 'id'>[];
  roomTypes: Omit<RoomType, '_id'>[];
  floors: Omit<Floor, 'id'>[];
  features: Omit<HotelFeature, 'id'>[];
  onComplete: (roomTemplates: Omit<RoomTemplate, 'id'>[]) => void;
}

interface RoomTemplateFormData {
  typeId: string;
  floorId: string;
  name: string;
  capacity: number;
  features: string[];
  rate: number;
  notes: string;
}

const RoomTemplatesStep: React.FC<RoomTemplatesStepProps> = ({
  initialData,
  roomTypes,
  floors,
  features,
  onComplete,
}) => {
  const [roomTemplates, setRoomTemplates] = useState<Omit<RoomTemplate, 'id'>[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomTemplateFormData>({
    typeId: '',
    floorId: '',
    name: '',
    capacity: 2,
    features: [],
    rate: 0,
    notes: '',
  });

  useEffect(() => {
    setRoomTemplates(initialData);
  }, [initialData]);

  const handleOpenDialog = (index?: number) => {
    if (typeof index === 'number') {
      const template = roomTemplates[index];
      setEditingIndex(index);
      setFormData({
        typeId: template.typeId,
        floorId: template.floorId,
        name: template.name,
        capacity: template.capacity,
        features: template.features,
        rate: template.rate,
        notes: template.notes || '',
      });
    } else {
      setEditingIndex(null);
      setFormData({
        typeId: '',
        floorId: '',
        name: '',
        capacity: 2,
        features: [],
        rate: 0,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setFormData({
      typeId: '',
      floorId: '',
      name: '',
      capacity: 2,
      features: [],
      rate: 0,
      notes: '',
    });
  };

  const handleSaveTemplate = () => {
    if (!formData.typeId || !formData.floorId || !formData.name) return;

    const selectedRoomType = roomTypes.find(rt => rt.name === formData.typeId);
    if (!selectedRoomType) return;

    const newTemplate: Omit<RoomTemplate, 'id'> = {
      typeId: formData.typeId,
      floorId: formData.floorId,
      name: formData.name,
      capacity: formData.capacity,
      features: formData.features,
      rate: formData.rate || selectedRoomType.baseRate,
      notes: formData.notes || undefined,
    };

    let newTemplates: Omit<RoomTemplate, 'id'>[];
    if (typeof editingIndex === 'number') {
      newTemplates = [...roomTemplates];
      newTemplates[editingIndex] = newTemplate;
    } else {
      newTemplates = [...roomTemplates, newTemplate];
    }
    setRoomTemplates(newTemplates);
    onComplete(newTemplates);
    handleCloseDialog();
  };

  const handleDeleteTemplate = (index: number) => {
    const newTemplates = roomTemplates.filter((_, i) => i !== index);
    setRoomTemplates(newTemplates);
    onComplete(newTemplates);
  };

  const getRoomTypeInfo = (typeId: string) => {
    return roomTypes.find(rt => rt.name === typeId);
  };

  const getFloorInfo = (floorId: string) => {
    return floors.find(f => f.name === floorId);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Room Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define individual room templates based on your room types and floors. Each template represents a specific room in your hotel.
      </Typography>

      {roomTypes.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please add at least one room type before creating room templates.
        </Alert>
      )}

      {floors.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please add at least one floor before creating room templates.
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={roomTypes.length === 0 || floors.length === 0}
        >
          Add Room Template
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper>
            <List>
              {roomTemplates.map((template, index) => {
                const roomType = getRoomTypeInfo(template.typeId);
                const floor = getFloorInfo(template.floorId);
                return (
                  <ListItem key={index}>
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {roomType?.name} • Floor {floor?.number} • ${template.rate}/night • {template.capacity} {template.capacity === 1 ? 'person' : 'persons'}
                          </Typography>
                          <br />
                          {template.notes}
                          <Box sx={{ mt: 1 }}>
                            {template.features.map((featureId) => {
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
                        onClick={() => handleDeleteTemplate(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
              {roomTemplates.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No room templates added yet"
                    secondary="Click 'Add Room Template' to get started"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Room Template' : 'Add New Room Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Room Type</InputLabel>
              <Select
                value={formData.typeId}
                onChange={(e) => {
                  const typeId = e.target.value;
                  const roomType = roomTypes.find(rt => rt.name === typeId);
                  setFormData({
                    ...formData,
                    typeId,
                    capacity: roomType?.defaultCapacity || formData.capacity,
                    rate: roomType?.baseRate || formData.rate,
                  });
                }}
                input={<OutlinedInput label="Room Type" />}
              >
                {roomTypes.map((type) => (
                  <MenuItem key={type.name} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Floor</InputLabel>
              <Select
                value={formData.floorId}
                onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                input={<OutlinedInput label="Floor" />}
              >
                {floors.map((floor) => (
                  <MenuItem key={floor.name} value={floor.name}>
                    {floor.name} (Floor {floor.number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Room Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Presidential Suite 1"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rate"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Leave empty to use room type base rate"
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Additional Features</InputLabel>
              <Select
                multiple
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value as string[] })}
                input={<OutlinedInput label="Additional Features" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const feature = features.find((f) => f.name === value);
                      return feature ? (
                        <Chip key={value} label={feature.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {features.map((feature) => (
                  <MenuItem key={feature.name} value={feature.name}>
                    {feature.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
              placeholder="Add any special notes about this room..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!formData.typeId || !formData.floorId || !formData.name}
          >
            {editingIndex !== null ? 'Save Changes' : 'Add Room Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomTemplatesStep; 