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
- ✅ **ALIGNED**: Hotel features array now matches backend IHotelFeature interface
- ✅ **ALIGNED**: Hotel configuration uses unified Hotel entity (no separate config entity)
- ✅ **ALIGNED**: Address structure uses object format with street, city, state, zipCode, country

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

## 🏗️ **Data Structure Alignment - RECENTLY UPDATED**

### **Hotel Object - ✅ ALIGNED**
```typescript
// Backend (MongoDB Document) - ✅ MSW MATCHES
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
  // ✅ NEW: Hotel amenity features for guests
  features: [{
    id: string,
    name: string,
    description?: string,
    icon?: string,
    type: 'feature' | 'amenity',
    category?: string
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

### **Guest Object - ✅ RECENTLY ALIGNED**
```typescript
// Backend (MongoDB Document) - ✅ MSW UPDATED TO MATCH
{
  _id: ObjectId,           // ✅ Changed from 'id' to '_id'
  name: string,
  email: string,
  phone: string,
  status: 'booked' | 'checked-in' | 'checked-out',
  roomId: ObjectId,
  reservationStart: Date,
  reservationEnd: Date,
  checkIn?: Date,         // ✅ Changed from empty string to null/Date
  checkOut?: Date,        // ✅ Changed from empty string to null/Date
  hotelId: ObjectId,      // ✅ Changed from 'hotelConfigId' to 'hotelId'
  keepOpen: boolean,
  createdAt: Date,        // ✅ Added timestamp fields
  updatedAt: Date         // ✅ Added timestamp fields
}
```

### **Room Object - ✅ ALIGNED**
```typescript
// Backend (MongoDB Document) - MSW structure matches
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

### **✅ Hotel Configuration & Features Integration**
- **COMPLETED**: Removed separate hotel configuration entity
- **COMPLETED**: Added features array directly to Hotel model
- **COMPLETED**: Updated Hotel Configuration Wizard to use unified Hotel entity
- **COMPLETED**: Fixed address structure to use object format instead of string
- **COMPLETED**: Added 15+ comprehensive hotel features with valid Material Icons
- **COMPLETED**: Fixed icon display in Features & Amenities step

### **✅ Guest Model Synchronization**
- **COMPLETED**: Updated MSW guest data to use `hotelId` instead of `hotelConfigId`
- **COMPLETED**: Changed guest ID field from `id` to `_id` to match MongoDB
- **COMPLETED**: Updated check-in/check-out fields to use proper Date/null values
- **COMPLETED**: Added timestamp fields (`createdAt`, `updatedAt`)

### **🔧 Remaining MSW Reference Updates**
- **IN PROGRESS**: Updating all MSW handler references to use new field names
- **PLANNED**: Full cleanup of legacy `hotelConfigId` references
- **PLANNED**: Standardization of all `id` fields to `_id` for MongoDB consistency

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

## 📝 **Implementation Notes**

### **Current Features Successfully Tested:**
- ✅ **Hotel Configuration Wizard**: Address fields, Features & Amenities step
- ✅ **Feature Icons**: Material Icons display with fallback support
- ✅ **Data Consistency**: MSW and backend Hotel features aligned
- ✅ **Type Safety**: TypeScript compatibility for address objects
- ✅ **User Experience**: Individual address fields with country dropdown

### **Backend Models Location:**
- `backend/src/models/Hotel.ts` - ✅ Features array added
- `backend/src/models/Room.ts` - ✅ Aligned
- `backend/src/models/Guest.ts` - ✅ Structure confirmed

### **MSW Handler Location:**
- `frontend/src/mocks/handlers.ts` - ✅ Data models updated (partial)

### **Frontend API Services:**
- `frontend/src/services/api/hotel.ts` - ✅ Updated for unified Hotel entity
- `frontend/src/services/api/room.ts` - ✅ Aligned
- `frontend/src/services/api/guest.ts` - ✅ Updated for new Guest structure

## 🎯 **Next Steps**

1. **Complete MSW Reference Cleanup**: Finish updating all handler references
2. **Add Missing Endpoints**: Complete auth registration endpoint  
3. **Validation Script**: Create automated sync validation
4. **Testing**: Add tests that run in both MSW and real backend modes

---

**Last Updated**: June 25, 2024
**Major Changes**: Hotel features integration, Guest model alignment, Address object structure
**Status**: 🟢 Data Models Aligned, Reference Updates In Progress 