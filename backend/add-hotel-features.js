const { MongoClient } = require('mongodb');

// MongoDB connection URL - update this to match your database connection
const MONGODB_URI = 'mongodb://localhost:27017/ai-hotel-receptionist';

// Common hotel features and amenities
const commonFeatures = [
  {
    id: 'feature-1',
    name: 'Free WiFi',
    description: 'High-speed wireless internet throughout the property',
    icon: 'wifi',
    type: 'amenity',
    category: 'technology'
  },
  {
    id: 'feature-2',
    name: 'Swimming Pool',
    description: 'Outdoor heated swimming pool with pool deck',
    icon: 'pool',
    type: 'amenity',
    category: 'recreation'
  },
  {
    id: 'feature-3',
    name: 'Air Conditioning',
    description: 'Individual climate control in all rooms',
    icon: 'ac_unit',
    type: 'feature',
    category: 'room'
  },
  {
    id: 'feature-4',
    name: 'Room Service',
    description: '24/7 in-room dining service',
    icon: 'room_service',
    type: 'amenity',
    category: 'service'
  },
  {
    id: 'feature-5',
    name: 'Fitness Center',
    description: 'Fully equipped gym with modern equipment',
    icon: 'fitness_center',
    type: 'amenity',
    category: 'recreation'
  },
  {
    id: 'feature-6',
    name: 'Spa Services',
    description: 'Full-service spa with massage and treatments',
    icon: 'spa',
    type: 'amenity',
    category: 'wellness'
  },
  {
    id: 'feature-7',
    name: 'Restaurant',
    description: 'On-site restaurant serving international cuisine',
    icon: 'restaurant',
    type: 'amenity',
    category: 'dining'
  },
  {
    id: 'feature-8',
    name: 'Business Center',
    description: 'Computers, printers, and meeting facilities',
    icon: 'business_center',
    type: 'amenity',
    category: 'business'
  },
  {
    id: 'feature-9',
    name: 'Concierge Service',
    description: '24/7 concierge assistance',
    icon: 'concierge_service',
    type: 'amenity',
    category: 'service'
  },
  {
    id: 'feature-10',
    name: 'Valet Parking',
    description: 'Complimentary valet parking service',
    icon: 'local_parking',
    type: 'amenity',
    category: 'transport'
  },
  {
    id: 'feature-11',
    name: 'Pet Friendly',
    description: 'Pets welcome with special amenities',
    icon: 'pets',
    type: 'feature',
    category: 'policies'
  },
  {
    id: 'feature-12',
    name: 'Airport Shuttle',
    description: 'Complimentary shuttle to/from airport',
    icon: 'airport_shuttle',
    type: 'amenity',
    category: 'transport'
  },
  {
    id: 'feature-13',
    name: 'Balcony/Terrace',
    description: 'Private balcony or terrace',
    icon: 'balcony',
    type: 'feature',
    category: 'room'
  },
  {
    id: 'feature-14',
    name: 'Minibar',
    description: 'In-room minibar with beverages and snacks',
    icon: 'kitchen',
    type: 'feature',
    category: 'room'
  },
  {
    id: 'feature-15',
    name: 'Safe',
    description: 'In-room electronic safe',
    icon: 'security',
    type: 'feature',
    category: 'room'
  }
];

// Additional features for beach/resort hotels
const beachResortFeatures = [
  {
    id: 'feature-16',
    name: 'Beach Access',
    description: 'Direct access to private beach',
    icon: 'beach_access',
    type: 'amenity',
    category: 'recreation'
  },
  {
    id: 'feature-17',
    name: 'Water Sports',
    description: 'Kayaking, paddleboarding, and snorkeling equipment',
    icon: 'kayaking',
    type: 'amenity',
    category: 'recreation'
  },
  {
    id: 'feature-18',
    name: 'Ocean View',
    description: 'Stunning views of the Atlantic Ocean',
    icon: 'waves',
    type: 'feature',
    category: 'room'
  }
];

async function addFeaturesToHotels() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const hotelsCollection = db.collection('hotels');
    
    // Get all hotels
    const hotels = await hotelsCollection.find({}).toArray();
    console.log(`📊 Found ${hotels.length} hotels`);
    
    for (const hotel of hotels) {
      console.log(`\n🏨 Processing hotel: ${hotel.name}`);
      
      // Determine which features to add based on hotel type
      let featuresToAdd = [...commonFeatures];
      
      // Add beach features for seaside/beach hotels
      if (hotel.name.toLowerCase().includes('seaside') || 
          hotel.name.toLowerCase().includes('beach') ||
          hotel.name.toLowerCase().includes('resort')) {
        featuresToAdd = [...featuresToAdd, ...beachResortFeatures];
        console.log('   🏖️  Adding beach resort features');
      }
      
      // Update the hotel with features
      const updateResult = await hotelsCollection.updateOne(
        { _id: hotel._id },
        { 
          $set: { 
            features: featuresToAdd,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`   ✅ Added ${featuresToAdd.length} features to ${hotel.name}`);
      } else {
        console.log(`   ⚠️  No changes made to ${hotel.name}`);
      }
    }
    
    console.log('\n🎉 Successfully added features to all hotels!');
    
  } catch (error) {
    console.error('❌ Error adding features to hotels:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addFeaturesToHotels()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addFeaturesToHotels, commonFeatures, beachResortFeatures }; 