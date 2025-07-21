// Main handlers export - combines all modular handlers
import { authEndpointsHandlers } from './auth/endpoints';
import { hotelsEndpointsHandlers } from './hotels/endpoints';

import { enhancedReservationHandlers, reservationEndpointsHandlers } from './reservations/endpoints';
import { dashboardEndpointsHandlers } from './dashboard/endpoints';
import { roomsEndpointsHandlers } from './rooms/endpoints';
import { guestsEndpointsHandlers } from './guests/endpoints';
import { pricingEndpointsHandlers } from './utils/pricing/endpoints';
import { activityHistoryHandlers } from './activities/endpoints';

// Import existing handlers from the main file temporarily
// We'll gradually move these to their own modules
import { handlers as existingHandlers } from '../handlers';
import { communicationsEndpointsHandlers } from './communications/endpoints';

// Combine all handlers - put modular handlers first so they take precedence
export const handlers = [
  ...authEndpointsHandlers,
  ...hotelsEndpointsHandlers,
  ...dashboardEndpointsHandlers,
  ...communicationsEndpointsHandlers,
  ...enhancedReservationHandlers,
  ...reservationEndpointsHandlers,
  ...roomsEndpointsHandlers,
  ...guestsEndpointsHandlers,
  ...pricingEndpointsHandlers,
  ...activityHistoryHandlers,
  // Keep existing handlers for now but exclude ones we've modularized
  ...existingHandlers.filter(handler => {
    // Get the handler's URL pattern - MSW handlers have different structures
    const handlerString = handler.toString();
    
    // Skip handlers that we've modularized
    if (handlerString.includes('/api/auth/')) return false;
    if (handlerString.includes('/api/reservation-history')) return false;

    if (handlerString.includes('/api/reservations')) return false;
    if (handlerString.includes('/api/rooms')) return false;
    if (handlerString.includes('/api/guests')) return false;
    if (handlerString.includes('/api/hotel')) return false;
    if (handlerString.includes('/api/communications')) return false;
    
    return true;
  })
];

// Export individual handler groups for testing
export {
    authEndpointsHandlers,
    enhancedReservationHandlers,
}; 