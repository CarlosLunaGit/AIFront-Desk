import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Alert,
  Paper,
  Autocomplete,
} from '@mui/material';
import type { HotelConfigFormData } from '../../../types/hotel';

interface BasicInfoStepProps {
  initialData: Partial<HotelConfigFormData>;
  onComplete: (data: Partial<HotelConfigFormData>) => void;
}

interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface FormData {
  name: string;
  description: string;
  address: AddressData;
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
  street?: string;
  city?: string;
  zipCode?: string;
  [key: string]: string | undefined;
}

// Common countries for the dropdown
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Japan',
  'South Korea',
  'Singapore',
  'Mexico',
  'Brazil',
  'Argentina',
  'India',
  'China',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Philippines',
  'Malaysia',
  'New Zealand',
  'South Africa',
  'Egypt',
  'Morocco',
  'Turkey',
  'Greece',
  'Portugal',
  'Ireland',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Croatia',
  'Slovenia',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Russia',
  'Ukraine',
  'Chile',
  'Colombia',
  'Peru',
  'Ecuador',
  'Costa Rica',
  'Panama',
  'Jamaica',
  'Bahamas',
  'Barbados',
  'Trinidad and Tobago',
  'Dominican Republic',
  'Puerto Rico',
  'Other'
].sort();

const defaultContactInfo = { phone: '', email: '', website: '' };
const defaultAddress = { street: '', city: '', state: '', zipCode: '', country: '' };
const defaultFormData = {
  name: '',
  description: '',
  address: defaultAddress,
  contactInfo: defaultContactInfo,
};

// Helper function to parse address string into object
const parseAddressString = (addressString: string): AddressData => {
  const parts = addressString.split(',').map(part => part.trim());
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2]?.split(' ')[0] || '',
    zipCode: parts[2]?.split(' ').slice(1).join(' ') || '',
    country: parts[3] || ''
  };
};



const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ initialData, onComplete }) => {
  const [formData, setFormData] = useState<FormData>(() => {
    // Handle both old string address format and new object format
    const initialAddress = initialData.address;
    let addressData: AddressData;
    
    if (typeof initialAddress === 'string') {
      // Legacy string format - parse it
      addressData = parseAddressString(initialAddress);
    } else if (initialAddress && typeof initialAddress === 'object') {
      // New object format
      addressData = { ...defaultAddress, ...initialAddress };
    } else {
      // No address data
      addressData = defaultAddress;
    }

    return {
      ...defaultFormData,
      ...initialData,
      address: addressData,
      contactInfo: { ...defaultContactInfo, ...initialData.contactInfo },
    };
  });

  // Update local form state when initialData changes
  useEffect(() => {
    const initialAddress = initialData.address;
    let addressData: AddressData;
    
    if (typeof initialAddress === 'string') {
      addressData = parseAddressString(initialAddress);
    } else if (initialAddress && typeof initialAddress === 'object') {
      addressData = { ...defaultAddress, ...initialAddress };
    } else {
      addressData = defaultAddress;
    }

    setFormData({
      ...defaultFormData,
      ...initialData,
      address: addressData,
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
      case 'street':
        if (!value) return undefined; // Optional but helpful validation
        return value.length < 5 ? 'Please enter a complete street address' : undefined;
      case 'city':
        if (!value) return undefined; // Optional
        return value.length < 2 ? 'Please enter a valid city name' : undefined;
      case 'zipCode':
        if (!value) return undefined; // Optional
        // Basic zip code validation (supports various formats)
        const zipRegex = /^[\d\w\s-]{3,10}$/;
        return !zipRegex.test(value) ? 'Please enter a valid postal/ZIP code' : undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (field: string, value: string) => {
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
    } else if (field.startsWith('address.')) {
      const addressField = field.split('.')[1] as keyof AddressData;
      newFormData = {
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      };
    } else {
      newFormData = {
        ...formData,
        [field]: value,
      };
    }
    setFormData(newFormData);

    // Prepare data for parent (use address object format)
    const outputData: Partial<HotelConfigFormData> = {
      name: newFormData.name,
      description: newFormData.description,
      address: newFormData.address,
      contactInfo: newFormData.contactInfo,
    };

    // Update parent with current form data
    onComplete(outputData);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: ValidationErrors = {};
    
    // Validate top-level fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'contactInfo') {
        Object.entries(value).forEach(([contactKey, contactValue]) => {
          const error = validateField(contactKey, contactValue);
          if (error) newErrors[contactKey] = error;
        });
      } else if (key === 'address') {
        Object.entries(value).forEach(([addressKey, addressValue]) => {
          const error = validateField(addressKey, addressValue);
          if (error) newErrors[addressKey] = error;
        });
      } else {
        const error = validateField(key, value);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys({ ...formData, ...formData.contactInfo, ...formData.address }).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    // If no errors, submit
    if (Object.keys(newErrors).length === 0) {
      const outputData: Partial<HotelConfigFormData> = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        contactInfo: formData.contactInfo,
      };
      onComplete(outputData);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

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

          {/* Address Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Address
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => handleChange('address.street', e.target.value)}
              onBlur={() => handleBlur('street')}
              error={touched.street && !!errors.street}
              helperText={touched.street && errors.street}
              placeholder="123 Main Street, Suite 100"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={(e) => handleChange('address.city', e.target.value)}
              onBlur={() => handleBlur('city')}
              error={touched.city && !!errors.city}
              helperText={touched.city && errors.city}
              placeholder="Los Angeles"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.address.state}
              onChange={(e) => handleChange('address.state', e.target.value)}
              onBlur={() => handleBlur('state')}
              placeholder="CA"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="ZIP/Postal Code"
              value={formData.address.zipCode}
              onChange={(e) => handleChange('address.zipCode', e.target.value)}
              onBlur={() => handleBlur('zipCode')}
              error={touched.zipCode && !!errors.zipCode}
              helperText={touched.zipCode && errors.zipCode}
              placeholder="90210"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={COUNTRIES}
              value={formData.address.country}
              onChange={(_, newValue) => handleChange('address.country', newValue || '')}
              onBlur={() => handleBlur('country')}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country"
                  placeholder="Select or type country"
                  helperText="Start typing to search countries"
                />
              )}
            />
          </Grid>

          {/* Contact Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
              Contact Information
            </Typography>
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