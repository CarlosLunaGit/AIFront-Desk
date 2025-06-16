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
exports.Guest = exports.GuestStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var GuestStatus;
(function (GuestStatus) {
    GuestStatus["BOOKED"] = "booked";
    GuestStatus["CHECKED_IN"] = "checked-in";
    GuestStatus["CHECKED_OUT"] = "checked-out";
})(GuestStatus || (exports.GuestStatus = GuestStatus = {}));
const guestSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: Object.values(GuestStatus),
        default: GuestStatus.BOOKED,
    },
    roomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    reservationStart: {
        type: Date,
        required: true,
    },
    reservationEnd: {
        type: Date,
        required: true,
    },
    checkIn: {
        type: Date,
    },
    checkOut: {
        type: Date,
    },
    hotelId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true,
    },
    keepOpen: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Indexes for efficient querying
guestSchema.index({ hotelId: 1, status: 1 });
guestSchema.index({ roomId: 1 });
guestSchema.index({ email: 1 });
exports.Guest = mongoose_1.default.model('Guest', guestSchema);
