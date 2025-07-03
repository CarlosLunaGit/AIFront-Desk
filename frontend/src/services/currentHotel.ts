// services/currentHotel.ts
export class CurrentHotelService {
    private static hotelId: string = '65a000000000000000000001';
    
    static getCurrentHotelId(): string {
      return this.hotelId;
    }
    
    static setCurrentHotelId(id: string): void {
      this.hotelId = id;
    }
  }

  // TODO: Perhaps we dont need this service anymore?