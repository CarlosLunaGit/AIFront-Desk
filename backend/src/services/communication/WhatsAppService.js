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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
    }
    sendMessage(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/messages`, {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: message
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                logger_1.logger.info('WhatsApp message sent:', {
                    to,
                    messageId: (_b = (_a = response.data.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id,
                    status: response.status
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('WhatsApp message send error:', {
                    error: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message,
                    to,
                    message: message.substring(0, 100)
                });
                return false;
            }
        });
    }
    sendTemplate(to_1, templateName_1) {
        return __awaiter(this, arguments, void 0, function* (to, templateName, languageCode = 'en', parameters) {
            var _a, _b, _c;
            try {
                const templateMessage = {
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
                const response = yield axios_1.default.post(`${this.baseUrl}/messages`, templateMessage, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                logger_1.logger.info('WhatsApp template sent:', {
                    to,
                    template: templateName,
                    messageId: (_b = (_a = response.data.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('WhatsApp template send error:', {
                    error: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message,
                    to,
                    template: templateName
                });
                return false;
            }
        });
    }
    sendInteractiveMessage(to, headerText, bodyText, buttons) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/messages`, {
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
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                logger_1.logger.info('WhatsApp interactive message sent:', {
                    to,
                    messageId: (_b = (_a = response.data.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('WhatsApp interactive message error:', {
                    error: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message,
                    to
                });
                return false;
            }
        });
    }
    markAsRead(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.post(`${this.baseUrl}/messages`, {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return true;
            }
            catch (error) {
                logger_1.logger.error('WhatsApp mark as read error:', error);
                return false;
            }
        });
    }
    getMediaUrl(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                return response.data.url;
            }
            catch (error) {
                logger_1.logger.error('WhatsApp get media URL error:', error);
                return null;
            }
        });
    }
    isValidPhoneNumber(phoneNumber) {
        // Basic validation for international phone numbers
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let formatted = phoneNumber.replace(/[^\d+]/g, '');
        // Add + if not present
        if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        return formatted;
    }
}
exports.WhatsAppService = WhatsAppService;
