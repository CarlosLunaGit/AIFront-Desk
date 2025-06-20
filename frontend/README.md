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
