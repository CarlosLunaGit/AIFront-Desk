import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Communication } from '../models/Communication';
import { AIProviderFactory } from '../services/ai/AIProviderFactory';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all communications for a guest
router.get('/guest/:guestId', async (req: Request, res: Response) => {
  try {
    const communications = await Communication.find({ 
      guestId: req.params.guestId 
    }).sort({ createdAt: -1 });
    
    res.json(communications);
  } catch (error) {
    logger.error('Error fetching communications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message to guest
router.post('/send',
  [
    body('guestId').notEmpty(),
    body('content').notEmpty().trim(),
    body('channel').isIn(['whatsapp', 'email', 'sms']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { guestId, content, channel } = req.body;

      // Create communication record
      const communication = new Communication({
        guestId,
        hotelId: req.body.hotelId, // TODO: Get from auth context
        content,
        channel,
        type: 'outbound',
        status: 'sent',
      });

      await communication.save();

      // TODO: Implement actual sending via provider (Twilio, etc.)

      res.status(201).json(communication);
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Receive message from guest (webhook endpoint)
router.post('/receive',
  [
    body('from').notEmpty(),
    body('content').notEmpty().trim(),
    body('channel').isIn(['whatsapp', 'email', 'sms']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { from, content, channel, guestId, hotelId } = req.body;

      // Create incoming communication record
      const incomingComm = new Communication({
        guestId,
        hotelId,
        content,
        channel,
        type: 'inbound',
        status: 'received',
        metadata: { from },
      });

      await incomingComm.save();

      // Process with AI if enabled
      try {
        const aiProvider = AIProviderFactory.getProvider('twilio');
        
        if (aiProvider && aiProvider.isReady()) {
          const aiResponse = await aiProvider.processMessage({
            hotelId,
            guestId,
            messageType: 'text',
            channel,
            content,
            metadata: { from },
          });

          // Create AI response communication
          if (aiResponse.confidence > 0.7) { // Only auto-respond if confident
            const responseComm = new Communication({
              guestId,
              hotelId,
              content: aiResponse.content,
              channel,
              type: 'outbound',
              status: 'sent',
              metadata: { 
                aiGenerated: true, 
                confidence: aiResponse.confidence,
                ...aiResponse.metadata 
              },
            });

            await responseComm.save();

            // TODO: Actually send the response via provider
          }
        }
      } catch (aiError) {
        logger.error('AI processing error:', aiError);
        // Continue without AI response
      }

      res.status(201).json({ message: 'Message received and processed' });
    } catch (error) {
      logger.error('Error receiving message:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get communication stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalMessages = await Communication.countDocuments();
    const todayMessages = await Communication.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const pendingMessages = await Communication.countDocuments({
      status: 'pending'
    });

    const stats = {
      totalMessages,
      todayMessages,
      pendingMessages,
      averageResponseTime: 0, // TODO: Calculate based on data
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching communication stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 