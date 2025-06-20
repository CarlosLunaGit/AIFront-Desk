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
exports.OpenAIProvider = void 0;
const logger_1 = require("../../utils/logger");
class OpenAIProvider {
    constructor(config = {}) {
        this.initialized = false;
        this.config = {
            apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
            model: config.model || 'gpt-3.5-turbo',
            maxTokens: config.maxTokens || 500,
            temperature: config.temperature || 0.7,
        };
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config.apiKey || this.config.apiKey === 'your-openai-api-key-here') {
                logger_1.logger.warn('⚠️  OpenAI API key not configured. AI features will be disabled for testing.');
                return;
            }
            try {
                // Test API connection with a simple request
                const response = yield fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status}`);
                }
                this.initialized = true;
                logger_1.logger.info('OpenAI provider initialized successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize OpenAI provider:', error);
                throw error;
            }
        });
    }
    processMessage(context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!this.isReady()) {
                // Debug logging to understand why isReady() is false
                logger_1.logger.warn('OpenAI not ready:', {
                    initialized: this.initialized,
                    hasApiKey: !!this.config.apiKey,
                    apiKeyValue: ((_a = this.config.apiKey) === null || _a === void 0 ? void 0 : _a.substring(0, 10)) + '...',
                    isPlaceholder: this.config.apiKey === 'your-openai-api-key-here'
                });
                // Return a fallback response when AI is not configured
                return {
                    content: "Hello! I'm currently in testing mode. Our AI assistant is not fully configured yet, but I'm here to help you with your hotel needs. Please contact our front desk for immediate assistance.",
                    confidence: 0.5,
                    metadata: {
                        model: 'fallback',
                        tokens_used: 0,
                        response_time: Date.now(),
                        fallback: true
                    }
                };
            }
            try {
                const systemPrompt = this.buildSystemPrompt(context);
                const userMessage = context.content;
                logger_1.logger.info('Making OpenAI API call:', {
                    model: this.config.model,
                    userMessage: userMessage.substring(0, 50) + '...',
                    systemPromptLength: systemPrompt.length
                });
                const response = yield fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.config.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage }
                        ],
                        max_tokens: this.config.maxTokens,
                        temperature: this.config.temperature,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status}`);
                }
                const data = yield response.json();
                const aiMessage = ((_c = (_b = data.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
                const confidence = this.calculateConfidence(data, context);
                return {
                    content: aiMessage,
                    confidence,
                    metadata: {
                        model: this.config.model,
                        tokens_used: ((_d = data.usage) === null || _d === void 0 ? void 0 : _d.total_tokens) || 0,
                        response_time: Date.now(),
                    },
                };
            }
            catch (error) {
                logger_1.logger.error('OpenAI processing error:', error);
                throw error;
            }
        });
    }
    generateTemplateResponse(templateId, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = {
                'checkin_early': `The guest is requesting early check-in. Based on hotel policy and room availability, provide a helpful response.`,
                'checkout_late': `The guest is requesting late checkout. Consider hotel policy and room bookings.`,
                'room_service': `The guest is asking about room service. Provide information about availability, menu, and ordering process.`,
                'amenities': `The guest is asking about hotel amenities. Provide comprehensive information about facilities.`,
                'local_attractions': `The guest wants information about local attractions and activities.`,
                'complaint': `The guest has a complaint. Respond professionally and offer solutions.`,
            };
            const template = templates[templateId];
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }
            const enhancedContext = Object.assign(Object.assign({}, context), { content: `${template}\n\nGuest message: ${context.content}` });
            return this.processMessage(enhancedContext);
        });
    }
    isReady() {
        return this.initialized && !!this.config.apiKey && this.config.apiKey !== 'your-openai-api-key-here';
    }
    getCapabilities() {
        return {
            supportsVoice: false,
            supportsTemplates: true,
            maxMessageLength: 4000,
            supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
        };
    }
    buildSystemPrompt(context) {
        var _a, _b, _c, _d, _e;
        const hotelName = ((_a = context.metadata) === null || _a === void 0 ? void 0 : _a.hotelName) || 'our hotel';
        const sessionState = ((_b = context.metadata) === null || _b === void 0 ? void 0 : _b.sessionState) || 'greeting';
        const isReservationRequest = (_c = context.metadata) === null || _c === void 0 ? void 0 : _c.isReservationRequest;
        const conversationHistory = ((_d = context.metadata) === null || _d === void 0 ? void 0 : _d.conversationHistory) || [];
        const reservationData = ((_e = context.metadata) === null || _e === void 0 ? void 0 : _e.reservationData) || {};
        let systemPrompt = `You are an AI hotel receptionist for ${hotelName}. Your role is to:

1. Provide helpful, professional, and courteous responses to guest inquiries
2. Handle hotel reservations, room service, amenities info, and local recommendations
3. Maintain a warm, welcoming tone while being efficient and informative
4. Use natural, conversational language appropriate for ${context.channel} messaging

Current Context:
- Hotel: ${hotelName}
- Channel: ${context.channel}
- Conversation State: ${sessionState}`;
        if (isReservationRequest) {
            systemPrompt += `
- Guest is interested in making a reservation
- Guide them through the booking process naturally`;
        }
        if (conversationHistory.length > 0) {
            systemPrompt += `
- Recent conversation context available
- Continue the conversation naturally based on previous messages`;
        }
        if (Object.keys(reservationData).length > 0) {
            systemPrompt += `
- Reservation in progress with data: ${JSON.stringify(reservationData)}
- Use this information to provide contextual responses`;
        }
        systemPrompt += `

Guidelines:
- Keep responses concise but complete (2-3 sentences max for WhatsApp)
- Always be helpful and offer additional assistance
- If you cannot handle a request, politely direct to front desk
- Use professional hospitality language with a friendly tone
- For reservations, guide guests through dates, guest count, and contact info naturally
- Don't be overly formal - match the guest's tone while remaining professional

Respond as a knowledgeable, friendly hotel receptionist who genuinely wants to help.`;
        return systemPrompt;
    }
    calculateConfidence(data, context) {
        var _a, _b, _c;
        let confidence = 0.8; // Base confidence
        // Adjust based on response length (very short or very long responses might be less confident)
        const responseLength = ((_c = (_b = (_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.length) || 0;
        if (responseLength < 20 || responseLength > 1000) {
            confidence -= 0.1;
        }
        // Adjust based on message clarity (simple heuristic)
        const userMessage = context.content.toLowerCase();
        const clarityKeywords = ['please', 'help', 'can you', 'would like', 'need'];
        const hasClarityKeywords = clarityKeywords.some(keyword => userMessage.includes(keyword));
        if (hasClarityKeywords) {
            confidence += 0.1;
        }
        // Adjust based on common hotel topics
        const hotelKeywords = ['room', 'check', 'service', 'hotel', 'booking', 'reservation'];
        const hasHotelKeywords = hotelKeywords.some(keyword => userMessage.includes(keyword));
        if (hasHotelKeywords) {
            confidence += 0.1;
        }
        // Ensure confidence is within bounds
        return Math.max(0, Math.min(1, confidence));
    }
}
exports.OpenAIProvider = OpenAIProvider;
