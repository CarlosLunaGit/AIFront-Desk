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
const Room_1 = require("../models/Room");
const Guest_1 = require("../models/Guest");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Authentication middleware (simplified for now)
const auth = (req, res, next) => {
    // TODO: Implement proper JWT authentication
    next();
};
// Get all rooms
router.get('/rooms', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rooms = yield Room_1.Room.find().populate('assignedGuests');
        res.json(rooms);
    }
    catch (error) {
        logger_1.logger.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Create room
router.post('/rooms', auth, [
    (0, express_validator_1.body)('number').notEmpty().trim(),
    (0, express_validator_1.body)('typeId').notEmpty(),
    (0, express_validator_1.body)('capacity').isInt({ min: 1 }),
    (0, express_validator_1.body)('rate').isNumeric(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const room = new Room_1.Room(req.body);
        yield room.save();
        res.status(201).json(room);
    }
    catch (error) {
        logger_1.logger.error('Error creating room:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Update room
router.patch('/rooms/:id', auth, [(0, express_validator_1.param)('id').isMongoId()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const room = yield Room_1.Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    }
    catch (error) {
        logger_1.logger.error('Error updating room:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Delete room
router.delete('/rooms/:id', auth, [(0, express_validator_1.param)('id').isMongoId()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const room = yield Room_1.Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ message: 'Room deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting room:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get all guests
router.get('/guests', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guests = yield Guest_1.Guest.find().populate('roomId');
        res.json(guests);
    }
    catch (error) {
        logger_1.logger.error('Error fetching guests:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Create guest
router.post('/guests', auth, [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('phone').notEmpty().trim(),
    (0, express_validator_1.body)('roomId').isMongoId(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const guest = new Guest_1.Guest(req.body);
        yield guest.save();
        res.status(201).json(guest);
    }
    catch (error) {
        logger_1.logger.error('Error creating guest:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Update guest
router.patch('/guests/:id', auth, [(0, express_validator_1.param)('id').isMongoId()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const guest = yield Guest_1.Guest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }
        res.json(guest);
    }
    catch (error) {
        logger_1.logger.error('Error updating guest:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Delete guest
router.delete('/guests/:id', auth, [(0, express_validator_1.param)('id').isMongoId()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const guest = yield Guest_1.Guest.findByIdAndDelete(req.params.id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }
        res.json({ message: 'Guest deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting guest:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Get dashboard stats
router.get('/stats', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalRooms = yield Room_1.Room.countDocuments();
        const availableRooms = yield Room_1.Room.countDocuments({ status: 'available' });
        const totalGuests = yield Guest_1.Guest.countDocuments();
        const checkedInGuests = yield Guest_1.Guest.countDocuments({ status: 'checked-in' });
        const stats = {
            totalRooms,
            availableRooms,
            occupiedRooms: totalRooms - availableRooms,
            totalGuests,
            checkedInGuests,
            occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0,
        };
        res.json(stats);
    }
    catch (error) {
        logger_1.logger.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
