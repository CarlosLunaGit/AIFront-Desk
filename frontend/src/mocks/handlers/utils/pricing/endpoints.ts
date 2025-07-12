import { http, HttpResponse } from 'msw';
import { mockRooms, mockRoomTypes } from '../../../data/rooms';

export const pricingEndpointsHandlers = [
 // Pricing calculation API
http.post('/api/pricing/calculate', async ({ request }) => {
    console.log('Debug Pricing /api/pricing/calculate Line 2924');
    const body = await request.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roomIds, checkInDate, checkOutDate, guestCount, hotelId } = body;

    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const breakdown: any[] = [];
    let subtotal = 0;

    roomIds.forEach((roomId: string) => {
      const room = mockRooms.find(r => r._id === roomId);
      const roomType = mockRoomTypes.find(rt => rt._id === room?.typeId);
      
      if (room && roomType) {
        const baseRate = room.rate || 100;
        const baseAmount = baseRate * nights;
        const weekendSurcharge = nights * 20;
        const finalAmount = baseAmount + weekendSurcharge;

        breakdown.push({
          roomId: room._id,
          roomNumber: room.number,
          roomType: roomType.name,
          description: `${roomType.name} - ${nights} night${nights > 1 ? 's' : ''}`,
          baseAmount,
          adjustments: [
            {
              type: 'weekend',
              description: 'Weekend surcharge',
              amount: weekendSurcharge
            }
          ],
          finalAmount
        });

        subtotal += finalAmount;
      }
    });

    const taxes = subtotal * 0.13; // 13% tax
    const fees = nights * 15; // $15 per night resort fee
    const total = subtotal + taxes + fees;

    return HttpResponse.json({
      pricing: {
        breakdown,
        subtotal,
        taxes,
        fees,
        total,
        currency: 'USD'
      },
      breakdown,
      recommendations: {
        savings: [],
        upgrades: []
      }
    });
  }),   
]