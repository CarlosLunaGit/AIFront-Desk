# AI Front-Desk

An AI-powered hotel receptionist system that automates guest communications and hotel operations.

## Project Structure

This is a monorepo containing both frontend and backend services:

- `frontend/`: React-based web application
- `backend/`: Node.js/Express backend service

## Features

- 🤖 AI-powered guest communication (Support for Phone Calls, emails and messaging)
- 💬 WhatsApp integration for guest messaging
- 📱 Modern, responsive web interface
- 🔒 Secure authentication and authorization
- 📊 Real-time analytics and reporting
- 💳 Tiered subscription system

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
   # Frontend
   cp frontend/.env.example frontend/.env
   
   # Backend
   cp backend/.env.example backend/.env
   ```
3. Update the environment variables with your credentials

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

## Mock Service Worker (MSW)

The frontend uses MSW to mock API endpoints during development. This allows for:
- Development without a backend
- Consistent API behavior
- Easy testing of different scenarios

Mock endpoints are defined in `frontend/src/mocks/handlers.ts` and include:
- Authentication
- Guest communications
- Dashboard statistics
- Room management
- Subscription management

To modify mock data or add new endpoints, edit the handlers file and restart the development server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
