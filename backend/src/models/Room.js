"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = exports.RoomStatus = exports.RoomType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RoomType;
(function (RoomType) {
    RoomType["SINGLE"] = "single";
    RoomType["DOUBLE"] = "double";
    RoomType["SUITE"] = "suite";
    RoomType["DELUXE"] = "deluxe";
})(RoomType || (exports.RoomType = RoomType = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["AVAILABLE"] = "available";
    RoomStatus["OCCUPIED"] = "occupied";
    RoomStatus["MAINTENANCE"] = "maintenance";
    RoomStatus["CLEANING"] = "cleaning";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
const roomSchema = new mongoose_1.Schema({
    number: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    type: {
        type: String,
        enum: Object.values(RoomType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(RoomStatus),
        default: RoomStatus.AVAILABLE,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },
    amenities: [{
            type: String,
            trim: true,
        }],
    description: {
        type: String,
        trim: true,
    },
    hotelId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true,
    },
    currentGuestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Guest',
    },
    checkInDate: {
        type: Date,
    },
    checkOutDate: {
        type: Date,
    },
    lastCleaned: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Index for efficient room availability queries
roomSchema.index({ hotelId: 1, status: 1, type: 1 });
exports.Room = mongoose_1.default.model('Room', roomSchema);
