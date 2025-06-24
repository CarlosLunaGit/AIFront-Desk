# Frontend Services Structure

## Overview

This folder contains all API and data-fetching logic for the frontend, organized for maintainability, testability, and easy MSW (Mock Service Worker) support.

### Structure

- `axios.ts` — Centralized Axios instance with MSW toggle and interceptors.
- `api/` — Raw API functions, organized by domain (e.g., `hotel.ts`, `room.ts`). No React/Query logic here.
- `hooks/` — React Query hooks, organized by domain (e.g., `useHotel.ts`, `useRooms.ts`).

## MSW (Mock Service Worker) Support

- Toggle MSW by setting `REACT_APP_ENABLE_MOCK_API=true` in your `.env` file.
- When enabled, all API requests are intercepted by MSW for frontend-only development.
- When disabled, requests go to the real backend at `REACT_APP_API_URL`.

## Usage Example

```ts
// In a React component
import { useRooms } from '../services/hooks/useRooms';

const { data: rooms, isLoading } = useRooms();
```

## Adding New Endpoints

1. Add a raw API function in the appropriate file in `api/`.
2. Add a React Query hook in the corresponding file in `hooks/`.
3. Import and use the hook in your component.

## Benefits
- Separation of concerns (API vs. React logic)
- Easy MSW toggle for frontend dev
- Consistent, discoverable, and maintainable 