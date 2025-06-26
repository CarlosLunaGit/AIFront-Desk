# 🔄 MSW-Backend API Synchronization Guide

## 🎯 **Purpose**
This guide ensures MSW (Mock Service Worker) handlers stay synchronized with real backend APIs, enabling isolated frontend/backend development.

## 📊 **Current Sync Status**

### ✅ **Synchronized Endpoints**

#### **Authentication** (`/api/auth/*`)
- `POST /api/auth/login` - ✅ Synced
- `GET /api/auth/me` - ✅ Synced  
- `POST /api/auth/register` - ⚠️ MSW missing

#### **Hotel Management** (`/api/hotel/*`)
- `GET /api/hotel` - ✅ Synced
- `GET /api/hotel/current` - ✅ Synced
- `POST /api/hotel` - ✅ Synced
- `PATCH /api/hotel/:id` - ✅ Synced
- `GET /api/hotel/stats` - ✅ Synced

#### **Hotel Features & Configuration** 
- ✅ **COMPLETED**: Hotel features array now matches backend IHotelFeature interface
- ✅ **COMPLETED**: Hotel configuration uses unified Hotel entity (no separate config entity)
- ✅ **COMPLETED**: Address structure uses object format with street, city, state, zipCode, country
- ✅ **COMPLETED**: Hotel Configuration Wizard with clickable step navigation
- ✅ **COMPLETED**: TypeScript compilation errors fixed in MSW handlers

#### **Hotel Rooms** (`/api/hotel/rooms/*`)
- `GET /api/hotel/rooms` - ✅ Synced (structure aligned with backend Room model)
- `POST /api/hotel/rooms` - ✅ Synced
- `PATCH /api/hotel/rooms/:id` - ✅ Synced
- `DELETE /api/hotel/rooms/:id` - ✅ Synced

#### **Hotel Guests** (`/api/hotel/guests/*`)
- `GET /api/hotel/guests` - ✅ Synced (Updated to match backend Guest model)
- `POST /api/hotel/guests` - ✅ Synced
- `PATCH /api/hotel/guests/:id` - ✅ Synced
- `DELETE /api/hotel/guests/:id` - ✅ Synced

#### **Communications** (`/api/communications/*`)
- `GET /api/communications/guest/:guestId` - ✅ Synced
- `POST /api/communications/send` - ✅ Synced
- `GET /api/communications/stats` - ✅ Synced
- `GET /api/communications/conversations` - ✅ Synced
- `GET /api/communications/conversations/:id` - ✅ Synced
- `POST /api/communications/conversations/:id/takeover` - ✅ Synced
- `POST /api/communications/conversations/:id/messages` - ✅ Synced

#### **Subscriptions** (`/api/subscription/*`)
- `GET /api/subscription/plans` - ✅ Synced

### ⚠️ **Missing from MSW**
- `POST /api/auth/register`
- `GET /api/auth/create-dev-user`
- `POST /api/communications/ai` (AI processing endpoint)

## 🏗️ **Data Structure Alignment - ✅ COMPLETED**

### **Hotel Object - ✅ FULLY ALIGNED**
```typescript
// Backend (MongoDB Document) - ✅ MSW MATCHES EXACTLY
{
  _id: ObjectId,
  name: string,
  slug: string,
  description?: string,
  address?: {
    street?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string
  },
  // ✅ STABLE: Hotel amenity features for guests
  features: [{
    id: string,
    name: string,
    description?: string,
    icon?: string,
    type: 'feature' | 'amenity',
    category?: string
  }],
  // ✅ STABLE: Floors defined directly in Hotel entity
  floors: [{
    id: string,
    name: string,
    number: number,
    description?: string,
    isActive: boolean
  }],
  // ✅ STABLE: Room templates for configuration wizard
  roomTemplates: [{
    id: string,
    typeId: string,
    floorId: string,
    name: string,
    capacity: number,
    features: string[],
    rate: number,
    notes?: string
  }],
  contactInfo: {
    phone?: string,
    email?: string,
    website?: string
  },
  communicationChannels?: {
    whatsapp?: { phoneNumber: string, verified: boolean },
    sms?: { phoneNumber: string, verified: boolean },
    email?: { address: string, verified: boolean }
  },
  subscription: ISubscription,
  settings: {
    timezone: string,
    currency: string,
    language: string,
    checkInTime: string,
    checkOutTime: string
  },
  isActive: boolean,
  createdBy: ObjectId,
  usage: {
    currentRooms: number,
    aiResponsesThisMonth: number,
    usersCount: number,
    lastReset: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Guest Object - ✅ FULLY ALIGNED**
```typescript
// Backend (MongoDB Document) - ✅ MSW MATCHES EXACTLY
{
  _id: ObjectId,           // ✅ Using MongoDB _id format
  name: string,
  email: string,
  phone: string,
  status: 'booked' | 'checked-in' | 'checked-out',
  roomId: ObjectId,
  reservationStart: Date,
  reservationEnd: Date,
  checkIn?: Date,         // ✅ Using Date/null instead of empty strings
  checkOut?: Date,        // ✅ Using Date/null instead of empty strings
  hotelId: ObjectId,      // ✅ Using 'hotelId' instead of 'hotelConfigId'
  keepOpen: boolean,
  createdAt: Date,        // ✅ Timestamp fields present
  updatedAt: Date         // ✅ Timestamp fields present
}
```

### **Room Object - ✅ FULLY ALIGNED**
```typescript
// Backend (MongoDB Document) - MSW structure matches exactly
{
  _id: ObjectId,
  number: string,
  type: RoomType,
  roomTypeId?: ObjectId,
  status: RoomStatus,
  price: number,
  capacity: number,
  amenities: string[],
  description: string,
  hotelId: ObjectId,
  currentGuestId?: ObjectId,
  checkInDate?: Date,
  checkOutDate?: Date,
  lastCleaned?: Date,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 **Recent Updates (June 2024)**

### **✅ Hotel Configuration Wizard - COMPLETED & STABLE**
- **COMPLETED**: Unified Hotel entity with all configuration data
- **COMPLETED**: Clickable step navigation for improved UX
- **COMPLETED**: TypeScript compilation errors resolved
- **COMPLETED**: Hotel features array with 15+ comprehensive amenities
- **COMPLETED**: Floors and room templates integrated into Hotel entity
- **COMPLETED**: Address object structure with individual fields
- **COMPLETED**: Material Icons integration with fallback support

### **✅ MSW Handler Improvements - COMPLETED**
- **COMPLETED**: Fixed all TypeScript compilation errors
- **COMPLETED**: Proper reservation generation function
- **COMPLETED**: Updated all reference variables to use final arrays
- **COMPLETED**: Removed unused imports and functions
- **COMPLETED**: Comprehensive error handling and type safety

### **✅ Reference Data Updates - COMPLETED**
- **COMPLETED**: Updated `db-dump/msw-reference-data/hotels.json` with current structure
- **COMPLETED**: All JSON reference files reflect current MSW mock data
- **COMPLETED**: Documentation updated to reflect stable state

## 🚀 **Environment Toggle**

### **MSW Mode** (Isolated Frontend Development)
```bash
# .env.local
REACT_APP_ENABLE_MOCK_API=true
REACT_APP_SIMULATE_NEW_USER=false  # Existing user with data
```
**Benefits:**
- Frontend development without backend
- Consistent test data  
- Fast development iteration
- No database dependencies

### **Real Backend Mode** (Integration Testing)
```bash  
# .env.local
REACT_APP_ENABLE_MOCK_API=false
REACT_APP_API_URL=http://localhost:3001
```
**Benefits:**
- Real data validation
- End-to-end testing
- Database integration testing
- Authentication validation

## 📝 **Implementation Status**

### **Current Features Successfully Tested:**
- ✅ **Hotel Configuration Wizard**: Complete with clickable step navigation
- ✅ **Feature Icons**: Material Icons display with fallback support
- ✅ **Data Consistency**: MSW and backend Hotel features fully aligned
- ✅ **Type Safety**: Full TypeScript compatibility
- ✅ **User Experience**: Efficient navigation between configuration steps
- ✅ **Compilation**: All TypeScript errors resolved
- ✅ **Reference Data**: JSON files updated and synchronized

### **Backend Models Location:**
- `backend/src/models/Hotel.ts` - ✅ Features, floors, roomTemplates included
- `backend/src/models/Room.ts` - ✅ Aligned
- `backend/src/models/Guest.ts` - ✅ Structure confirmed

### **MSW Handler Location:**
- `frontend/src/mocks/handlers.ts` - ✅ Fully aligned and error-free

### **Frontend API Services:**
- `frontend/src/services/api/hotel.ts` - ✅ Updated for unified Hotel entity
- `frontend/src/services/api/room.ts` - ✅ Aligned
- `frontend/src/services/api/guest.ts` - ✅ Updated for new Guest structure

## 🎯 **Next Steps**

1. **✅ COMPLETED**: MSW TypeScript error resolution
2. **✅ COMPLETED**: Hotel Configuration Wizard clickable navigation
3. **✅ COMPLETED**: Reference data synchronization
4. **🔄 Ready**: Switch to real backend integration testing
5. **🔄 Ready**: Add missing auth endpoints  
6. **🔄 Ready**: Validation script for automated sync checks

---

**Last Updated**: June 26, 2024
**Major Changes**: Hotel Configuration Wizard completed, MSW compilation errors fixed, reference data updated
**Status**: 🟢 Fully Stable & Ready for Backend Integration 