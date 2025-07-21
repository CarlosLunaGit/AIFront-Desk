# AI Front-Desk Frontend

The frontend application for the AI-powered hotel receptionist system.

## Tech Stack

- React 18 with TypeScript
- Material-UI (MUI) for components
- React Query for data fetching
- React Router for navigation
- MSW (Mock Service Worker) for API mocking
- Vite for build tooling
- ESLint + Prettier for code quality

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration.

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Project Structure

```
src/
├── components/     # React components
│   ├── Auth/      # Authentication components
│   ├── Dashboard/ # Dashboard components
│   └── Communications/ # Communication interface
├── hooks/         # Custom React hooks
├── mocks/         # MSW mock handlers
├── services/      # API services
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

### Mock Service Worker (MSW)

The project uses MSW to mock API endpoints during development. This allows for:
- Development without a backend
- Consistent API behavior
- Easy testing of different scenarios

Mock endpoints are defined in `src/mocks/handlers.ts` and include:
- Authentication (`/api/auth/*`)
- Guest communications (`/api/communications/*`)
- Dashboard statistics (`/api/dashboard/*`)
- Room management (`/api/rooms/*`)
- Subscription management (`/api/subscriptions/*`)
- **Reservation Management** (`/api/reservations/*`) - Complete CRUD operations
- **Reservation History** (`/api/reservation-history`) - Comprehensive audit trails
- **Activity History** (`/api/activity-history`) - System-wide activity tracking

To modify mock data or add new endpoints:
1. Edit `src/mocks/handlers.ts`
2. Restart the development server

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

Run `npm run lint` to check for code style issues.

## Testing

To run tests:
```bash
npm test
```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

The built files will be in the `dist` directory.

## Contributing

1. Follow the code style guidelines
2. Write tests for new features
3. Update documentation as needed
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Recent Features

### ✅ **Complete Reservation History System (December 2024)**

The Reservations History page now includes comprehensive audit trail functionality:

#### **Core Features:**
- **Accurate Change Detection**: Only tracks fields that were actually modified
- **Guest Information Display**: Shows proper guest names in history table
- **Detailed Change Modal**: View before/after states for any reservation edit
- **Date Normalization**: Consistent date format handling (YYYY-MM-DD)
- **History Actions**: Tracks creation, edits, status changes, and deletions

#### **Technical Implementation:**
- **Modular MSW Handlers**: Organized in `src/mocks/handlers/reservations/endpoints.ts`
- **Type-Safe Interfaces**: Full TypeScript support for history data structures
- **Real-time Updates**: History updates instantly when reservations are modified
- **Data Consistency**: Proper field mapping between reservation data and history records

#### **Bug Fixes Completed:**
- ✅ **Modal Field Highlighting**: Fixed false "changed" indicators for unchanged fields
- ✅ **Guest Names Display**: Resolved missing guest information in history table
- ✅ **Date Format Issues**: Normalized timestamp vs date-only format comparisons
- ✅ **Notes Accuracy**: Eliminated false change notifications in history notes

### Advanced Reservation Calendar

The Reservations page now includes a professional calendar view with:

- **Month/Week Toggle**: Switch between monthly overview and detailed weekly view
- **Proper Calendar Layout**: Traditional Monday-Sunday week structure
- **Dynamic Room Legend**: Shows only rooms with reservations in current view
- **Accessibility-Compliant Colors**: WCAG compliant color system with smart text contrast
- **Visual Indicators**: Dotted borders for check-in (green) and check-out (orange) days
- **Enhanced Tooltips**: Detailed reservation information on hover
- **Click-to-Details**: Comprehensive reservation dialog
- **Mobile Responsive**: Works perfectly on all device sizes
- **Scalable Design**: Adapts to any hotel size (5 rooms to 50+ rooms)

### Intelligent Calendar Search System

Advanced search functionality that enhances the calendar experience:

- **Multi-Field Search**: Search by guest names, room numbers, reservation IDs, confirmation numbers, notes, and special requests
- **Intelligent Navigation**: Automatically navigates to matching reservations across different months and years
- **Search Result Navigation**: Browse between multiple results with "Result 1 of 3" navigation buttons
- **Dynamic Filtering**: Calendar shows only matching reservations when searching
- **View Preservation**: Maintains user's preferred month/week view during search operations
- **Visual Highlighting**: Search results highlighted with special borders and glow effects
- **Real-time Results**: Instant search with live result counts and navigation

### Technical Implementation

- **Smart Color System**: Uses luminance calculation to determine optimal text color
- **Memoized Performance**: Efficient calculations with proper dependency management
- **Material-UI Integration**: Consistent design system throughout
- **TypeScript Safety**: Full type checking and interfaces
- **Search State Management**: Sophisticated search index tracking for multi-result navigation
- **Date Navigation Logic**: Handles year and month transitions automatically
- **Performance Optimizations**: 
  - Fixed infinite loop issues in ReservationCalendar component
  - Prevented state updates during render cycles
  - Optimized useEffect and useMemo dependencies
  - Added navigation protection with ref-based state tracking

## Troubleshooting

### Reservation History Issues

#### **✅ RESOLVED: Notes Showing Incorrect Changes**
- **Issue**: History notes showed false change notifications (e.g., dates changed when only price was modified)
- **Solution**: Implemented proper date normalization and field comparison logic
- **Status**: Fixed in latest version

#### **✅ RESOLVED: Guest Names Missing**
- **Issue**: Guest(s) column in history table was empty
- **Solution**: Added `guestIds` to both `previousState` and `newState` in history records
- **Status**: Fixed in latest version

#### **✅ RESOLVED: Modal Field Highlighting**
- **Issue**: All fields showed as "changed" (blue) even when only one field was modified
- **Solution**: Fixed data type consistency between history states and comparison logic
- **Status**: Fixed in latest version

### Reservation Notes Not Appearing

If you create a reservation and the notes do not appear in the Reservations table, this may be due to a bug in the reservation creation handler (mock or backend). The notes field should be saved and displayed for each reservation. Check the handler logic to ensure the notes are copied from the request to the reservation object.

## Next Development Phases

### **Phase 1: Stripe Integration (Frontend-Only with MSW)**
- Mock Stripe API endpoints for subscription management
- Payment processing simulation
- Subscription tier management
- Test credit card workflows
- No backend required - continue with MSW approach

### **Phase 2: Backend Integration**
- Real Stripe API integration
- Database persistence
- Authentication system
- Production deployment

The MSW approach allows complete frontend development and testing without backend dependencies, making it ideal for rapid prototyping and demonstration.
