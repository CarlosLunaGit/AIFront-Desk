# 🔄 MSW-Backend API Synchronization Guide

## 🎯 **Purpose**
This guide ensures MSW (Mock Service Worker) handlers stay synchronized with real backend APIs, enabling isolated frontend/backend development.

## 📊 **Current Sync Status: ✅ FULLY SYNCHRONIZED & STABLE**

**Last Updated:** June 26, 2024  
**Status:** 🟢 **Room Management Fixes Complete - Production Ready**

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
- `GET /api/hotel/:id/dashboard-data` - ✅ Synced & Fixed
- `GET /api/hotel/:id/room-types` - ✅ Synced & Fixed

#### **Hotel Features & Configuration** 
- ✅ **COMPLETED**: Hotel features array now matches backend IHotelFeature interface
- ✅ **COMPLETED**: Hotel configuration uses unified Hotel entity (no separate config entity)
- ✅ **COMPLETED**: Address structure uses object format with street, city, state, zipCode, country
- ✅ **COMPLETED**: Hotel Configuration Wizard with clickable step navigation
- ✅ **COMPLETED**: TypeScript compilation errors fixed in MSW handlers

#### **Hotel Rooms** (`/api/rooms/*`)
- `GET /api/rooms` - ✅ Synced & Fixed (now filters by hotelId)
- `POST /api/rooms` - ✅ Synced
- `PATCH /api/rooms/:id` - ✅ Synced
- `DELETE /api/rooms/:id` - ✅ Synced

#### **Hotel Guests** (`/api/guests/*`)
- `GET /api/guests` - ✅ Synced (Updated to match backend Guest model)
- `POST /api/guests` - ✅ Synced
- `PATCH /api/guests/:id` - ✅ Synced
- `DELETE /api/guests/:id` - ✅ Synced

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

## 🏗️ **Data Structure Alignment - ✅ COMPLETED & STABLE**

### **Room Types - ✅ CRITICAL FIX APPLIED**
```typescript
// ✅ FIXED: MSW Room Types now use correct capacity structure
{
  _id: string,
  name: string,
  capacity: {
    adults: number,
    children?: number,
    total: number  // ✅ This is what frontend components use
  },
  hotelId: string,  // ✅ Uses actual hotel ID, not config ID
  // ... other fields
}
```

### **Dashboard Data - ✅ CRITICAL FIX APPLIED**
```typescript
// ✅ FIXED: Dashboard endpoint now uses direct hotel ID filtering
const hotelRooms = mockRooms.filter(r => r.hotelId === hotelId);
// Instead of the old config ID mapping that was causing zero stats
```

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
  hotelId: ObjectId,      // ✅ Using 'hotelId' not 'hotelConfigId'
  currentGuestId?: ObjectId,
  checkInDate?: Date,
  checkOutDate?: Date,
  lastCleaned?: Date,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 **Recent Critical Fixes (June 26, 2024)**

### **✅ Room Management Page - FULLY RESOLVED**
1. **Dashboard Zero Stats Fixed**: 
   - **Issue**: Dashboard showing 0 rooms due to config ID mapping
   - **Fix**: Updated dashboard endpoint to use direct `hotelId` filtering
   - **Result**: Dashboard now shows correct room counts

2. **Room Types Capacity Error Fixed**:
   - **Issue**: `Cannot read properties of undefined (reading 'total')`
   - **Fix**: Updated MSW room types to use `capacity: { adults, children, total }` structure
   - **Result**: Room Management displays correct capacities

3. **TypeScript Compilation Resolved**:
   - **Issue**: RoomFilters `_id` property errors
   - **Fix**: Ensured correct import from `useRoomTypes.ts` hook
   - **Result**: Clean compilation with no TypeScript errors

4. **Hotel ID Migration Completed**:
   - **Issue**: Mixed usage of `hotelConfigId` vs `hotelId`
   - **Fix**: Updated all components and MSW data to use `hotelId` consistently
   - **Result**: Consistent data flow across all components

### **✅ MSW Data Updates Applied**
- **Room Types**: Updated to use `capacity.total` structure matching frontend expectations
- **Dashboard Endpoint**: Fixed hotel room filtering logic
- **Reference Data**: Updated `db-dump/msw-reference-data/` files to match current structure
- **Type Interfaces**: Aligned all TypeScript interfaces with MSW data structure

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
- **Room Management**: Fully functional with correct data

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
- ✅ **Dashboard**: Shows accurate room statistics from MSW data
- ✅ **Room Management**: Displays rooms with correct capacities and types
- ✅ **Hotel Configuration Wizard**: Complete with clickable step navigation
- ✅ **Feature Icons**: Material Icons display with fallback support
- ✅ **Data Consistency**: MSW and frontend components fully aligned
- ✅ **Type Safety**: Full TypeScript compatibility
- ✅ **User Experience**: Efficient navigation between components
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
2. **✅ COMPLETED**: Room Management page functionality
3. **✅ COMPLETED**: Reference data synchronization
4. **🔄 Ready**: Switch to real backend integration testing
5. **🔄 Ready**: Add missing auth endpoints  
6. **🔄 Ready**: Validation script for automated sync checks

## 📋 **Testing Checklist - ✅ ALL PASSING**

- [x] Dashboard shows correct room statistics
- [x] Room Management page loads without errors
- [x] Room types display with proper capacity values
- [x] Hotel switching works correctly
- [x] TypeScript compilation succeeds
- [x] MSW data structure matches backend expectations
- [x] Reference data files are up to date

---

**Last Updated**: June 26, 2024  
**Major Changes**: Room Management fixes completed, MSW data structure fully aligned, reference data updated  
**Status**: 🟢 **Fully Stable & Ready for Backend Integration** 