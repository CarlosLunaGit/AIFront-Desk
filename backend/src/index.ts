// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import hotelRoutes from './routes/hotel';
import communicationRoutes from './routes/communication';
import communicationsRoutes from './routes/communications';
import subscriptionRoutes from './routes/subscription';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hotel-receptionist';

// Debug: Log environment variables status
console.log('🔧 Environment Variables Status:');
console.log('PORT:', process.env.PORT || 'using default 3001');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Error handling
app.use(errorHandler);

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    logger.warn('⚠️  Continuing without database for testing purposes');
  });

// Start server regardless of database connection (for testing)
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
}); 
