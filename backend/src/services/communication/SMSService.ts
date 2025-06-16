import { logger } from '../../utils/logger';

// Mock Twilio client for now - will be replaced with real Twilio
interface TwilioMessage {
  body: string;
  to: string;
  from: string;
}

class MockTwilioClient {
  messages = {
    create: async (messageData: TwilioMessage) => {
      logger.info('Mock SMS sent:', messageData);
      return {
        sid: `SM${Date.now()}`,
        status: 'queued',
        ...messageData
      };
    }
  };
}

export class SMSService {
  private client: MockTwilioClient;
  private fromNumber: string;

  constructor() {
    // In production, use: const twilio = require('twilio');
    // this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    this.client = new MockTwilioClient();
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber
      });

      logger.info('SMS sent:', {
        to,
        messageId: result.sid,
        status: result.status
      });

      return true;
    } catch (error: any) {
      logger.error('SMS send error:', {
        error: error.message,
        to,
        message: message.substring(0, 100)
      });
      
      return false;
    }
  }

  async sendBulkMessage(recipients: string[], message: string): Promise<{ success: string[]; failed: string[] }> {
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const recipient of recipients) {
      const success = await this.sendMessage(recipient, message);
      if (success) {
        results.success.push(recipient);
      } else {
        results.failed.push(recipient);
      }
    }

    return results;
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[^\d+]/g, ''));
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present and doesn't start with 1
    if (!formatted.startsWith('+') && !formatted.startsWith('1')) {
      formatted = '+1' + formatted;
    } else if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  async getMessageStatus(messageId: string): Promise<string | null> {
    try {
      // In production, use Twilio's message status API
      logger.info('Getting message status:', { messageId });
      return 'delivered';
    } catch (error) {
      logger.error('Error getting message status:', error);
      return null;
    }
  }
} 