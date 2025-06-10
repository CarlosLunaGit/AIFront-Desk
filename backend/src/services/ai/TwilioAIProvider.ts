import { Twilio } from 'twilio';
import { IAIProvider, MessageContext, AIResponse } from './IAIProvider';
import { logger } from '../../utils/logger';

export class TwilioAIProvider implements IAIProvider {
  private client: Twilio;
  private ready: boolean = false;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = new Twilio(accountSid, authToken);
  }

  async initialize(): Promise<void> {
    try {
      // Verify Twilio credentials by making a test API call
      await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      this.ready = true;
      logger.info('Twilio AI Provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio AI Provider:', error);
      throw error;
    }
  }

  async processMessage(context: MessageContext): Promise<AIResponse> {
    if (!this.ready) {
      throw new Error('Twilio AI Provider not initialized');
    }

    try {
      // For MVP, we'll use a simple response system
      // In production, this would integrate with Twilio's AI services
      const response = await this.generateBasicResponse(context);
      
      return {
        content: response,
        confidence: 0.8,
        metadata: {
          provider: 'twilio',
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error processing message with Twilio:', error);
      throw error;
    }
  }

  async generateTemplateResponse(
    templateId: string,
    context: MessageContext
  ): Promise<AIResponse> {
    // For MVP, we'll use predefined templates
    const templates: Record<string, string> = {
      welcome: 'Welcome to our hotel! How can I assist you today?',
      checkIn: 'Thank you for choosing our hotel. Your check-in time is 3 PM. Would you like to know more about our services?',
      checkOut: 'Thank you for staying with us. Your check-out time is 11 AM. Would you like to schedule a late check-out?',
      roomService: 'Our room service is available 24/7. What would you like to order?',
    };

    const template = templates[templateId] || templates.welcome;

    return {
      content: template,
      confidence: 1.0,
      metadata: {
        provider: 'twilio',
        templateId,
        processedAt: new Date().toISOString(),
      },
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  getCapabilities() {
    return {
      supportsVoice: true,
      supportsTemplates: true,
      maxMessageLength: 1600, // Twilio's limit for WhatsApp messages
      supportedLanguages: ['en', 'es'], // Add more as needed
    };
  }

  private async generateBasicResponse(context: MessageContext): Promise<string> {
    // Simple keyword-based response system for MVP
    const content = context.content.toLowerCase();
    
    if (content.includes('hello') || content.includes('hi')) {
      return 'Hello! Welcome to our hotel. How can I assist you today?';
    }
    
    if (content.includes('check in') || content.includes('check-in')) {
      return 'Our check-in time is 3 PM. Would you like to know more about our check-in process?';
    }
    
    if (content.includes('check out') || content.includes('check-out')) {
      return 'Our check-out time is 11 AM. Would you like to schedule a late check-out?';
    }
    
    if (content.includes('room service')) {
      return 'Our room service is available 24/7. What would you like to order?';
    }
    
    if (content.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    return "I'm here to help! Could you please provide more details about your request?";
  }
} 