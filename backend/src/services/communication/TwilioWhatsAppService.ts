const Twilio = require('twilio');
import { logger } from '../../utils/logger';

export class TwilioWhatsAppService {
  private client: any;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      logger.warn('⚠️  Twilio credentials not configured. WhatsApp features will be disabled for testing.');
      this.client = null;
      this.fromNumber = 'whatsapp:+14155238886'; // Twilio sandbox number
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('⚠️  Twilio client not configured. Message not sent:', { to, message: message.substring(0, 50) + '...' });
      return false;
    }

    try {
      // Ensure the 'to' number has the whatsapp: prefix
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const messageResult = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedTo
      });

      logger.info('Twilio WhatsApp message sent:', {
        to: formattedTo,
        messageSid: messageResult.sid,
        status: messageResult.status
      });

      return true;
    } catch (error: any) {
      logger.error('Twilio WhatsApp message send error:', {
        error: error.message,
        code: error.code,
        to,
        message: message.substring(0, 100)
      });
      
      return false;
    }
  }

  async sendTemplate(
    to: string, 
    templateName: string, 
    parameters?: string[]
  ): Promise<boolean> {
    try {
      // For Twilio, we'll use regular messages with formatted content
      // In production, you'd use approved WhatsApp templates
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      let templateMessage = `Template: ${templateName}`;
      if (parameters && parameters.length > 0) {
        templateMessage += `\n\nDetails:\n${parameters.join('\n')}`;
      }

      const messageResult = await this.client.messages.create({
        body: templateMessage,
        from: this.fromNumber,
        to: formattedTo
      });

      logger.info('Twilio WhatsApp template sent:', {
        to: formattedTo,
        template: templateName,
        messageSid: messageResult.sid
      });

      return true;
    } catch (error: any) {
      logger.error('Twilio WhatsApp template send error:', {
        error: error.message,
        code: error.code,
        to,
        template: templateName
      });
      
      return false;
    }
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanNumber);
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  // Webhook verification for Twilio
  validateWebhook(signature: string, url: string, params: any): boolean {
    try {
      return this.client.webhooks.validateRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        signature,
        url,
        params
      );
    } catch (error) {
      logger.error('Twilio webhook validation error:', error);
      return false;
    }
  }
}
