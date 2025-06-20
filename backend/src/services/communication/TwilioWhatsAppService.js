"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWhatsAppService = void 0;
const Twilio = require('twilio');
const logger_1 = require("../../utils/logger");
class TwilioWhatsAppService {
    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            logger_1.logger.warn('⚠️  Twilio credentials not configured. WhatsApp features will be disabled for testing.');
            this.client = null;
            this.fromNumber = 'whatsapp:+14155238886'; // Twilio sandbox number
            return;
        }
        this.client = new Twilio(accountSid, authToken);
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number
    }
    sendMessage(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                logger_1.logger.warn('⚠️  Twilio client not configured. Message not sent:', { to, message: message.substring(0, 50) + '...' });
                return false;
            }
            try {
                // Ensure the 'to' number has the whatsapp: prefix
                const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
                const messageResult = yield this.client.messages.create({
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
        });
    }
    sendTemplate(to, templateName, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // For Twilio, we'll use regular messages with formatted content
                // In production, you'd use approved WhatsApp templates
                const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
                let templateMessage = `Template: ${templateName}`;
                if (parameters && parameters.length > 0) {
                    templateMessage += `\n\nDetails:\n${parameters.join('\n')}`;
                }
                const messageResult = yield this.client.messages.create({
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
        });
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
