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
exports.Communication = exports.MessageChannel = exports.MessageStatus = exports.MessageType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var MessageType;
(function (MessageType) {
    MessageType["INBOUND"] = "inbound";
    MessageType["OUTBOUND"] = "outbound";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING"] = "pending";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var MessageChannel;
(function (MessageChannel) {
    MessageChannel["WHATSAPP"] = "whatsapp";
    MessageChannel["SMS"] = "sms";
    MessageChannel["EMAIL"] = "email";
})(MessageChannel || (exports.MessageChannel = MessageChannel = {}));
const communicationSchema = new mongoose_1.Schema({
    hotelId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true,
    },
    guestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Guest',
    },
    type: {
        type: String,
        enum: Object.values(MessageType),
        required: true,
    },
    channel: {
        type: String,
        enum: Object.values(MessageChannel),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(MessageStatus),
        default: MessageStatus.PENDING,
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    mediaUrl: {
        type: String,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    aiResponse: {
        type: Boolean,
        default: false,
    },
    templateId: {
        type: String,
    },
    error: {
        type: String,
    },
    scheduledFor: {
        type: Date,
    },
    deliveredAt: {
        type: Date,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for efficient querying
communicationSchema.index({ hotelId: 1, createdAt: -1 });
communicationSchema.index({ hotelId: 1, guestId: 1, createdAt: -1 });
communicationSchema.index({ status: 1, scheduledFor: 1 });
exports.Communication = mongoose_1.default.model('Communication', communicationSchema);
