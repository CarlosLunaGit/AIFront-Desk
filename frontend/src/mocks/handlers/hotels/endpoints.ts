import { http, HttpResponse } from 'msw';
import { CurrentHotelService } from '../../../services/currentHotel';

export const hotelsEndpointsHandlers = [

    http.get('/api/hotel/config/current', () => { // TODO: Perhaps not needed, to be removed
        console.log('Debug Hotels 1');
        const currentConfig = CurrentHotelService.getCurrentHotelId();
        if (!currentConfig) {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(currentConfig);
      }),

];
