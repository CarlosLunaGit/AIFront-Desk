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
const express_validator_1 = require("express-validator");
const Communication_1 = require("../models/Communication");
const AIProviderFactory_1 = require("../services/ai/AIProviderFactory");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Get all communications for a guest
router.get('/guest/:guestId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communications = yield Communication_1.Communication.find({
            guestId: req.params.guestId
        }).sort({ createdAt: -1 });
        res.json(communications);
    }
    catch (error) {
        logger_1.logger.error('Error fetching communications:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Send message to guest
router.post('/send', [
    (0, express_validator_1.body)('guestId').notEmpty(),
    (0, express_validator_1.body)('content').notEmpty().trim(),
    (0, express_validator_1.body)('channel').isIn(['whatsapp', 'email', 'sms']),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { guestId, content, channel } = req.body;
        // Create communication record
        const communication = new Communication_1.Communication({
            guestId,
            hotelId: req.body.hotelId, // TODO: Get from auth context
            content,
            channel,
            type: 'outbound',
            status: 'sent',
        });
        yield communication.save();
        // TODO: Implement actual sending via provider (Twilio, etc.)
        res.status(201).json(communication);
    }
    catch (error) {
        logger_1.logger.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Receive message from guest (webhook endpoint)
router.post('/receive', [
    (0, express_validator_1.body)('from').notEmpty(),
    (0, express_validator_1.body)('content').notEmpty().trim(),
    (0, express_validator_1.body)('channel').isIn(['whatsapp', 'email', 'sms']),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { from, content, channel, guestId, hotelId } = req.body;
        // Create incoming communication record
        const incomingComm = new Communication_1.Communication({
            guestId,
            hotelId,
            content,
            channel,
            type: 'inbound',
            status: 'received',
            metadata: { from },
        });
        yield incomingComm.save();
        // Process with AI if enabled
        try {
            const aiProvider = AIProviderFactory_1.AIProviderFactory.getProvider('twilio');
            if (aiProvider && aiProvider.isReady()) {
                const aiResponse = yield aiProvider.processMessage({
                    hotelId,
                    guestId,
                    messageType: 'text',
                    channel,
                    content,
                    metadata: { from },
                });
                // Create AI response communication
                if (aiResponse.confidence > 0.7) { // Only auto-respond if confident
                    const responseComm = new Communication_1.Communication({
                        guestId,
                        hotelId,
                        content: aiResponse.content,
                        channel,
                        type: 'outbound',
                        status: 'sent',
                        metadata: Object.assign({ aiGenerated: true, confidence: aiResponse.confidence }, aiResponse.metadata),
                    });
                    yield responseComm.save();
                    // TODO: Actually send the response via provider
                }
            }
        }
        catch (aiError) {
            logger_1.logger.error('AI processing error:', aiError);
            // Continue without AI response
        }
        res.status(201).json({ message: 'Message received and processed' });
    }
    catch (error) {
        logger_1.logger.error('Error receiving message:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get communication stats
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalMessages = yield Communication_1.Communication.countDocuments();
        const todayMessages = yield Communication_1.Communication.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const pendingMessages = yield Communication_1.Communication.countDocuments({
            status: 'pending'
        });
        const stats = {
            totalMessages,
            todayMessages,
            pendingMessages,
            averageResponseTime: 0, // TODO: Calculate based on data
        };
        res.json(stats);
    }
    catch (error) {
        logger_1.logger.error('Error fetching communication stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
