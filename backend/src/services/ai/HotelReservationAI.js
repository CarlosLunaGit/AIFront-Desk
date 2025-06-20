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
exports.HotelReservationAI = exports.ConversationState = void 0;
const OpenAIProvider_1 = require("./OpenAIProvider");
const Room_1 = require("../../models/Room");
const Tenant_1 = require("../../models/Tenant");
const Communication_1 = require("../../models/Communication");
const logger_1 = require("../../utils/logger");
var ConversationState;
(function (ConversationState) {
    ConversationState["GREETING"] = "greeting";
    ConversationState["COLLECTING_DATES"] = "collecting_dates";
    ConversationState["COLLECTING_GUESTS"] = "collecting_guests";
    ConversationState["COLLECTING_PREFERENCES"] = "collecting_preferences";
    ConversationState["COLLECTING_CONTACT"] = "collecting_contact";
    ConversationState["PAYMENT_PROCESSING"] = "payment_processing";
    ConversationState["CONFIRMED"] = "confirmed";
    ConversationState["CANCELLED"] = "cancelled";
})(ConversationState || (exports.ConversationState = ConversationState = {}));
// In-memory session storage (in production, use Redis)
const conversationSessions = new Map();
class HotelReservationAI {
    constructor() {
        this.openaiProvider = new OpenAIProvider_1.OpenAIProvider();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.openaiProvider.initialize();
        });
    }
    processReservationMessage(tenantId, guestPhone, message, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get or create conversation session
                const sessionId = `${tenantId}-${guestPhone}`;
                let session = conversationSessions.get(sessionId);
                if (!session) {
                    session = this.createNewSession(tenantId, guestPhone);
                    conversationSessions.set(sessionId, session);
                }
                // Add guest message to session
                session.messages.push({
                    timestamp: new Date(),
                    from: 'guest',
                    content: message
                });
                // Get hotel information
                const tenant = yield Tenant_1.Tenant.findById(tenantId);
                if (!tenant) {
                    throw new Error('Hotel not found');
                }
                // Process message based on current state
                const aiResponse = yield this.processStateBasedMessage(session, message, tenant);
                // Add AI response to session
                session.messages.push({
                    timestamp: new Date(),
                    from: 'ai',
                    content: aiResponse.content
                });
                // Update session
                session.updatedAt = new Date();
                conversationSessions.set(sessionId, session);
                return aiResponse;
            }
            catch (error) {
                logger_1.logger.error('Reservation AI processing error:', error);
                return {
                    content: "I apologize, but I'm having trouble processing your request right now. Please try again or call our front desk directly.",
                    confidence: 0.1,
                    metadata: { error: true }
                };
            }
        });
    }
    createNewSession(tenantId, guestPhone) {
        return {
            id: `${tenantId}-${guestPhone}-${Date.now()}`,
            tenantId,
            guestPhone,
            state: ConversationState.GREETING,
            reservationData: {},
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    processStateBasedMessage(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Processing message with state:', {
                state: session.state,
                message: message.substring(0, 50) + '...',
                tenant: tenant.name
            });
            switch (session.state) {
                case ConversationState.GREETING:
                    return this.handleGreeting(session, message, tenant);
                case ConversationState.COLLECTING_DATES:
                    return this.handleDateCollection(session, message, tenant);
                case ConversationState.COLLECTING_GUESTS:
                    return this.handleGuestCount(session, message, tenant);
                case ConversationState.COLLECTING_PREFERENCES:
                    return this.handlePreferences(session, message, tenant);
                case ConversationState.COLLECTING_CONTACT:
                    return this.handleContactCollection(session, message, tenant);
                default:
                    return this.handleGeneral(session, message, tenant);
            }
        });
    }
    handleGreeting(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            const isReservationRequest = this.detectReservationIntent(message);
            // Use OpenAI for the greeting response
            const context = {
                hotelId: session.tenantId,
                messageType: Communication_1.MessageType.INBOUND,
                channel: Communication_1.MessageChannel.WHATSAPP,
                content: message,
                metadata: {
                    sessionState: session.state,
                    hotelName: tenant.name,
                    isReservationRequest,
                    conversationHistory: session.messages.slice(-3) // Last 3 messages for context
                }
            };
            const aiResponse = yield this.openaiProvider.processMessage(context);
            if (isReservationRequest) {
                session.state = ConversationState.COLLECTING_DATES;
                // Try to extract dates from initial message
                const extractedDates = yield this.extractDatesFromMessage(message);
                if (extractedDates.checkIn && extractedDates.checkOut) {
                    session.reservationData = Object.assign(Object.assign({}, session.reservationData), extractedDates);
                    session.state = ConversationState.COLLECTING_GUESTS;
                    // Enhance AI response with reservation flow info
                    aiResponse.metadata = Object.assign(Object.assign({}, aiResponse.metadata), { nextState: ConversationState.COLLECTING_GUESTS, extractedDates });
                }
                else {
                    aiResponse.metadata = Object.assign(Object.assign({}, aiResponse.metadata), { nextState: ConversationState.COLLECTING_DATES });
                }
            }
            return aiResponse;
        });
    }
    handleDateCollection(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            const extractedDates = yield this.extractDatesFromMessage(message);
            // Use OpenAI for date collection response
            const context = {
                hotelId: session.tenantId,
                messageType: Communication_1.MessageType.INBOUND,
                channel: Communication_1.MessageChannel.WHATSAPP,
                content: message,
                metadata: {
                    sessionState: session.state,
                    hotelName: tenant.name,
                    extractedDates,
                    conversationHistory: session.messages.slice(-3),
                    reservationData: session.reservationData
                }
            };
            const aiResponse = yield this.openaiProvider.processMessage(context);
            if (extractedDates.checkIn && extractedDates.checkOut) {
                // Validate dates
                const checkIn = new Date(extractedDates.checkIn);
                const checkOut = new Date(extractedDates.checkOut);
                const today = new Date();
                if (checkIn < today) {
                    aiResponse.content = "I notice the check-in date you mentioned is in the past. Could you please provide future dates for your stay?";
                    return aiResponse;
                }
                if (checkOut <= checkIn) {
                    aiResponse.content = "The check-out date should be after the check-in date. Could you please clarify your dates?";
                    return aiResponse;
                }
                // Update session with dates
                session.reservationData.checkIn = extractedDates.checkIn;
                session.reservationData.checkOut = extractedDates.checkOut;
                session.state = ConversationState.COLLECTING_GUESTS;
                // Enhance AI response with next step
                aiResponse.metadata = Object.assign(Object.assign({}, aiResponse.metadata), { nextState: ConversationState.COLLECTING_GUESTS, validDates: true });
            }
            return aiResponse;
        });
    }
    handleGuestCount(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            const guestCount = this.extractGuestCount(message);
            if (guestCount > 0) {
                session.reservationData.guests = guestCount;
                // Find suitable rooms
                const suitableRooms = yield this.findSuitableRooms(session.tenantId, session.reservationData.checkIn, session.reservationData.checkOut, guestCount);
                if (suitableRooms.length === 0) {
                    return {
                        content: `I don't have rooms available for ${guestCount} guests on those dates. We might have availability for fewer guests or different dates. Would you like me to check alternatives?`,
                        confidence: 0.9,
                        metadata: { noSuitableRooms: true }
                    };
                }
                // Calculate pricing
                const recommendedRoom = suitableRooms[0];
                const nights = this.calculateNights(session.reservationData.checkIn, session.reservationData.checkOut);
                const totalPrice = recommendedRoom.price * nights;
                session.reservationData.estimatedPrice = totalPrice;
                session.reservationData.roomId = recommendedRoom.id;
                session.state = ConversationState.COLLECTING_CONTACT;
                return {
                    content: `Excellent! I have a ${recommendedRoom.type} room available for ${guestCount} guest${guestCount > 1 ? 's' : ''} at $${recommendedRoom.price}/night. Your total for ${nights} night${nights > 1 ? 's' : ''} would be $${totalPrice}.\n\nTo complete your reservation, I'll need your name and email address.`,
                    confidence: 0.9,
                    metadata: {
                        nextState: ConversationState.COLLECTING_CONTACT,
                        pricing: { room: recommendedRoom, total: totalPrice, nights }
                    }
                };
            }
            return {
                content: "How many guests will be staying? Please let me know the total number of people.",
                confidence: 0.7,
                metadata: { needsClarification: true }
            };
        });
    }
    handleContactCollection(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract contact information
            const contactInfo = yield this.extractContactInfo(message);
            if (contactInfo.name) {
                session.reservationData.guestName = contactInfo.name;
            }
            if (contactInfo.email) {
                session.reservationData.guestEmail = contactInfo.email;
            }
            // Check if we have all required information
            if (session.reservationData.guestName && session.reservationData.guestEmail) {
                session.state = ConversationState.PAYMENT_PROCESSING;
                return {
                    content: `Thank you, ${session.reservationData.guestName}! To secure your reservation, I'll need a credit card for authorization (like all hotels do). This is just to hold your room - you can pay at check-in.\n\nPlease provide your credit card number, expiry date (MM/YY), and CVC code.`,
                    confidence: 0.9,
                    metadata: {
                        nextState: ConversationState.PAYMENT_PROCESSING,
                        readyForPayment: true
                    }
                };
            }
            // Determine what's still needed
            const needed = [];
            if (!session.reservationData.guestName)
                needed.push('name');
            if (!session.reservationData.guestEmail)
                needed.push('email address');
            return {
                content: `I still need your ${needed.join(' and ')}. Could you please provide that information?`,
                confidence: 0.8,
                metadata: { missingInfo: needed }
            };
        });
    }
    handlePreferences(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            session.reservationData.specialRequests = message;
            session.state = ConversationState.COLLECTING_CONTACT;
            return {
                content: "I've noted your preferences. Now I'll need your name and email to complete the reservation.",
                confidence: 0.9,
                metadata: { nextState: ConversationState.COLLECTING_CONTACT }
            };
        });
    }
    handleGeneral(session, message, tenant) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use OpenAI for general hotel inquiries with full context
            const context = {
                hotelId: session.tenantId,
                messageType: Communication_1.MessageType.INBOUND,
                channel: Communication_1.MessageChannel.WHATSAPP,
                content: message,
                metadata: {
                    sessionState: session.state,
                    hotelName: tenant.name,
                    conversationHistory: session.messages.slice(-5), // More context for general inquiries
                    reservationData: session.reservationData
                }
            };
            return yield this.openaiProvider.processMessage(context);
        });
    }
    // Helper methods
    detectReservationIntent(message) {
        const reservationKeywords = [
            'book', 'reserve', 'reservation', 'stay', 'room', 'available',
            'check in', 'check-in', 'checkout', 'check-out', 'nights'
        ];
        const lowerMessage = message.toLowerCase();
        return reservationKeywords.some(keyword => lowerMessage.includes(keyword));
    }
    extractDatesFromMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simple date extraction - in production, use more sophisticated NLP
            const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})|(\w+ \d{1,2})/g;
            const dates = message.match(dateRegex);
            if (dates && dates.length >= 2) {
                return {
                    checkIn: this.normalizeDate(dates[0]),
                    checkOut: this.normalizeDate(dates[1])
                };
            }
            return {};
        });
    }
    extractGuestCount(message) {
        const numbers = message.match(/\d+/g);
        if (numbers) {
            const count = parseInt(numbers[0]);
            return count > 0 && count <= 10 ? count : 0;
        }
        return 0;
    }
    extractContactInfo(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const email = (_a = message.match(emailRegex)) === null || _a === void 0 ? void 0 : _a[0];
            // Simple name extraction - look for capitalized words
            const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/;
            const name = (_b = message.match(nameRegex)) === null || _b === void 0 ? void 0 : _b[0];
            return { name, email };
        });
    }
    normalizeDate(dateStr) {
        // Simple date normalization - in production, use proper date parsing
        return dateStr;
    }
    checkAvailability(tenantId, checkIn, checkOut) {
        return __awaiter(this, void 0, void 0, function* () {
            const availableRooms = yield Room_1.Room.find({
                hotelConfigId: tenantId, // Note: might need to adjust based on your schema
                status: 'available'
            });
            return { availableRooms };
        });
    }
    findSuitableRooms(tenantId, checkIn, checkOut, guests) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Room_1.Room.find({
                hotelConfigId: tenantId,
                capacity: { $gte: guests },
                status: 'available'
            }).sort({ rate: 1 }); // Sort by price, cheapest first
        });
    }
    calculateNights(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    // Get session for external access
    getSession(tenantId, guestPhone) {
        return conversationSessions.get(`${tenantId}-${guestPhone}`);
    }
    // Update session state
    updateSessionState(tenantId, guestPhone, newState) {
        const sessionId = `${tenantId}-${guestPhone}`;
        const session = conversationSessions.get(sessionId);
        if (session) {
            session.state = newState;
            session.updatedAt = new Date();
            conversationSessions.set(sessionId, session);
        }
    }
}
exports.HotelReservationAI = HotelReservationAI;
