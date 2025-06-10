import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import type { HotelConfigFormData } from '../../../types/hotel';

interface BasicInfoStepProps {
  initialData: Partial<HotelConfigFormData>;
  onComplete: (data: Partial<HotelConfigFormData>) => void;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  [key: string]: string | undefined;
}

const defaultContactInfo = { phone: '', email: '', website: '' };
const defaultFormData = {
  name: '',
  description: '',
  address: '',
  contactInfo: defaultContactInfo,
};

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ initialData, onComplete }) => {
  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    ...initialData,
    contactInfo: { ...defaultContactInfo, ...initialData.contactInfo },
  });

  // Update local form state when initialData changes
  useEffect(() => {
    setFormData({
      ...defaultFormData,
      ...initialData,
      contactInfo: { ...defaultContactInfo, ...initialData.contactInfo },
    });
  }, [initialData]);

  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validateField = (name: string, value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    
    switch (name) {
      case 'name':
        return !value ? 'Hotel name is required' : undefined;
      case 'email':
        if (!value) return undefined; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Invalid email format' : undefined;
      case 'phone':
        if (!value) return undefined; // Phone is optional
        const phoneRegex = /^\+?[\d\s-()]+$/;
        return !phoneRegex.test(value) ? 'Invalid phone format' : undefined;
      case 'website':
        if (!value) return undefined; // Website is optional
        try {
          new URL(value);
          return undefined;
        } catch {
          return 'Invalid website URL';
        }
      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof FormData | 'contactInfo.phone' | 'contactInfo.email' | 'contactInfo.website', value: string) => {
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate field
    const fieldName = field.split('.').pop() || field;
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));

    // Update form data
    let newFormData: FormData;
    if (field.startsWith('contactInfo.')) {
      const contactField = field.split('.')[1] as keyof FormData['contactInfo'];
      newFormData = {
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          [contactField]: value,
        },
      };
    } else {
      newFormData = {
        ...formData,
        [field]: value,
      };
    }
    setFormData(newFormData);

    // Update parent with current form data
    onComplete(newFormData);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: ValidationErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'contactInfo') {
        Object.entries(value).forEach(([contactKey, contactValue]) => {
          const error = validateField(contactKey, contactValue);
          if (error) newErrors[contactKey] = error;
        });
      } else {
        const error = validateField(key, value);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys({ ...formData, ...formData.contactInfo }).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    // If no errors, submit
    if (Object.keys(newErrors).length === 0) {
      onComplete(formData);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const isNameValid = !errors.name && touched.name !== undefined;

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please provide the basic information about your hotel. Fields marked with * are required.
        </Typography>

        {hasErrors && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Please fix the errors in the form before proceeding.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Hotel Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="Describe your hotel..."
              helperText="Provide a brief description of your hotel's unique features and amenities"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Full address of your hotel"
              helperText="Enter the complete address including street, city, state, and country"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.contactInfo.phone}
              onChange={(e) => handleChange('contactInfo.phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              error={touched.phone && !!errors.phone}
              helperText={touched.phone && errors.phone}
              placeholder="+1 (555) 123-4567"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleChange('contactInfo.email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
              placeholder="contact@yourhotel.com"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Website"
              value={formData.contactInfo.website}
              onChange={(e) => handleChange('contactInfo.website', e.target.value)}
              onBlur={() => handleBlur('website')}
              error={touched.website && !!errors.website}
              helperText={touched.website && errors.website}
              placeholder="https://www.yourhotel.com"
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default BasicInfoStep; 