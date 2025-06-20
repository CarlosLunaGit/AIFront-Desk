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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const HotelReservationAI_1 = require("../services/ai/HotelReservationAI");
const PaymentService_1 = require("../services/payment/PaymentService");
const EmailService_1 = require("../services/email/EmailService");
const WhatsAppService_1 = require("../services/communication/WhatsAppService");
const TwilioWhatsAppService_1 = require("../services/communication/TwilioWhatsAppService");
const SMSService_1 = require("../services/communication/SMSService");
const logger_1 = require("../utils/logger");
const Tenant_1 = require("../models/Tenant");
const Guest_1 = require("../models/Guest");
const router = express_1.default.Router();
// Initialize services
const reservationAI = new HotelReservationAI_1.HotelReservationAI();
const paymentService = new PaymentService_1.PaymentService();
const emailService = new EmailService_1.EmailService();
const whatsappService = new WhatsAppService_1.WhatsAppService();
const twilioWhatsAppService = new TwilioWhatsAppService_1.TwilioWhatsAppService();
const smsService = new SMSService_1.SMSService();
// Initialize AI on startup
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield reservationAI.initialize();
        logger_1.logger.info('Reservation AI initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Reservation AI:', error);
    }
}))();
// 📱 Twilio WhatsApp Webhook - Receive messages from guests via Twilio
router.post('/twilio/whatsapp/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { From, To, Body, MessageSid } = req.body;
        if (!From || !Body) {
            return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        }
        // Log incoming message
        logger_1.logger.info('Twilio WhatsApp message received:', {
            from: From,
            to: To,
            body: Body,
            messageSid: MessageSid
        });
        // Extract phone number from whatsapp:+1234567890 format
        const guestPhone = From.replace('whatsapp:', '');
        const hotelPhone = To.replace('whatsapp:', '');
        logger_1.logger.info('Processing Twilio WhatsApp webhook:', {
            guestPhone,
            hotelPhone,
            body: Body
        });
        // Find tenant by hotel phone number (the "To" field from Twilio)
        const tenant = yield findTenantByPhone(hotelPhone);
        if (!tenant) {
            logger_1.logger.error('No tenant found for Twilio WhatsApp phone:', hotelPhone);
            // Send a generic response
            yield twilioWhatsAppService.sendMessage(From, "Sorry, we couldn't process your message at this time. Please try again later.");
            return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        }
        // Process the message with AI
        const aiResponse = yield reservationAI.processReservationMessage(tenant._id.toString(), guestPhone, Body, 'whatsapp');
        // Send AI response back to guest
        yield twilioWhatsAppService.sendMessage(From, aiResponse.content);
        // Check if we need to process payment
        if ((_a = aiResponse.metadata) === null || _a === void 0 ? void 0 : _a.readyForPayment) {
            logger_1.logger.info('Guest ready for payment processing via Twilio:', {
                tenant: tenant.name,
                phone: guestPhone
            });
        }
        // Log the interaction
        logger_1.logger.info('Twilio WhatsApp message processed:', {
            tenant: tenant.name,
            from: guestPhone,
            message: Body,
            aiConfidence: aiResponse.confidence
        });
        // Return empty TwiML response
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    catch (error) {
        logger_1.logger.error('Twilio WhatsApp webhook error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
}));
// 📱 WhatsApp Webhook - Receive messages from guests
router.post('/whatsapp/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { messages, contacts } = ((_d = (_c = (_b = (_a = req.body.entry) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || {};
        if (!messages || messages.length === 0) {
            return res.status(200).json({ status: 'ok' });
        }
        const message = messages[0];
        const contact = contacts === null || contacts === void 0 ? void 0 : contacts[0];
        if (message.type !== 'text') {
            // Handle non-text messages
            yield whatsappService.sendMessage(message.from, "I can help you with text messages. Please send me a text message with your request.");
            return res.status(200).json({ status: 'ok' });
        }
        // Find tenant by phone number (you'll need to set up phone mapping)
        const tenant = yield findTenantByPhone(message.to);
        if (!tenant) {
            logger_1.logger.error('No tenant found for phone:', message.to);
            return res.status(200).json({ status: 'ok' });
        }
        // Process the message with AI
        const aiResponse = yield reservationAI.processReservationMessage(tenant._id.toString(), message.from, message.text.body, 'whatsapp');
        // Send AI response back to guest
        yield whatsappService.sendMessage(message.from, aiResponse.content);
        // Check if we need to process payment
        if ((_e = aiResponse.metadata) === null || _e === void 0 ? void 0 : _e.readyForPayment) {
            // Session is ready for payment processing
            logger_1.logger.info('Guest ready for payment processing:', { tenant: tenant.name, phone: message.from });
        }
        // Log the interaction
        logger_1.logger.info('WhatsApp message processed:', {
            tenant: tenant.name,
            from: message.from,
            message: message.text.body,
            aiConfidence: aiResponse.confidence
        });
        res.status(200).json({ status: 'processed' });
    }
    catch (error) {
        logger_1.logger.error('WhatsApp webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 📱 WhatsApp Webhook Verification
router.get('/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    }
    else {
        res.status(403).send('Forbidden');
    }
});
// 📱 SMS Webhook - Receive SMS from guests
router.post('/sms/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { From, To, Body } = req.body;
        // Find tenant by phone number
        const tenant = yield findTenantByPhone(To);
        if (!tenant) {
            logger_1.logger.error('No tenant found for SMS phone:', To);
            return res.status(200).json({ status: 'ok' });
        }
        // Process the message with AI
        const aiResponse = yield reservationAI.processReservationMessage(tenant._id.toString(), From, Body, 'sms');
        // Send AI response back to guest
        yield smsService.sendMessage(From, aiResponse.content);
        // Log the interaction
        logger_1.logger.info('SMS message processed:', {
            tenant: tenant.name,
            from: From,
            message: Body,
            aiConfidence: aiResponse.confidence
        });
        res.status(200).json({ status: 'processed' });
    }
    catch (error) {
        logger_1.logger.error('SMS webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 💳 Payment Processing Endpoint
router.post('/payment/process', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, guestPhone, paymentMethod } = req.body;
        // Get conversation session
        const session = reservationAI.getSession(tenantId, guestPhone);
        if (!session || session.state !== HotelReservationAI_1.ConversationState.PAYMENT_PROCESSING) {
            return res.status(400).json({ error: 'Invalid session state' });
        }
        // Validate credit card with Stripe
        const paymentResult = yield paymentService.validateCard(paymentMethod, session.reservationData.estimatedPrice * 100, // Convert to cents
        {
            description: `Room reservation authorization for ${session.reservationData.guestName}`,
            metadata: {
                tenantId: session.tenantId,
                guestPhone: session.guestPhone,
                checkIn: session.reservationData.checkIn,
                checkOut: session.reservationData.checkOut
            }
        });
        if (paymentResult.success) {
            // Create guest record
            const guest = yield Guest_1.Guest.create({
                name: session.reservationData.guestName,
                email: session.reservationData.guestEmail,
                phone: session.guestPhone,
                tenantId: session.tenantId,
                paymentMethodId: paymentResult.paymentMethodId
            });
            // Update session state
            reservationAI.updateSessionState(tenantId, guestPhone, HotelReservationAI_1.ConversationState.CONFIRMED);
            // Send confirmation email
            yield emailService.sendReservationConfirmation({
                guestEmail: session.reservationData.guestEmail,
                guestName: session.reservationData.guestName,
                hotelName: ((_a = (yield Tenant_1.Tenant.findById(tenantId))) === null || _a === void 0 ? void 0 : _a.name) || 'Hotel',
                checkIn: session.reservationData.checkIn,
                checkOut: session.reservationData.checkOut,
                guests: session.reservationData.guests,
                totalPrice: session.reservationData.estimatedPrice,
                confirmationNumber: `RES${Date.now()}`,
                paymentAuthId: paymentResult.authorizationId
            });
            // Send WhatsApp/SMS confirmation
            const confirmationMessage = `🎉 Reservation Confirmed!\n\nDear ${session.reservationData.guestName},\n\nYour reservation has been confirmed:\n📅 ${session.reservationData.checkIn} to ${session.reservationData.checkOut}\n👤 ${session.reservationData.guests} guest${session.reservationData.guests > 1 ? 's' : ''}\n💰 Total: $${session.reservationData.estimatedPrice}\n\nConfirmation sent to ${session.reservationData.guestEmail}\n\nWe look forward to hosting you! 🏨`;
            if (session.guestPhone.includes('whatsapp')) {
                yield whatsappService.sendMessage(guestPhone, confirmationMessage);
            }
            else {
                yield smsService.sendMessage(guestPhone, confirmationMessage);
            }
            res.json({
                success: true,
                message: 'Reservation confirmed successfully',
                confirmationNumber: `RES${Date.now()}`,
                guest: guest
            });
        }
        else {
            // Payment failed
            const errorMessage = `❌ Payment Authorization Failed\n\nThere was an issue with your credit card. Please check the details and try again, or contact your bank.\n\nError: ${paymentResult.error}`;
            if (guestPhone.includes('whatsapp')) {
                yield whatsappService.sendMessage(guestPhone, errorMessage);
            }
            else {
                yield smsService.sendMessage(guestPhone, errorMessage);
            }
            res.status(400).json({
                success: false,
                error: paymentResult.error,
                message: 'Payment authorization failed'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Payment processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 💳 Process Credit Card via WhatsApp/SMS
router.post('/payment/process-from-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, guestPhone, message, channel } = req.body;
        // Get conversation session
        const session = reservationAI.getSession(tenantId, guestPhone);
        if (!session || session.state !== HotelReservationAI_1.ConversationState.PAYMENT_PROCESSING) {
            return res.status(400).json({ error: 'Invalid session state' });
        }
        // Extract credit card information from message
        const cardInfo = extractCreditCardInfo(message);
        if (!cardInfo.complete) {
            const errorMessage = "I need complete credit card information. Please provide:\n• Card number\n• Expiry date (MM/YY)\n• CVC code\n\nExample: 4242424242424242 12/25 123";
            if (channel === 'whatsapp') {
                yield whatsappService.sendMessage(guestPhone, errorMessage);
            }
            else {
                yield smsService.sendMessage(guestPhone, errorMessage);
            }
            return res.status(400).json({ error: 'Incomplete card information' });
        }
        // Process payment
        const paymentResult = yield paymentService.validateCard(cardInfo, session.reservationData.estimatedPrice * 100, {
            description: `Room reservation authorization for ${session.reservationData.guestName}`,
            metadata: {
                tenantId: session.tenantId,
                guestPhone: session.guestPhone,
                checkIn: session.reservationData.checkIn,
                checkOut: session.reservationData.checkOut
            }
        });
        if (paymentResult.success) {
            // Same confirmation flow as above
            const guest = yield Guest_1.Guest.create({
                name: session.reservationData.guestName,
                email: session.reservationData.guestEmail,
                phone: session.guestPhone,
                tenantId: session.tenantId,
                paymentMethodId: paymentResult.paymentMethodId
            });
            reservationAI.updateSessionState(tenantId, guestPhone, HotelReservationAI_1.ConversationState.CONFIRMED);
            yield emailService.sendReservationConfirmation({
                guestEmail: session.reservationData.guestEmail,
                guestName: session.reservationData.guestName,
                hotelName: ((_a = (yield Tenant_1.Tenant.findById(tenantId))) === null || _a === void 0 ? void 0 : _a.name) || 'Hotel',
                checkIn: session.reservationData.checkIn,
                checkOut: session.reservationData.checkOut,
                guests: session.reservationData.guests,
                totalPrice: session.reservationData.estimatedPrice,
                confirmationNumber: `RES${Date.now()}`,
                paymentAuthId: paymentResult.authorizationId
            });
            const confirmationMessage = `🎉 Payment Authorized & Reservation Confirmed!\n\nThank you ${session.reservationData.guestName}! Your credit card has been authorized and your reservation is confirmed.\n\n📧 Confirmation details sent to ${session.reservationData.guestEmail}\n\nSee you on ${session.reservationData.checkIn}! 🏨✨`;
            if (channel === 'whatsapp') {
                yield whatsappService.sendMessage(guestPhone, confirmationMessage);
            }
            else {
                yield smsService.sendMessage(guestPhone, confirmationMessage);
            }
            res.json({ success: true, guest });
        }
        else {
            const errorMessage = `❌ Payment Authorization Failed\n\n${paymentResult.error}\n\nPlease verify your card details and try again.`;
            if (channel === 'whatsapp') {
                yield whatsappService.sendMessage(guestPhone, errorMessage);
            }
            else {
                yield smsService.sendMessage(guestPhone, errorMessage);
            }
            res.status(400).json({ success: false, error: paymentResult.error });
        }
    }
    catch (error) {
        logger_1.logger.error('Message payment processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 📊 Get conversation session (for hotel staff dashboard)
router.get('/session/:tenantId/:guestPhone', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, guestPhone } = req.params;
        const session = reservationAI.getSession(tenantId, guestPhone);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    }
    catch (error) {
        logger_1.logger.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 🔧 Test endpoints for development
router.post('/test/send-whatsapp', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { to, message } = req.body;
        yield whatsappService.sendMessage(to, message);
        res.json({ success: true, message: 'WhatsApp message sent' });
    }
    catch (error) {
        logger_1.logger.error('Test WhatsApp send error:', error);
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
}));
router.post('/test/send-twilio-whatsapp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { to, message } = req.body;
        const success = yield twilioWhatsAppService.sendMessage(to, message);
        res.json({
            success,
            message: success ? 'Twilio WhatsApp message sent' : 'Failed to send message',
            to,
            messageContent: message
        });
    }
    catch (error) {
        logger_1.logger.error('Test Twilio WhatsApp send error:', error);
        res.status(500).json({ error: 'Failed to send Twilio WhatsApp message' });
    }
}));
router.post('/test/send-sms', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { to, message } = req.body;
        yield smsService.sendMessage(to, message);
        res.json({ success: true, message: 'SMS sent' });
    }
    catch (error) {
        logger_1.logger.error('Test SMS send error:', error);
        res.status(500).json({ error: 'Failed to send SMS' });
    }
}));
// Helper functions
function findTenantByPhone(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Looking up tenant for phone number:', { phoneNumber });
            // Clean the phone number - remove whatsapp: prefix if present
            const cleanPhoneNumber = phoneNumber.replace('whatsapp:', '');
            logger_1.logger.info('Cleaned phone number:', { cleanPhoneNumber });
            // Look for tenant by WhatsApp phone number
            const tenant = yield Tenant_1.Tenant.findOne({
                'communicationChannels.whatsapp.phoneNumber': cleanPhoneNumber
            });
            if (tenant) {
                logger_1.logger.info('Found tenant:', {
                    tenantId: tenant._id,
                    tenantName: tenant.name,
                    whatsappNumber: tenant.communicationChannels.whatsapp.phoneNumber
                });
                return tenant;
            }
            else {
                logger_1.logger.warn('No tenant found for phone number:', { cleanPhoneNumber });
                // For testing, let's return the first available tenant
                // This simulates a default hotel for new guests
                const defaultTenant = yield Tenant_1.Tenant.findOne({});
                if (defaultTenant) {
                    logger_1.logger.info('Using default tenant for new guest:', {
                        tenantId: defaultTenant._id,
                        tenantName: defaultTenant.name
                    });
                    return defaultTenant;
                }
                return null;
            }
        }
        catch (error) {
            logger_1.logger.error('Error finding tenant by phone:', error);
            return null;
        }
    });
}
function extractCreditCardInfo(message) {
    var _a, _b, _c, _d;
    // Extract credit card information from text message
    // This is a simplified version - in production, use more robust parsing
    const cardNumberRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;
    const expiryRegex = /\b(0[1-9]|1[0-2])\/?\d{2}\b/;
    const cvcRegex = /\b\d{3,4}\b/;
    const cardNumber = (_b = (_a = message.match(cardNumberRegex)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.replace(/[-\s]/g, '');
    const expiry = (_c = message.match(expiryRegex)) === null || _c === void 0 ? void 0 : _c[0];
    const cvc = (_d = message.match(cvcRegex)) === null || _d === void 0 ? void 0 : _d[0];
    return {
        number: cardNumber,
        expiry: expiry,
        cvc: cvc,
        complete: !!(cardNumber && expiry && cvc)
    };
}
exports.default = router;
