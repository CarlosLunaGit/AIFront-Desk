"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const hotel_1 = __importDefault(require("./routes/hotel"));
const communication_1 = __importDefault(require("./routes/communication"));
const communications_1 = __importDefault(require("./routes/communications"));
const subscription_1 = __importDefault(require("./routes/subscription"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hotel-receptionist';
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/hotel', hotel_1.default);
app.use('/api/communication', communication_1.default);
app.use('/api/communications', communications_1.default);
app.use('/api/subscription', subscription_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Database connection
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    logger_1.logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
        logger_1.logger.info(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    logger_1.logger.error('MongoDB connection error:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger_1.logger.error('Unhandled Rejection:', error);
    process.exit(1);
});
