// Hotel mock data - extracted for modularity
// NEW USER ONBOARDING: Toggle this for testing different scenarios
export const SIMULATE_NEW_USER = process.env.REACT_APP_SIMULATE_NEW_USER === 'true';

const mockHotelsData = [
  {
    _id: '65a000000000000000000001',
    name: 'AI Front Desk Hotel',
    slug: 'ai-front-desk-hotel',
    description: 'A modern AI-powered hotel in the heart of downtown, offering personalized guest experiences through cutting-edge technology.',
    address: {
      street: '123 Hotel Street',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    contactInfo: {
      phone: '+1-555-0123',
      email: 'contact@aifrontdesk.com',
      website: 'https://www.aifrontdesk.com'
    },
    // Hotel amenity features for guests (hotel-level amenities only)
    features: [
      {
        id: 'feature-1',
        name: 'Free WiFi',
        description: 'High-speed wireless internet throughout the property',
        icon: 'wifi',
        type: 'feature' as const,
        category: 'technology'
      },
      {
        id: 'feature-2',
        name: 'Swimming Pool',
        description: 'Outdoor heated swimming pool with pool deck',
        icon: 'pool',
        type: 'amenity' as const,
        category: 'recreation'
      },
      {
        id: 'feature-3',
        name: 'Air Conditioning',
        description: 'Individual climate control in all rooms',
        icon: 'ac_unit',
        type: 'feature' as const,
        category: 'technology'
      },
      {
        id: 'feature-4',
        name: 'Room Service',
        description: '24/7 in-room dining service',
        icon: 'room_service',
        type: 'feature' as const,
        category: 'service'
      },
      {
        id: 'feature-5',
        name: 'Fitness Center',
        description: 'Fully equipped gym with modern equipment',
        icon: 'fitness_center',
        type: 'amenity' as const,
        category: 'recreation'
      },
      {
        id: 'feature-6',
        name: 'Spa Services',
        description: 'Full-service spa with massage and treatments',
        icon: 'spa',
        type: 'amenity' as const,
        category: 'wellness'
      },
      {
        id: 'feature-7',
        name: 'Restaurant',
        description: 'On-site restaurant serving international cuisine',
        icon: 'restaurant',
        type: 'amenity' as const,
        category: 'dining'
      },
      {
        id: 'feature-8',
        name: 'Business Center',
        description: 'Computers, printers, and meeting facilities',
        icon: 'business_center',
        type: 'feature' as const,
        category: 'business'
      },
      {
        id: 'feature-9',
        name: 'Concierge Service',
        description: '24/7 concierge assistance',
        icon: 'support_agent',
        type: 'amenity',
        category: 'service'
      },
      {
        id: 'feature-10',
        name: 'Valet Parking',
        description: 'Complimentary valet parking service',
        icon: 'local_parking',
        type: 'feature' as const,
        category: 'transport'
      },
      {
        id: 'feature-11',
        name: 'Pet Friendly',
        description: 'Pets welcome with special amenities',
        icon: 'pets',
        type: 'feature' as const,
        category: 'policies'
      },
      {
        id: 'feature-12',
        name: 'Airport Shuttle',
        description: 'Complimentary shuttle to/from airport',
        icon: 'airport_shuttle',
        type: 'feature' as const,
        category: 'transport'
      },
      {
        id: 'feature-13',
        name: 'Balcony/Terrace',
        description: 'Private balcony or terrace',
        icon: 'deck',
        type: 'feature',
        category: 'room'
      },
      {
        id: 'feature-14',
        name: 'Minibar',
        description: 'In-room minibar with beverages and snacks',
        icon: 'kitchen',
        type: 'feature' as const,
        category: 'room'
      },
      {
        id: 'feature-15',
        name: 'Safe',
        description: 'In-room safe for valuables',
        icon: 'security',
        type: 'feature' as const,
        category: 'security'
      }
    ],
    // Hotel configuration data (floors, room types, templates)
    floors: [
      {
        id: 'floor-1',
        name: 'Ground Floor',
        number: 1,
        description: 'Main floor with lobby and reception',
        isActive: true
      },
      {
        id: 'floor-2',
        name: 'Second Floor',
        number: 2,
        description: 'Guest rooms and amenities',
        isActive: true
      },
      {
        id: 'floor-3',
        name: 'Third Floor',
        number: 3,
        description: 'Premium rooms and suites',
        isActive: true
      },
      {
        id: 'floor-4',
        name: 'Fourth Floor',
        number: 4,
        description: 'Executive floor with concierge service',
        isActive: true
      }
    ],
    roomTemplates: [
      {
        id: 'template-101',
        typeId: 'type-1',
        floorId: 'floor-1',
        name: 'Standard Room 101',
        capacity: 2,
        features: ['feature-3'],
        rate: 150,
        notes: 'Near lobby, easy access'
      },
      {
        id: 'template-201',
        typeId: 'type-2',
        floorId: 'floor-2',
        name: 'Deluxe Room 201',
        capacity: 2,
        features: ['feature-3'],
        rate: 250,
        notes: 'City view, balcony'
      },
      {
        id: 'template-301',
        typeId: 'type-3',
        floorId: 'floor-3',
        name: 'Premium Suite 301',
        capacity: 4,
        features: ['feature-3'],
        rate: 450,
        notes: 'Corner suite, panoramic view'
      }
    ],
    communicationChannels: {
      whatsapp: {
        phoneNumber: '+1-555-0123',
        verified: true,
        businessAccountId: 'whatsapp_business_001'
      },
      sms: {
        phoneNumber: '+1-555-0123',
        verified: true
      },
      email: {
        address: 'contact@aifrontdesk.com',
        verified: true
      }
    },
    subscription: {
      tier: 'starter',
      status: 'active',
      stripeCustomerId: 'cus_mock_customer_001',
      stripeSubscriptionId: 'sub_mock_subscription_001',
      currentPeriodStart: new Date('2024-01-01T00:00:00Z').toISOString(),
      currentPeriodEnd: new Date('2024-02-01T00:00:00Z').toISOString(),
      cancelAtPeriodEnd: false,
      features: {
        maxRooms: 50,
        maxAIResponses: 1000,
        maxUsers: 3,
        channels: ['whatsapp', 'email'],
        hasVoiceCalls: false,
        hasAdvancedAnalytics: false,
        hasCustomAI: false,
        hasWhiteLabel: false,
        hasAPIAccess: false
      },
      monthlyPrice: 29
    },
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
      checkInTime: '15:00',
      checkOutTime: '11:00'
    },
    isActive: true,
    createdBy: '65a000000000000000000002',
    usage: {
      currentRooms: 7,
      aiResponsesThisMonth: 245,
      usersCount: 2,
      lastReset: new Date('2024-01-01T00:00:00Z').toISOString()
    },
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '65a000000000000000000002',
    name: 'Seaside Resort',
    slug: 'seaside-resort',
    description: 'A beautiful beachfront resort with stunning ocean views and world-class amenities.',
    address: {
      street: '456 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139',
      country: 'USA'
    },
    contactInfo: {
      phone: '+1-555-0456',
      email: 'info@seasideresort.com',
      website: 'https://www.seasideresort.com'
    },
    features: [
      {
        id: 'feature-beach-1',
        name: 'Private Beach',
        description: 'Exclusive private beach access',
        icon: 'beach_access',
        type: 'amenity' as const,
        category: 'recreation'
      },
      {
        id: 'feature-beach-2',
        name: 'Ocean View',
        description: 'Stunning panoramic ocean views',
        icon: 'waves',
        type: 'feature' as const,
        category: 'location'
      },
      {
        id: 'feature-beach-3',
        name: 'Water Sports',
        description: 'Kayaking, snorkeling, and paddleboarding',
        icon: 'surfing',
        type: 'amenity' as const,
        category: 'recreation'
      }
    ],
    // Floors for Seaside Resort
    floors: [
      {
        id: 'floor-beach-1',
        name: 'Ground Floor',
        number: 1,
        description: 'Lobby, restaurant, and beach access',
        isActive: true
      },
      {
        id: 'floor-beach-2',
        name: 'Second Floor',
        number: 2,
        description: 'Ocean view rooms',
        isActive: true
      },
      {
        id: 'floor-beach-3',
        name: 'Third Floor',
        number: 3,
        description: 'Premium ocean view suites',
        isActive: true
      }
    ],
    roomTemplates: [
      {
        id: 'template-beach-101',
        typeId: 'roomtype-ocean-001',
        floorId: 'floor-beach-1',
        name: 'Ocean View Room 101',
        capacity: 2,
        features: ['feature-beach-2'],
        rate: 300,
        notes: 'Ground floor with easy beach access'
      },
      {
        id: 'template-beach-201',
        typeId: 'roomtype-ocean-001',
        floorId: 'floor-beach-2',
        name: 'Ocean View Room 201',
        capacity: 2,
        features: ['feature-beach-2'],
        rate: 350,
        notes: 'Elevated ocean views'
      },
      {
        id: 'template-beach-301',
        typeId: 'roomtype-ocean-ste-001',
        floorId: 'floor-beach-3',
        name: 'Ocean Suite 301',
        capacity: 4,
        features: ['feature-beach-2'],
        rate: 600,
        notes: 'Premium suite with panoramic ocean views'
      }
    ],
    communicationChannels: {
      whatsapp: {
        phoneNumber: '+1-555-0456',
        verified: true,
        businessAccountId: 'whatsapp_business_002'
      },
      sms: {
        phoneNumber: '+1-555-0456',
        verified: true
      },
      email: {
        address: 'info@seasideresort.com',
        verified: true
      }
    },
    subscription: {
      tier: 'professional',
      status: 'active',
      stripeCustomerId: 'cus_mock_customer_002',
      stripeSubscriptionId: 'sub_mock_subscription_002',
      currentPeriodStart: new Date('2024-01-01T00:00:00Z').toISOString(),
      currentPeriodEnd: new Date('2024-02-01T00:00:00Z').toISOString(),
      cancelAtPeriodEnd: false,
      features: {
        maxRooms: 200,
        maxAIResponses: 5000,
        maxUsers: 10,
        channels: ['whatsapp', 'sms', 'email'],
        hasVoiceCalls: true,
        hasAdvancedAnalytics: true,
        hasCustomAI: false,
        hasWhiteLabel: false,
        hasAPIAccess: true
      },
      monthlyPrice: 149
    },
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      checkInTime: '16:00',
      checkOutTime: '12:00'
    },
    isActive: true,
    createdBy: '65b000000000000000000012',
    usage: {
      currentRooms: 12,
      aiResponsesThisMonth: 1250,
      usersCount: 5,
      lastReset: new Date('2024-01-01T00:00:00Z').toISOString()
    },
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Use empty array for new user simulation, full data for existing user
export const mockHotels: any[] = SIMULATE_NEW_USER ? [] : mockHotelsData;

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log(`🏨 MSW Hotel Mode: ${SIMULATE_NEW_USER ? 'NEW USER ONBOARDING' : 'EXISTING USER WITH DATA'}`);
  console.log(`📊 Mock Hotels Count: ${mockHotels.length}`);
} 

