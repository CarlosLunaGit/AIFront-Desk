"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWhatsAppService = void 0;
const twilio_1 = require("twilio");
const logger_1 = require("../../utils/logger");
class TwilioWhatsAppService {
    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured');
        }
        this.client = new twilio_1.Twilio(accountSid, authToken);
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number
    }
    async sendMessage(to, message) {
        try {
            // Ensure the 'to' number has the whatsapp: prefix
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const messageResult = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: formattedTo
            });
            logger_1.logger.info('Twilio WhatsApp message sent:', {
                to: formattedTo,
                messageSid: messageResult.sid,
                status: messageResult.status
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Twilio WhatsApp message send error:', {
                error: error.message,
                code: error.code,
                to,
                message: message.substring(0, 100)
            });
            return false;
        }
    }
    async sendTemplate(to, templateName, parameters) {
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
            logger_1.logger.info('Twilio WhatsApp template sent:', {
                to: formattedTo,
                template: templateName,
                messageSid: messageResult.sid
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Twilio WhatsApp template send error:', {
                error: error.message,
                code: error.code,
                to,
                template: templateName
            });
            return false;
        }
    }
    isValidPhoneNumber(phoneNumber) {
        // Basic validation for phone numbers
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanNumber);
    }
    formatPhoneNumber(phoneNumber) {
        // Remove non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        // Add + if not present
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        return cleaned;
    }
    // Webhook verification for Twilio
    validateWebhook(signature, url, params) {
        try {
            return this.client.webhooks.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
        }
        catch (error) {
            logger_1.logger.error('Twilio webhook validation error:', error);
            return false;
        }
    }
}
exports.TwilioWhatsAppService = TwilioWhatsAppService;
