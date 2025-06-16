import axios from 'axios';
import { logger } from '../../utils/logger';

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp message sent:', {
        to,
        messageId: response.data.messages?.[0]?.id,
        status: response.status
      });

      return true;
    } catch (error: any) {
      logger.error('WhatsApp message send error:', {
        error: error.response?.data || error.message,
        to,
        message: message.substring(0, 100)
      });
      
      return false;
    }
  }

  async sendTemplate(
    to: string, 
    templateName: string, 
    languageCode: string = 'en',
    parameters?: string[]
  ): Promise<boolean> {
    try {
      const templateMessage: any = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      if (parameters && parameters.length > 0) {
        templateMessage.template.components = [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ];
      }

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        templateMessage,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp template sent:', {
        to,
        template: templateName,
        messageId: response.data.messages?.[0]?.id
      });

      return true;
    } catch (error: any) {
      logger.error('WhatsApp template send error:', {
        error: error.response?.data || error.message,
        to,
        template: templateName
      });
      
      return false;
    }
  }

  async sendInteractiveMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            header: {
              type: 'text',
              text: headerText
            },
            body: {
              text: bodyText
            },
            action: {
              buttons: buttons.map(button => ({
                type: 'reply',
                reply: {
                  id: button.id,
                  title: button.title
                }
              }))
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp interactive message sent:', {
        to,
        messageId: response.data.messages?.[0]?.id
      });

      return true;
    } catch (error: any) {
      logger.error('WhatsApp interactive message error:', {
        error: error.response?.data || error.message,
        to
      });
      
      return false;
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      logger.error('WhatsApp mark as read error:', error);
      return false;
    }
  }

  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.url;
    } catch (error) {
      logger.error('WhatsApp get media URL error:', error);
      return null;
    }
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }
} 