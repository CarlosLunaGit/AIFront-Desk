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
exports.TwilioAIProvider = void 0;
const twilio_1 = require("twilio");
const logger_1 = require("../../utils/logger");
class TwilioAIProvider {
    constructor() {
        this.ready = false;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured');
        }
        this.client = new twilio_1.Twilio(accountSid, authToken);
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify Twilio credentials by making a test API call
                yield this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
                this.ready = true;
                logger_1.logger.info('Twilio AI Provider initialized successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize Twilio AI Provider:', error);
                throw error;
            }
        });
    }
    processMessage(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ready) {
                throw new Error('Twilio AI Provider not initialized');
            }
            try {
                // For MVP, we'll use a simple response system
                // In production, this would integrate with Twilio's AI services
                const response = yield this.generateBasicResponse(context);
                return {
                    content: response,
                    confidence: 0.8,
                    metadata: {
                        provider: 'twilio',
                        processedAt: new Date().toISOString(),
                    },
                };
            }
            catch (error) {
                logger_1.logger.error('Error processing message with Twilio:', error);
                throw error;
            }
        });
    }
    generateTemplateResponse(templateId, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // For MVP, we'll use predefined templates
            const templates = {
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
        });
    }
    isReady() {
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
    generateBasicResponse(context) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.TwilioAIProvider = TwilioAIProvider;
