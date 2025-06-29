// Main handlers export - combines all modular handlers
import { authHandlers } from './auth';
import { enhancedReservationHandlers } from './reservations/enhanced';

// Import existing handlers from the main file temporarily
// We'll gradually move these to their own modules
import { handlers as existingHandlers } from '../handlers';

// Combine all handlers - put modular handlers first so they take precedence
export const handlers = [
  ...authHandlers,
  ...enhancedReservationHandlers,
  // Keep existing handlers for now but exclude ones we've modularized
  ...existingHandlers.filter(handler => {
    // Get the handler's URL pattern - MSW handlers have different structures
    const handlerString = handler.toString();
    
    // Skip auth handlers (we have modular versions)
    if (handlerString.includes('/api/auth/')) return false;
    
    // Skip enhanced reservation handlers (we have modular versions)
    if (handlerString.includes('/api/rooms/availability')) return false;
    if (handlerString.includes('/api/reservations/pricing')) return false;
    if (handlerString.includes('/api/reservations/enhanced')) return false;
    
    return true;
  })
];

// Export individual handler groups for testing
export {
  authHandlers,
  enhancedReservationHandlers
}; 