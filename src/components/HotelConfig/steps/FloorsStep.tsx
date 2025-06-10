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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Floor } from '../../../types/hotel';

interface FloorsStepProps {
  initialData: Omit<Floor, 'id'>[];
  onComplete: (floors: Omit<Floor, 'id'>[]) => void;
}

interface FloorFormData {
  name: string;
  number: number;
  description: string;
  isActive: boolean;
}

const FloorsStep: React.FC<FloorsStepProps> = ({ initialData, onComplete }) => {
  const [floors, setFloors] = useState<Omit<Floor, 'id'>[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<FloorFormData>({
    name: '',
    number: 1,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    setFloors(initialData);
  }, [initialData]);

  const handleOpenDialog = (index?: number) => {
    if (typeof index === 'number') {
      const floor = floors[index];
      setEditingIndex(index);
      setFormData({
        name: floor.name,
        number: floor.number,
        description: floor.description || '',
        isActive: floor.isActive,
      });
    } else {
      setEditingIndex(null);
      setFormData({
        name: '',
        number: Math.max(...floors.map(f => f.number), 0) + 1,
        description: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      number: 1,
      description: '',
      isActive: true,
    });
  };

  const handleSaveFloor = () => {
    if (!formData.name) return;

    const newFloor: Omit<Floor, 'id'> = {
      name: formData.name,
      number: formData.number,
      description: formData.description || undefined,
      isActive: formData.isActive,
    };

    let newFloors: Omit<Floor, 'id'>[];
    if (typeof editingIndex === 'number') {
      newFloors = [...floors];
      newFloors[editingIndex] = newFloor;
    } else {
      newFloors = [...floors, newFloor].sort((a, b) => a.number - b.number);
    }
    setFloors(newFloors);
    onComplete(newFloors);
    handleCloseDialog();
  };

  const handleDeleteFloor = (index: number) => {
    const newFloors = floors.filter((_, i) => i !== index);
    setFloors(newFloors);
    onComplete(newFloors);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Floors
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define the floors in your hotel. You can add, edit, or remove floors as needed.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Floor
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper>
            <List>
              {floors.map((floor, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${floor.name} (Floor ${floor.number})`}
                    secondary={
                      <>
                        {floor.description}
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color={floor.isActive ? 'success.main' : 'text.secondary'}
                        >
                          {floor.isActive ? 'Active' : 'Inactive'}
                        </Typography>
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
                      onClick={() => handleDeleteFloor(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {floors.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No floors added yet"
                    secondary="Click 'Add Floor' to get started"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Floor' : 'Add New Floor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              required
              label="Floor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Ground Floor, First Floor, etc."
            />
            <TextField
              fullWidth
              required
              type="number"
              label="Floor Number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
              sx={{ mb: 2 }}
              inputProps={{ min: -10, max: 200 }}
              helperText="Use negative numbers for basement floors"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
              placeholder="Describe this floor..."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveFloor}
            variant="contained"
            disabled={!formData.name}
          >
            {editingIndex !== null ? 'Save Changes' : 'Add Floor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FloorsStep; 