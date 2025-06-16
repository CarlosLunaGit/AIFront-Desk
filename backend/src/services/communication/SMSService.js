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
exports.SMSService = void 0;
const logger_1 = require("../../utils/logger");
class MockTwilioClient {
    constructor() {
        this.messages = {
            create: (messageData) => __awaiter(this, void 0, void 0, function* () {
                logger_1.logger.info('Mock SMS sent:', messageData);
                return Object.assign({ sid: `SM${Date.now()}`, status: 'queued' }, messageData);
            })
        };
    }
}
class SMSService {
    constructor() {
        // In production, use: const twilio = require('twilio');
        // this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.client = new MockTwilioClient();
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
    }
    sendMessage(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.messages.create({
                    body: message,
                    to: to,
                    from: this.fromNumber
                });
                logger_1.logger.info('SMS sent:', {
                    to,
                    messageId: result.sid,
                    status: result.status
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('SMS send error:', {
                    error: error.message,
                    to,
                    message: message.substring(0, 100)
                });
                return false;
            }
        });
    }
    sendBulkMessage(recipients, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = { success: [], failed: [] };
            for (const recipient of recipients) {
                const success = yield this.sendMessage(recipient, message);
                if (success) {
                    results.success.push(recipient);
                }
                else {
                    results.failed.push(recipient);
                }
            }
            return results;
        });
    }
    isValidPhoneNumber(phoneNumber) {
        // Basic validation for phone numbers
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber.replace(/[^\d+]/g, ''));
    }
    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let formatted = phoneNumber.replace(/[^\d+]/g, '');
        // Add + if not present and doesn't start with 1
        if (!formatted.startsWith('+') && !formatted.startsWith('1')) {
            formatted = '+1' + formatted;
        }
        else if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        return formatted;
    }
    getMessageStatus(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // In production, use Twilio's message status API
                logger_1.logger.info('Getting message status:', { messageId });
                return 'delivered';
            }
            catch (error) {
                logger_1.logger.error('Error getting message status:', error);
                return null;
            }
        });
    }
}
exports.SMSService = SMSService;
