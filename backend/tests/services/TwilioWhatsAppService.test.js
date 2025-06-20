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
const TwilioWhatsAppService_1 = require("../../src/services/communication/TwilioWhatsAppService");
// Mock Twilio module
jest.mock('twilio', () => {
    return jest.fn().mockImplementation(() => ({
        messages: {
            create: jest.fn()
        },
        webhooks: {
            validateRequest: jest.fn()
        }
    }));
});
describe('TwilioWhatsAppService', () => {
    let service;
    let mockTwilioClient;
    beforeEach(() => {
        // Reset environment variables
        process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
        process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
        process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
        // Clear all mocks
        jest.clearAllMocks();
        // Create service instance
        service = new TwilioWhatsAppService_1.TwilioWhatsAppService();
        // Get mock client reference
        const Twilio = require('twilio');
        mockTwilioClient = Twilio.mock.results[Twilio.mock.results.length - 1].value;
    });
    describe('constructor', () => {
        it('should initialize with valid Twilio credentials', () => {
            expect(service).toBeDefined();
        });
        it('should handle missing credentials gracefully', () => {
            delete process.env.TWILIO_ACCOUNT_SID;
            delete process.env.TWILIO_AUTH_TOKEN;
            const serviceWithoutCreds = new TwilioWhatsAppService_1.TwilioWhatsAppService();
            expect(serviceWithoutCreds).toBeDefined();
        });
    });
    describe('sendMessage', () => {
        it('should send WhatsApp message successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResponse = {
                sid: 'SM123456789',
                status: 'queued'
            };
            mockTwilioClient.messages.create.mockResolvedValue(mockResponse);
            const result = yield service.sendMessage('+46722083756', 'Test message');
            expect(result).toBe(true);
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                body: 'Test message',
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+46722083756'
            });
        }));
        it('should handle phone numbers with whatsapp: prefix', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResponse = { sid: 'SM123456789', status: 'queued' };
            mockTwilioClient.messages.create.mockResolvedValue(mockResponse);
            const result = yield service.sendMessage('whatsapp:+46722083756', 'Test message');
            expect(result).toBe(true);
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                body: 'Test message',
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+46722083756'
            });
        }));
        it('should handle API errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            mockTwilioClient.messages.create.mockRejectedValue(new Error('API Error'));
            const result = yield service.sendMessage('+46722083756', 'Test message');
            expect(result).toBe(false);
        }));
        it('should return false when client is not configured', () => __awaiter(void 0, void 0, void 0, function* () {
            delete process.env.TWILIO_ACCOUNT_SID;
            delete process.env.TWILIO_AUTH_TOKEN;
            const unconfiguredService = new TwilioWhatsAppService_1.TwilioWhatsAppService();
            const result = yield unconfiguredService.sendMessage('+46722083756', 'Test message');
            expect(result).toBe(false);
        }));
    });
    describe('sendTemplate', () => {
        it('should send template message with parameters', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResponse = { sid: 'SM123456789', status: 'queued' };
            mockTwilioClient.messages.create.mockResolvedValue(mockResponse);
            const result = yield service.sendTemplate('+46722083756', 'welcome', ['John Doe']);
            expect(result).toBe(true);
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                body: 'Template: welcome\n\nDetails:\nJohn Doe',
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+46722083756'
            });
        }));
        it('should send template message without parameters', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockResponse = { sid: 'SM123456789', status: 'queued' };
            mockTwilioClient.messages.create.mockResolvedValue(mockResponse);
            const result = yield service.sendTemplate('+46722083756', 'welcome');
            expect(result).toBe(true);
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                body: 'Template: welcome',
                from: 'whatsapp:+14155238886',
                to: 'whatsapp:+46722083756'
            });
        }));
    });
    describe('phone number utilities', () => {
        it('should validate correct phone numbers', () => {
            expect(service.isValidPhoneNumber('+46722083756')).toBe(true);
            expect(service.isValidPhoneNumber('46722083756')).toBe(true);
            expect(service.isValidPhoneNumber('+1234567890')).toBe(true);
        });
        it('should reject invalid phone numbers', () => {
            expect(service.isValidPhoneNumber('invalid')).toBe(false);
            expect(service.isValidPhoneNumber('123')).toBe(false);
            expect(service.isValidPhoneNumber('')).toBe(false);
        });
        it('should format phone numbers correctly', () => {
            expect(service.formatPhoneNumber('46722083756')).toBe('+46722083756');
            expect(service.formatPhoneNumber('+46722083756')).toBe('+46722083756');
            expect(service.formatPhoneNumber('(555) 123-4567')).toBe('+5551234567');
        });
    });
    describe('webhook validation', () => {
        it('should validate webhook requests', () => {
            mockTwilioClient.webhooks.validateRequest.mockReturnValue(true);
            const result = service.validateWebhook('signature', 'url', {});
            expect(result).toBe(true);
            expect(mockTwilioClient.webhooks.validateRequest).toHaveBeenCalled();
        });
        it('should handle validation errors', () => {
            mockTwilioClient.webhooks.validateRequest.mockImplementation(() => {
                throw new Error('Validation error');
            });
            const result = service.validateWebhook('signature', 'url', {});
            expect(result).toBe(false);
        });
    });
});
