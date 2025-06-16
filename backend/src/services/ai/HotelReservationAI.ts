import { IAIProvider, MessageContext, AIResponse } from './IAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { Room } from '../../models/Room';
import { Guest } from '../../models/Guest';
import { Tenant } from '../../models/Tenant';
import { logger } from '../../utils/logger';

export enum ConversationState {
  GREETING = 'greeting',
  COLLECTING_DATES = 'collecting_dates',
  COLLECTING_GUESTS = 'collecting_guests',
  COLLECTING_PREFERENCES = 'collecting_preferences',
  COLLECTING_CONTACT = 'collecting_contact',
  PAYMENT_PROCESSING = 'payment_processing',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export interface ReservationData {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  roomType?: string;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  estimatedPrice?: number;
  roomId?: string;
}

export interface ConversationSession {
  id: string;
  tenantId: string;
  guestPhone: string;
  state: ConversationState;
  reservationData: ReservationData;
  messages: Array<{
    timestamp: Date;
    from: 'guest' | 'ai';
    content: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory session storage (in production, use Redis)
const conversationSessions = new Map<string, ConversationSession>();

export class HotelReservationAI {
  private openaiProvider: OpenAIProvider;

  constructor() {
    this.openaiProvider = new OpenAIProvider();
  }

  async initialize(): Promise<void> {
    await this.openaiProvider.initialize();
  }

  async processReservationMessage(
    tenantId: string,
    guestPhone: string,
    message: string,
    channel: 'whatsapp' | 'sms'
  ): Promise<AIResponse> {
    try {
      // Get or create conversation session
      const sessionId = `${tenantId}-${guestPhone}`;
      let session = conversationSessions.get(sessionId);
      
      if (!session) {
        session = this.createNewSession(tenantId, guestPhone);
        conversationSessions.set(sessionId, session);
      }

      // Add guest message to session
      session.messages.push({
        timestamp: new Date(),
        from: 'guest',
        content: message
      });

      // Get hotel information
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Hotel not found');
      }

      // Process message based on current state
      const aiResponse = await this.processStateBasedMessage(session, message, tenant);

      // Add AI response to session
      session.messages.push({
        timestamp: new Date(),
        from: 'ai',
        content: aiResponse.content
      });

      // Update session
      session.updatedAt = new Date();
      conversationSessions.set(sessionId, session);

      return aiResponse;
    } catch (error) {
      logger.error('Reservation AI processing error:', error);
      return {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or call our front desk directly.",
        confidence: 0.1,
        metadata: { error: true }
      };
    }
  }

  private createNewSession(tenantId: string, guestPhone: string): ConversationSession {
    return {
      id: `${tenantId}-${guestPhone}-${Date.now()}`,
      tenantId,
      guestPhone,
      state: ConversationState.GREETING,
      reservationData: {},
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async processStateBasedMessage(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    switch (session.state) {
      case ConversationState.GREETING:
        return this.handleGreeting(session, message, tenant);
      
      case ConversationState.COLLECTING_DATES:
        return this.handleDateCollection(session, message, tenant);
      
      case ConversationState.COLLECTING_GUESTS:
        return this.handleGuestCount(session, message, tenant);
      
      case ConversationState.COLLECTING_PREFERENCES:
        return this.handlePreferences(session, message, tenant);
      
      case ConversationState.COLLECTING_CONTACT:
        return this.handleContactCollection(session, message, tenant);
      
      default:
        return this.handleGeneral(session, message, tenant);
    }
  }

  private async handleGreeting(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    const isReservationRequest = this.detectReservationIntent(message);
    
    if (isReservationRequest) {
      session.state = ConversationState.COLLECTING_DATES;
      
      // Try to extract dates from initial message
      const extractedDates = await this.extractDatesFromMessage(message);
      if (extractedDates.checkIn && extractedDates.checkOut) {
        session.reservationData = { ...session.reservationData, ...extractedDates };
        session.state = ConversationState.COLLECTING_GUESTS;
        
        return {
          content: `Great! I found availability for ${extractedDates.checkIn} to ${extractedDates.checkOut}. How many guests will be staying?`,
          confidence: 0.9,
          metadata: { nextState: ConversationState.COLLECTING_GUESTS }
        };
      }
      
      return {
        content: `Hello! Welcome to ${tenant.name}. I'd be happy to help you make a reservation. What dates are you looking to stay with us?`,
        confidence: 0.9,
        metadata: { nextState: ConversationState.COLLECTING_DATES }
      };
    }

    return {
      content: `Hello! Welcome to ${tenant.name}. How can I assist you today? I can help you make reservations, answer questions about our amenities, or provide local recommendations.`,
      confidence: 0.8,
      metadata: { nextState: ConversationState.GREETING }
    };
  }

  private async handleDateCollection(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    const extractedDates = await this.extractDatesFromMessage(message);
    
    if (extractedDates.checkIn && extractedDates.checkOut) {
      // Validate dates
      const checkIn = new Date(extractedDates.checkIn);
      const checkOut = new Date(extractedDates.checkOut);
      const today = new Date();
      
      if (checkIn < today) {
        return {
          content: "I notice the check-in date is in the past. Could you please provide dates starting from today or later?",
          confidence: 0.9,
          metadata: { error: 'invalid_dates' }
        };
      }
      
      if (checkOut <= checkIn) {
        return {
          content: "The check-out date should be after the check-in date. Could you please clarify your dates?",
          confidence: 0.9,
          metadata: { error: 'invalid_dates' }
        };
      }

      // Check availability
      const availability = await this.checkAvailability(
        session.tenantId,
        extractedDates.checkIn,
        extractedDates.checkOut
      );

      if (availability.availableRooms.length === 0) {
        return {
          content: `I'm sorry, but we don't have any rooms available for ${extractedDates.checkIn} to ${extractedDates.checkOut}. Would you like to try different dates?`,
          confidence: 0.9,
          metadata: { availability: false }
        };
      }

      session.reservationData = { ...session.reservationData, ...extractedDates };
      session.state = ConversationState.COLLECTING_GUESTS;

      return {
        content: `Perfect! I have rooms available from ${extractedDates.checkIn} to ${extractedDates.checkOut}. How many guests will be staying?`,
        confidence: 0.9,
        metadata: { 
          nextState: ConversationState.COLLECTING_GUESTS,
          availability: availability.availableRooms.length
        }
      };
    }

    return {
      content: "I didn't quite catch those dates. Could you please tell me your check-in and check-out dates? For example: 'March 15 to March 18' or '3/15 to 3/18'.",
      confidence: 0.7,
      metadata: { needsClarification: true }
    };
  }

  private async handleGuestCount(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    const guestCount = this.extractGuestCount(message);
    
    if (guestCount > 0) {
      session.reservationData.guests = guestCount;
      
      // Find suitable rooms
      const suitableRooms = await this.findSuitableRooms(
        session.tenantId,
        session.reservationData.checkIn!,
        session.reservationData.checkOut!,
        guestCount
      );

      if (suitableRooms.length === 0) {
        return {
          content: `I don't have rooms available for ${guestCount} guests on those dates. We might have availability for fewer guests or different dates. Would you like me to check alternatives?`,
          confidence: 0.9,
          metadata: { noSuitableRooms: true }
        };
      }

      // Calculate pricing
      const recommendedRoom = suitableRooms[0];
      const nights = this.calculateNights(session.reservationData.checkIn!, session.reservationData.checkOut!);
      const totalPrice = recommendedRoom.rate * nights;
      
      session.reservationData.estimatedPrice = totalPrice;
      session.reservationData.roomId = recommendedRoom.id;
      session.state = ConversationState.COLLECTING_CONTACT;

      return {
        content: `Excellent! I have a ${recommendedRoom.typeId} room available for ${guestCount} guest${guestCount > 1 ? 's' : ''} at $${recommendedRoom.rate}/night. Your total for ${nights} night${nights > 1 ? 's' : ''} would be $${totalPrice}.\n\nTo complete your reservation, I'll need your name and email address.`,
        confidence: 0.9,
        metadata: { 
          nextState: ConversationState.COLLECTING_CONTACT,
          pricing: { room: recommendedRoom, total: totalPrice, nights }
        }
      };
    }

    return {
      content: "How many guests will be staying? Please let me know the total number of people.",
      confidence: 0.7,
      metadata: { needsClarification: true }
    };
  }

  private async handleContactCollection(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    // Extract contact information
    const contactInfo = await this.extractContactInfo(message);
    
    if (contactInfo.name) {
      session.reservationData.guestName = contactInfo.name;
    }
    
    if (contactInfo.email) {
      session.reservationData.guestEmail = contactInfo.email;
    }

    // Check if we have all required information
    if (session.reservationData.guestName && session.reservationData.guestEmail) {
      session.state = ConversationState.PAYMENT_PROCESSING;
      
      return {
        content: `Thank you, ${session.reservationData.guestName}! To secure your reservation, I'll need a credit card for authorization (like all hotels do). This is just to hold your room - you can pay at check-in.\n\nPlease provide your credit card number, expiry date (MM/YY), and CVC code.`,
        confidence: 0.9,
        metadata: { 
          nextState: ConversationState.PAYMENT_PROCESSING,
          readyForPayment: true
        }
      };
    }

    // Determine what's still needed
    const needed = [];
    if (!session.reservationData.guestName) needed.push('name');
    if (!session.reservationData.guestEmail) needed.push('email address');

    return {
      content: `I still need your ${needed.join(' and ')}. Could you please provide that information?`,
      confidence: 0.8,
      metadata: { missingInfo: needed }
    };
  }

  private async handlePreferences(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    session.reservationData.specialRequests = message;
    session.state = ConversationState.COLLECTING_CONTACT;

    return {
      content: "I've noted your preferences. Now I'll need your name and email to complete the reservation.",
      confidence: 0.9,
      metadata: { nextState: ConversationState.COLLECTING_CONTACT }
    };
  }

  private async handleGeneral(
    session: ConversationSession,
    message: string,
    tenant: any
  ): Promise<AIResponse> {
    // Use OpenAI for general hotel inquiries
    const context: MessageContext = {
      hotelId: session.tenantId,
      messageType: 'text',
      channel: 'whatsapp',
      content: message,
      metadata: { sessionState: session.state }
    };

    return await this.openaiProvider.processMessage(context);
  }

  // Helper methods
  private detectReservationIntent(message: string): boolean {
    const reservationKeywords = [
      'book', 'reserve', 'reservation', 'stay', 'room', 'available',
      'check in', 'check-in', 'checkout', 'check-out', 'nights'
    ];
    
    const lowerMessage = message.toLowerCase();
    return reservationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async extractDatesFromMessage(message: string): Promise<{ checkIn?: string; checkOut?: string }> {
    // Simple date extraction - in production, use more sophisticated NLP
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})|(\w+ \d{1,2})/g;
    const dates = message.match(dateRegex);
    
    if (dates && dates.length >= 2) {
      return {
        checkIn: this.normalizeDate(dates[0]),
        checkOut: this.normalizeDate(dates[1])
      };
    }
    
    return {};
  }

  private extractGuestCount(message: string): number {
    const numbers = message.match(/\d+/g);
    if (numbers) {
      const count = parseInt(numbers[0]);
      return count > 0 && count <= 10 ? count : 0;
    }
    return 0;
  }

  private async extractContactInfo(message: string): Promise<{ name?: string; email?: string }> {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const email = message.match(emailRegex)?.[0];
    
    // Simple name extraction - look for capitalized words
    const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/;
    const name = message.match(nameRegex)?.[0];
    
    return { name, email };
  }

  private normalizeDate(dateStr: string): string {
    // Simple date normalization - in production, use proper date parsing
    return dateStr;
  }

  private async checkAvailability(tenantId: string, checkIn: string, checkOut: string) {
    const availableRooms = await Room.find({
      hotelConfigId: tenantId, // Note: might need to adjust based on your schema
      status: 'available'
    });

    return { availableRooms };
  }

  private async findSuitableRooms(tenantId: string, checkIn: string, checkOut: string, guests: number) {
    return await Room.find({
      hotelConfigId: tenantId,
      capacity: { $gte: guests },
      status: 'available'
    }).sort({ rate: 1 }); // Sort by price, cheapest first
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get session for external access
  getSession(tenantId: string, guestPhone: string): ConversationSession | undefined {
    return conversationSessions.get(`${tenantId}-${guestPhone}`);
  }

  // Update session state
  updateSessionState(tenantId: string, guestPhone: string, newState: ConversationState): void {
    const sessionId = `${tenantId}-${guestPhone}`;
    const session = conversationSessions.get(sessionId);
    if (session) {
      session.state = newState;
      session.updatedAt = new Date();
      conversationSessions.set(sessionId, session);
    }
  }
} 