import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { HotelReservationAI, ConversationState } from '../services/ai/HotelReservationAI';
import { PaymentService } from '../services/payment/PaymentService';
import { EmailService } from '../services/email/EmailService';
import { WhatsAppService } from '../services/communication/WhatsAppService';
import { SMSService } from '../services/communication/SMSService';
import { logger } from '../utils/logger';
import { Tenant } from '../models/Tenant';
import { Guest } from '../models/Guest';

const router = express.Router();

// Initialize services
const reservationAI = new HotelReservationAI();
const paymentService = new PaymentService();
const emailService = new EmailService();
const whatsappService = new WhatsAppService();
const smsService = new SMSService();

// Initialize AI on startup
(async () => {
  try {
    await reservationAI.initialize();
    logger.info('Reservation AI initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Reservation AI:', error);
  }
})();

// 📱 WhatsApp Webhook - Receive messages from guests
router.post('/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const { messages, contacts } = req.body.entry?.[0]?.changes?.[0]?.value || {};
    
    if (!messages || messages.length === 0) {
      return res.status(200).json({ status: 'ok' });
    }

    const message = messages[0];
    const contact = contacts?.[0];
    
    if (message.type !== 'text') {
      // Handle non-text messages
      await whatsappService.sendMessage(
        message.from,
        "I can help you with text messages. Please send me a text message with your request."
      );
      return res.status(200).json({ status: 'ok' });
    }

    // Find tenant by phone number (you'll need to set up phone mapping)
    const tenant = await findTenantByPhone(message.to);
    if (!tenant) {
      logger.error('No tenant found for phone:', message.to);
      return res.status(200).json({ status: 'ok' });
    }

    // Process the message with AI
    const aiResponse = await reservationAI.processReservationMessage(
      tenant._id.toString(),
      message.from,
      message.text.body,
      'whatsapp'
    );

    // Send AI response back to guest
    await whatsappService.sendMessage(message.from, aiResponse.content);

    // Check if we need to process payment
    if (aiResponse.metadata?.readyForPayment) {
      // Session is ready for payment processing
      logger.info('Guest ready for payment processing:', { tenant: tenant.name, phone: message.from });
    }

    // Log the interaction
    logger.info('WhatsApp message processed:', {
      tenant: tenant.name,
      from: message.from,
      message: message.text.body,
      aiConfidence: aiResponse.confidence
    });

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📱 WhatsApp Webhook Verification
router.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// 📱 SMS Webhook - Receive SMS from guests
router.post('/sms/webhook', async (req: Request, res: Response) => {
  try {
    const { From, To, Body } = req.body;

    // Find tenant by phone number
    const tenant = await findTenantByPhone(To);
    if (!tenant) {
      logger.error('No tenant found for SMS phone:', To);
      return res.status(200).json({ status: 'ok' });
    }

    // Process the message with AI
    const aiResponse = await reservationAI.processReservationMessage(
      tenant._id.toString(),
      From,
      Body,
      'sms'
    );

    // Send AI response back to guest
    await smsService.sendMessage(From, aiResponse.content);

    // Log the interaction
    logger.info('SMS message processed:', {
      tenant: tenant.name,
      from: From,
      message: Body,
      aiConfidence: aiResponse.confidence
    });

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    logger.error('SMS webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 💳 Payment Processing Endpoint
router.post('/payment/process', async (req: Request, res: Response) => {
  try {
    const { tenantId, guestPhone, paymentMethod } = req.body;

    // Get conversation session
    const session = reservationAI.getSession(tenantId, guestPhone);
    if (!session || session.state !== ConversationState.PAYMENT_PROCESSING) {
      return res.status(400).json({ error: 'Invalid session state' });
    }

    // Validate credit card with Stripe
    const paymentResult = await paymentService.validateCard(
      paymentMethod,
      session.reservationData.estimatedPrice! * 100, // Convert to cents
      {
        description: `Room reservation authorization for ${session.reservationData.guestName}`,
        metadata: {
          tenantId: session.tenantId,
          guestPhone: session.guestPhone,
          checkIn: session.reservationData.checkIn!,
          checkOut: session.reservationData.checkOut!
        }
      }
    );

    if (paymentResult.success) {
      // Create guest record
      const guest = await Guest.create({
        name: session.reservationData.guestName,
        email: session.reservationData.guestEmail,
        phone: session.guestPhone,
        tenantId: session.tenantId,
        paymentMethodId: paymentResult.paymentMethodId
      });

      // Update session state
      reservationAI.updateSessionState(tenantId, guestPhone, ConversationState.CONFIRMED);

      // Send confirmation email
      await emailService.sendReservationConfirmation({
        guestEmail: session.reservationData.guestEmail!,
        guestName: session.reservationData.guestName!,
        hotelName: (await Tenant.findById(tenantId))?.name || 'Hotel',
        checkIn: session.reservationData.checkIn!,
        checkOut: session.reservationData.checkOut!,
        guests: session.reservationData.guests!,
        totalPrice: session.reservationData.estimatedPrice!,
        confirmationNumber: `RES${Date.now()}`,
        paymentAuthId: paymentResult.authorizationId
      });

      // Send WhatsApp/SMS confirmation
      const confirmationMessage = `🎉 Reservation Confirmed!\n\nDear ${session.reservationData.guestName},\n\nYour reservation has been confirmed:\n📅 ${session.reservationData.checkIn} to ${session.reservationData.checkOut}\n👤 ${session.reservationData.guests} guest${session.reservationData.guests! > 1 ? 's' : ''}\n💰 Total: $${session.reservationData.estimatedPrice}\n\nConfirmation sent to ${session.reservationData.guestEmail}\n\nWe look forward to hosting you! 🏨`;

      if (session.guestPhone.includes('whatsapp')) {
        await whatsappService.sendMessage(guestPhone, confirmationMessage);
      } else {
        await smsService.sendMessage(guestPhone, confirmationMessage);
      }

      res.json({
        success: true,
        message: 'Reservation confirmed successfully',
        confirmationNumber: `RES${Date.now()}`,
        guest: guest
      });
    } else {
      // Payment failed
      const errorMessage = `❌ Payment Authorization Failed\n\nThere was an issue with your credit card. Please check the details and try again, or contact your bank.\n\nError: ${paymentResult.error}`;
      
      if (guestPhone.includes('whatsapp')) {
        await whatsappService.sendMessage(guestPhone, errorMessage);
      } else {
        await smsService.sendMessage(guestPhone, errorMessage);
      }

      res.status(400).json({
        success: false,
        error: paymentResult.error,
        message: 'Payment authorization failed'
      });
    }
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 💳 Process Credit Card via WhatsApp/SMS
router.post('/payment/process-from-message', async (req: Request, res: Response) => {
  try {
    const { tenantId, guestPhone, message, channel } = req.body;

    // Get conversation session
    const session = reservationAI.getSession(tenantId, guestPhone);
    if (!session || session.state !== ConversationState.PAYMENT_PROCESSING) {
      return res.status(400).json({ error: 'Invalid session state' });
    }

    // Extract credit card information from message
    const cardInfo = extractCreditCardInfo(message);
    
    if (!cardInfo.complete) {
      const errorMessage = "I need complete credit card information. Please provide:\n• Card number\n• Expiry date (MM/YY)\n• CVC code\n\nExample: 4242424242424242 12/25 123";
      
      if (channel === 'whatsapp') {
        await whatsappService.sendMessage(guestPhone, errorMessage);
      } else {
        await smsService.sendMessage(guestPhone, errorMessage);
      }
      
      return res.status(400).json({ error: 'Incomplete card information' });
    }

    // Process payment
    const paymentResult = await paymentService.validateCard(
      cardInfo,
      session.reservationData.estimatedPrice! * 100,
      {
        description: `Room reservation authorization for ${session.reservationData.guestName}`,
        metadata: {
          tenantId: session.tenantId,
          guestPhone: session.guestPhone,
          checkIn: session.reservationData.checkIn!,
          checkOut: session.reservationData.checkOut!
        }
      }
    );

    if (paymentResult.success) {
      // Same confirmation flow as above
      const guest = await Guest.create({
        name: session.reservationData.guestName,
        email: session.reservationData.guestEmail,
        phone: session.guestPhone,
        tenantId: session.tenantId,
        paymentMethodId: paymentResult.paymentMethodId
      });

      reservationAI.updateSessionState(tenantId, guestPhone, ConversationState.CONFIRMED);

      await emailService.sendReservationConfirmation({
        guestEmail: session.reservationData.guestEmail!,
        guestName: session.reservationData.guestName!,
        hotelName: (await Tenant.findById(tenantId))?.name || 'Hotel',
        checkIn: session.reservationData.checkIn!,
        checkOut: session.reservationData.checkOut!,
        guests: session.reservationData.guests!,
        totalPrice: session.reservationData.estimatedPrice!,
        confirmationNumber: `RES${Date.now()}`,
        paymentAuthId: paymentResult.authorizationId
      });

      const confirmationMessage = `🎉 Payment Authorized & Reservation Confirmed!\n\nThank you ${session.reservationData.guestName}! Your credit card has been authorized and your reservation is confirmed.\n\n📧 Confirmation details sent to ${session.reservationData.guestEmail}\n\nSee you on ${session.reservationData.checkIn}! 🏨✨`;

      if (channel === 'whatsapp') {
        await whatsappService.sendMessage(guestPhone, confirmationMessage);
      } else {
        await smsService.sendMessage(guestPhone, confirmationMessage);
      }

      res.json({ success: true, guest });
    } else {
      const errorMessage = `❌ Payment Authorization Failed\n\n${paymentResult.error}\n\nPlease verify your card details and try again.`;
      
      if (channel === 'whatsapp') {
        await whatsappService.sendMessage(guestPhone, errorMessage);
      } else {
        await smsService.sendMessage(guestPhone, errorMessage);
      }

      res.status(400).json({ success: false, error: paymentResult.error });
    }
  } catch (error) {
    logger.error('Message payment processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📊 Get conversation session (for hotel staff dashboard)
router.get('/session/:tenantId/:guestPhone', auth, async (req: Request, res: Response) => {
  try {
    const { tenantId, guestPhone } = req.params;
    const session = reservationAI.getSession(tenantId, guestPhone);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔧 Test endpoints for development
router.post('/test/send-whatsapp', auth, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    await whatsappService.sendMessage(to, message);
    res.json({ success: true, message: 'WhatsApp message sent' });
  } catch (error) {
    logger.error('Test WhatsApp send error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

router.post('/test/send-sms', auth, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    await smsService.sendMessage(to, message);
    res.json({ success: true, message: 'SMS sent' });
  } catch (error) {
    logger.error('Test SMS send error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Helper functions
async function findTenantByPhone(phoneNumber: string): Promise<any> {
  // In production, you'll have a phone number mapping table
  // For now, we'll use a simple mapping or environment variable
  const tenant = await Tenant.findOne({ 
    'communicationChannels.whatsapp.phoneNumber': phoneNumber 
  });
  
  return tenant;
}

function extractCreditCardInfo(message: string) {
  // Extract credit card information from text message
  // This is a simplified version - in production, use more robust parsing
  const cardNumberRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;
  const expiryRegex = /\b(0[1-9]|1[0-2])\/?\d{2}\b/;
  const cvcRegex = /\b\d{3,4}\b/;

  const cardNumber = message.match(cardNumberRegex)?.[0]?.replace(/[-\s]/g, '');
  const expiry = message.match(expiryRegex)?.[0];
  const cvc = message.match(cvcRegex)?.[0];

  return {
    number: cardNumber,
    expiry: expiry,
    cvc: cvc,
    complete: !!(cardNumber && expiry && cvc)
  };
}

export default router; 