# 🔄 MSW-Backend API Synchronization Guide

## 🎯 **Purpose**
This guide ensures MSW (Mock Service Worker) handlers stay synchronized with real backend APIs, enabling isolated frontend/backend development.

## 📊 **Current Sync Status: ✅ FULLY SYNCHRONIZED & STABLE**

**Last Updated:** June 26, 2024  
**Status:** 🟢 **Fully Stable & Ready for Backend Integration**

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
- `POST /api/hotel/set-current` - ✅ Synced (Hotel switching)

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

#### **Hotel Guests** (`/api/guests/*`) - ✅ **FULLY IMPLEMENTED & TESTED**
- `GET /api/guests?hotelId=X` - ✅ Synced & Fixed (hotel-specific filtering)
- `GET /api/guests/:id` - ✅ Synced
- `POST /api/guests` - ✅ Synced (with hotel ID support)
- `PATCH /api/guests/:id` - ✅ Synced (check-in/check-out operations)
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

### **✅ Room Status Calculation Logic - FULLY IMPLEMENTED & TESTED**
1. **Room Status Business Logic Fixed**:
   - **Issue**: Room status calculations not properly handling guest preferences and capacity
   - **Fix**: Implemented correct priority order: capacity constraints + guest preferences
   - **Result**: Room 101 (Alice + Liam) shows "Reserved", Room 102 (Bob checked-in) shows "Partially Occupied"

2. **Visual Status Indicators Enhanced**:
   - **Issue**: Colored dots were unclear for room status identification
   - **Fix**: Updated to text initials (A=Available, O=Occupied, PO=Partially Occupied, etc.)
   - **Result**: Clear, consistent visual indicators with proper color coding

3. **Feature & Guest Name Display Fixed**:
   - **Issue**: Room cards showing IDs like "feature-3" and "guest-1" instead of names
   - **Fix**: Added proper mapping functions for features and guests using useGuests() hook
   - **Result**: Room details show actual names like "Air Conditioning" and "Bob Smith"

4. **TypeScript Compilation Resolved**:
   - **Issue**: Multiple implicit 'any' type errors in RoomManagement component
   - **Fix**: Added proper type annotations for floor and feature mapping functions
   - **Result**: Clean compilation with full type safety

5. **Hotel Entity Migration Completed**:
   - **Issue**: Mixed usage of hotel configuration vs actual Hotel entities
   - **Fix**: Migrated from useCurrentConfig to useCurrentHotel with _id fields
   - **Result**: Consistent data flow using actual Hotel entities across all components

6. **React Query Cache Invalidation Enhanced**:
   - **Issue**: Room status changes not updating across components when guests are modified
   - **Fix**: Added comprehensive query invalidation for rooms and dashboard data in guest mutations
   - **Result**: Real-time room status updates when guests check-in, check-out, or change preferences

### **✅ Guest Management Page - FULLY IMPLEMENTED & TESTED**
1. **Hotel ID Property Mismatch Fixed**:
   - **Issue**: GuestManagement component accessing `_id` property but hotel object uses `id`
   - **Fix**: Updated component to support both `id` and `_id` properties for compatibility
   - **Result**: Guest Management page now loads correctly with proper hotel context

2. **Hotel-Specific Guest Filtering Implemented**:
   - **Issue**: Guest queries not properly filtering by current hotel
   - **Fix**: Enhanced MSW guest endpoints with proper hotel ID filtering and debug logging
   - **Result**: Guest data correctly isolated per hotel with instant switching

3. **Loading States & UX Improvements**:
   - **Issue**: No loading feedback during hotel switching or guest operations
   - **Fix**: Added comprehensive loading states, spinners, and visual feedback
   - **Result**: Smooth user experience with clear operation status

4. **Query Invalidation & Caching**:
   - **Issue**: Stale guest data when switching hotels
   - **Fix**: Enhanced React Query cache invalidation for hotel-specific data
   - **Result**: Instant data updates when switching between hotels

### **✅ Hotel Switching Infrastructure - ENHANCED**
1. **Dynamic Hotel ID Mapping**:
   - **Issue**: Hardcoded hotel ID mappings causing inflexibility
   - **Fix**: Dynamic mapping based on current hotel selection with debug logging
   - **Result**: Robust hotel switching that works with any hotel configuration

2. **Cross-Component Data Consistency**:
   - **Issue**: Guest data not updating across components during hotel switches
   - **Fix**: Comprehensive query invalidation for guests, rooms, and dashboard data
   - **Result**: All components stay synchronized during hotel changes

3. **Enhanced Debug Logging**:
   - **Issue**: Difficult to troubleshoot hotel switching issues
   - **Fix**: Added detailed console logging for hotel switches and guest filtering
   - **Result**: Easy debugging and monitoring of data flow

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
- ✅ **Guest Management**: Full CRUD operations with hotel-specific filtering and loading states
- ✅ **Hotel Switching**: Instant data updates across all components with visual feedback
- ✅ **Hotel Configuration Wizard**: Complete with clickable step navigation
- ✅ **Feature Icons**: Material Icons display with fallback support
- ✅ **Data Consistency**: MSW and frontend components fully aligned
- ✅ **Type Safety**: Full TypeScript compatibility
- ✅ **User Experience**: Efficient navigation between components with loading states
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
- [x] Room status calculation logic works correctly (Reserved, Partially Occupied, Available)
- [x] Room status indicators use clear text initials (A, O, PO, PR, R, C)
- [x] Feature names display correctly (Air Conditioning, not feature-3)
- [x] Guest names display correctly in room details (Bob Smith, not guest-2)
- [x] Room status updates in real-time when guests are modified
- [x] Guest Management page loads and displays hotel-specific guests
- [x] Guest CRUD operations work correctly (add, edit, delete, check-in, check-out)
- [x] Hotel switching works correctly with instant data updates
- [x] Loading states provide proper user feedback during operations
- [x] TypeScript compilation succeeds with no implicit any errors
- [x] MSW data structure matches backend expectations
- [x] Reference data files are up to date
- [x] Hotel entity migration completed (useCurrentHotel vs useCurrentConfig)
- [x] React Query cache invalidation works across components

---

**Last Updated**: June 26, 2024  
**Major Changes**: Room status calculation logic completed, visual indicators enhanced, feature/guest name mapping fixed, Hotel entity migration completed, TypeScript compilation resolved  
**Status**: 🟢 **Fully Stable & Ready for Backend Integration** 