# AI Front-Desk

An AI-powered hotel receptionist system that automates guest communications and hotel operations.

## Project Structure

This is a monorepo containing both frontend and backend services:

- `frontend/`: React-based web application
- `backend/`: Node.js/Express backend service

## Features

- 🤖 AI-powered guest communication (Support for Phone Calls, emails and messaging)
- 📱 WhatsApp integration for guest messaging
- 💻 Modern, responsive web interface
- 🔐 Secure authentication and authorization
- 📊 Real-time analytics and reporting
- 💳 Tiered subscription system
- 🏨 **Sophisticated Room Availability Engine** - Advanced date-based conflict detection for preventing double-bookings
- 📅 **Date-Based Room Status Management** - Room Management page with date selector showing accurate status for any selected date
- 🗓️ **Advanced Reservation Calendar** - Professional calendar view with month/week toggle, dynamic room legends, and accessibility-compliant color system
- 🔍 **Intelligent Calendar Search** - Advanced search functionality with automatic navigation to matching reservations across different dates and years, optimized for performance and stability

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- WhatsApp Business API credentials
- OpenAI API key

### Environment Setup

1. Clone the repository
2. Copy the example environment files:
    ```bash
    # Backend
    cp backend/.env.example backend/.env
    ```
3. Update the environment variables with your credentials (see Environment Variables section below)

### Frontend Development

The frontend uses:
- React with TypeScript
- Material-UI for components
- MSW (Mock Service Worker) for API mocking in development
- React Query for data fetching
- React Router for navigation

To start the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

The development server includes:
- Hot module replacement
- Mock API endpoints (via MSW)
- TypeScript type checking
- ESLint for code quality
- **Advanced room availability simulation** with date-based conflict detection

### Backend Development

The backend uses:
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- OpenAI API for AI features
- WhatsApp Business API for messaging

To start the backend development server:

```bash
cd backend
npm install
npm run dev
```

## Room Availability System

The application features a sophisticated room availability engine that:

- ✅ **Prevents Double-Booking**: Uses advanced date overlap detection `(requestStart < resEnd) && (resStart < requestEnd)`
- ✅ **Real Reservation Integration**: Creates actual reservation records for accurate future availability checks
- ✅ **Multi-Date Support**: Correctly handles different date ranges for the same room
- ✅ **Active Reservation Filtering**: Only considers active reservations for conflict detection
- ✅ **Detailed Conflict Reporting**: Provides clear reasons when rooms are unavailable

### Test Scenarios Supported:
- **Same room, different dates** → Available (no conflict)
- **Same room, overlapping dates** → Unavailable (date conflict detected)
- **Different rooms, same dates** → Available (no room conflict)
- **Partial date overlap** → Unavailable (sophisticated overlap detection)

## Date-Based Room Status Management

The Room Management page features a sophisticated date selector system that:

- ✅ **Date Selector Interface**: Choose any date to view room statuses for that specific day
- ✅ **Real-Time Status Updates**: Room statuses update instantly when changing dates
- ✅ **Accurate Business Logic**: Follows hotel industry standards (inclusive check-in, inclusive check-out until guest leaves)
- ✅ **Detailed Information**: Shows guest count and reservation details per selected date
- ✅ **Today Default**: Automatically defaults to current date for immediate operational use

### Example Usage:
- **Select January 15, 2024**: Room 101 shows "Reserved" (guest check-in day)
- **Select January 18, 2024**: Room 101 shows "Reserved" (guest checkout day - still occupied until departure)
- **Select January 19, 2024**: Room 101 shows "Available" (after guest departure, room ready for new booking)

## Advanced Reservation Calendar

The Reservations page features a professional calendar view with comprehensive functionality:

### **Visual Features:**
- 🗓️ **Month/Week Toggle**: Switch between monthly overview and detailed weekly view
- 📅 **Proper Calendar Layout**: Traditional Monday-Sunday week structure with proper calendar grid
- 🎨 **Color-Coded Rooms**: Each room gets a unique, accessibility-compliant color with smart text contrast
- 📋 **Dynamic Legend**: Shows only rooms with reservations in current view (adapts to hotel size)
- 🔍 **Visual Indicators**: Dotted borders for check-in (green) and check-out (orange) days
- 💬 **Enhanced Tooltips**: Detailed reservation information on hover
- 👆 **Click-to-Details**: Comprehensive reservation dialog with full guest and booking information

### **Advanced Search Functionality:**
- 🔍 **Multi-Field Search**: Search by guest names, room numbers, reservation IDs, confirmation numbers, notes, and special requests
- 🧭 **Intelligent Navigation**: Automatically navigates to matching reservations across different months and years
- 🎯 **Search Result Navigation**: Browse between multiple search results with "Result 1 of 3" navigation buttons
- 📊 **Dynamic Filtering**: Calendar shows only matching reservations when searching, with clear result counts
- 🔄 **View Preservation**: Maintains user's preferred month/week view during search operations
- ✨ **Visual Highlighting**: Search results are highlighted with special borders and glow effects
- ⚡ **Performance Optimized**: Prevents infinite loops and state updates during render for smooth user experience

### **Accessibility & UX:**
- ♿ **WCAG Compliant Colors**: Smart text color selection (black/white) based on background brightness
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🎨 **Professional Design**: Material-UI consistency with hotel industry standards
- 📏 **Scalable Interface**: Adapts to any hotel size (5 rooms to 50+ rooms)

### **Operational Benefits:**
- ⚡ **Instant Daily Overview**: Quick identification of check-ins, check-outs, and active reservations
- 🔧 **Flexible Planning**: Month view for strategic planning, week view for operational details
- 🏨 **Room Assignment Clarity**: Color-coded system makes room identification effortless
- 👥 **Staff Efficiency**: Reduces time spent searching for reservation information
- 🔍 **Advanced Search**: Find any reservation instantly by guest name, room number, or any other detail

## Environment Variables

The application requires several environment variables to be configured in `backend/.env`. Copy `backend/.env.example` to `backend/.env` and update the values:

### Server Configuration
```bash
PORT=3001                                         # Port for the backend server
NODE_ENV=development                   # Environment: development, production
LOG_LEVEL=debug                           # Logging level: error, warn, info, debug
```

### Database Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/ai-hotel-receptionist
# MongoDB connection string
# For local development: mongodb://localhost:27017/ai-hotel-receptionist
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database
```

### Authentication
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
# Secret key for JWT token signing - MUST be changed in production
JWT_EXPIRES_IN=7d                       # Token expiration time (7 days)
```

### Twilio Configuration (WhatsApp/SMS)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

**How to get Twilio credentials:**
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a phone number or use WhatsApp Business API sandbox
4. Configure webhook URL: `https://yourdomain.com/api/communications/receive`

### OpenAI Configuration (AI Responses)
```bash
OPENAI_API_KEY=your-openai-api-key
```

**How to get OpenAI API key:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. **Important:** Set up billing to avoid 404 errors (free tier has limitations)

### Stripe Configuration (Payments - Optional)
```bash
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

**How to get Stripe credentials:**
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your secret key from API keys section
3. Set up webhook endpoint for subscription management

### Additional Configuration
```bash
AI_PROVIDER=openai                     # AI provider: openai, twilio
FRONTEND_URL=http://localhost:3000     # Frontend URL for CORS
DEBUG=true                                     # Enable debug logging
```

### Security Notes

⚠️ **IMPORTANT SECURITY GUIDELINES:**

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong JWT secrets** - Generate random strings for production
3. **Rotate API keys regularly** - Especially in production environments
4. **Use environment-specific values** - Different keys for dev/staging/production
5. **Enable billing on OpenAI** - Free tier has strict rate limits

### Environment File Example

Your `backend/.env` should look like this (with real values):

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-hotel-receptionist

# JWT Authentication
JWT_SECRET=super-secret-key-change-in-production-abc123xyz789
JWT_EXPIRES_IN=7d

# Twilio Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456789

# Frontend URL
FRONTEND_URL=http://localhost:3000
```