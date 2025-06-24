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
- `GET /api/hotel` - ✅ Just Added
- `GET /api/hotel/current` - ✅ Just Added
- `POST /api/hotel` - ✅ Just Added
- `PATCH /api/hotel/:id` - ✅ Just Added
- `GET /api/hotel/stats` - ✅ Just Added

#### **Hotel Rooms** (`/api/hotel/rooms/*`)
- `GET /api/hotel/rooms` - ✅ Just Added
- `POST /api/hotel/rooms` - ✅ Just Added
- `PATCH /api/hotel/rooms/:id` - ✅ Just Added
- `DELETE /api/hotel/rooms/:id` - ✅ Just Added

#### **Hotel Guests** (`/api/hotel/guests/*`)
- `GET /api/hotel/guests` - ✅ Just Added
- `POST /api/hotel/guests` - ✅ Just Added
- `PATCH /api/hotel/guests/:id` - ✅ Just Added
- `DELETE /api/hotel/guests/:id` - ✅ Just Added

#### **Communications** (`/api/communications/*`)
- `GET /api/communications/guest/:guestId` - ✅ Just Added
- `POST /api/communications/send` - ✅ Just Added
- `GET /api/communications/stats` - ✅ Just Added
- `GET /api/communications/conversations` - ✅ Existing
- `GET /api/communications/conversations/:id` - ✅ Existing
- `POST /api/communications/conversations/:id/takeover` - ✅ Existing
- `POST /api/communications/conversations/:id/messages` - ✅ Existing

#### **Subscriptions** (`/api/subscription/*`)
- `GET /api/subscription/plans` - ✅ Just Added

### ⚠️ **Missing from MSW**
- `POST /api/auth/register`
- `GET /api/auth/create-dev-user`
- `POST /api/communications/ai` (AI processing endpoint)

## 🏗️ **Data Structure Alignment**

### **Backend Model → MSW Mock Data**

#### **Hotel Object**
```typescript
// Backend (MongoDB Document)
{
  _id: ObjectId,
  name: string,
  slug: string,
  isActive: boolean,
  subscription: {
    tier: 'starter' | 'professional' | 'enterprise',
    status: 'active' | 'inactive'
  },
  settings: {
    timezone: string,
    currency: string,
    language: string
  },
  contactInfo: {
    email: string,
    phone: string,
    address: string
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// MSW Mock (now aligned)
{
  _id: '65b000000000000000000001',
  name: 'AI Front Desk Hotel',
  slug: 'ai-front-desk-hotel',
  isActive: true,
  subscription: { tier: 'starter', status: 'active' },
  settings: { timezone: 'America/Los_Angeles', currency: 'USD', language: 'en' },
  contactInfo: { email: 'contact@aifrontdesk.com', phone: '+1-555-0123', address: '123 Hotel St' },
  createdBy: '65b000000000000000000011',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}
```

#### **Communication Object**
```typescript
// Backend (MongoDB Document)
{
  _id: ObjectId,
  guestId: string,
  hotelId: string,
  content: string,
  channel: 'whatsapp' | 'email' | 'sms',
  type: 'inbound' | 'outbound',
  status: 'pending' | 'sent' | 'delivered' | 'read',
  createdAt: Date,
  updatedAt: Date
}

// MSW Mock (aligned)
{
  _id: '65c000000000000000000001',
  guestId: 'guest-1',
  hotelId: '65b000000000000000000001',
  content: 'Hello, I would like to check in early',
  channel: 'whatsapp',
  type: 'inbound',
  status: 'read',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}
```

## 🔄 **Synchronization Workflow**

### **When Backend Changes:**
1. **Add/modify endpoint** in backend routes
2. **Update corresponding MSW handler** in `frontend/src/mocks/handlers.ts`
3. **Align data structures** between backend models and MSW mock data
4. **Test both environments**:
   - `REACT_APP_ENABLE_MOCK_API=true` (MSW)
   - `REACT_APP_ENABLE_MOCK_API=false` (Real backend)

### **When Frontend API Service Changes:**
1. **Update API service** in `frontend/src/services/api/`
2. **Update corresponding MSW handler** to match expected requests/responses
3. **Update TypeScript types** if needed
4. **Test MSW responses** match real API responses

## 📋 **Maintenance Checklist**

### **Weekly Sync Check:**
- [ ] All backend routes have corresponding MSW handlers
- [ ] MSW response formats match backend response formats
- [ ] Error responses (404, 500, 400) are consistent
- [ ] Status codes match between MSW and backend
- [ ] Authentication flows work in both environments

### **Before Each Release:**
- [ ] Test critical user flows with MSW enabled
- [ ] Test critical user flows with real backend
- [ ] Verify no console errors in either mode
- [ ] Check all new endpoints have MSW equivalents

### **When Adding New Features:**
- [ ] Create backend endpoint
- [ ] Create MSW handler
- [ ] Add to this sync guide
- [ ] Test isolated frontend development
- [ ] Test end-to-end integration

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

### **New User Onboarding Mode** (Hotel Setup Testing)
```bash
# .env.local
REACT_APP_ENABLE_MOCK_API=true
REACT_APP_SIMULATE_NEW_USER=true   # New user with no hotel data
```
**Benefits:**
- Test hotel onboarding flow
- Verify new user experience
- Test hotel configuration wizard
- Validate empty state handling

### **Real Backend Mode** (Integration Testing)
```bash  
# .env.local
REACT_APP_ENABLE_MOCK_API=false
REACT_APP_API_URL=http://localhost:3001
# REACT_APP_SIMULATE_NEW_USER not used in real backend mode
```
**Benefits:**
- Real data validation
- End-to-end testing
- Database integration testing
- Authentication validation

## 🛠️ **Tools & Commands**

### **Sync Validation Script** (Future Enhancement)
```bash
# Create a script to validate MSW-Backend sync
npm run validate-msw-sync
```

### **Quick Switch Commands**
```bash
# Switch to new user onboarding mode
npm run new-user-mode

# Switch to existing user mode (with hotel data)
npm run existing-user-mode

# Switch to MSW mode (keeps current user simulation setting)
npm run msw-mode

# Switch to real backend mode  
npm run backend-mode
```

### **Manual Environment Setup**
```bash
# New user onboarding testing
echo "REACT_APP_ENABLE_MOCK_API=true" > .env.local
echo "REACT_APP_SIMULATE_NEW_USER=true" >> .env.local

# Existing user testing
echo "REACT_APP_ENABLE_MOCK_API=true" > .env.local
echo "REACT_APP_SIMULATE_NEW_USER=false" >> .env.local

# Real backend integration
echo "REACT_APP_ENABLE_MOCK_API=false" > .env.local
echo "REACT_APP_API_URL=http://localhost:3001" >> .env.local
```

## 📝 **Implementation Notes**

### **Current Frontend API Services:**
- `frontend/src/services/api/auth.ts`
- `frontend/src/services/api/hotel.ts` 
- `frontend/src/services/api/room.ts`
- `frontend/src/services/api/guest.ts`
- `frontend/src/services/api/communications.ts`

### **MSW Handler Location:**
- `frontend/src/mocks/handlers.ts` (Main handlers file)
- `frontend/src/mocks/browser.ts` (MSW setup)

### **Backend Routes Location:**
- `backend/src/routes/auth.ts`
- `backend/src/routes/hotel.ts`
- `backend/src/routes/communication.ts`
- `backend/src/routes/subscription.ts`

## 🎯 **Next Steps**

1. **Complete Missing Endpoints**: Add MSW handlers for missing backend endpoints
2. **Validation Script**: Create automated sync validation
3. **Documentation**: Keep this guide updated with each new endpoint
4. **Testing**: Add tests that run in both MSW and real backend modes

---

**Last Updated**: Current Date
**Maintainer**: Development Team
**Status**: 🟢 Actively Maintained 