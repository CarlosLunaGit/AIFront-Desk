require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple webhook endpoint
app.post('/api/communications/twilio/whatsapp/webhook', async (req, res) => {
  try {
    console.log('🎉 Webhook received!');
    console.log('📱 From:', req.body.From);
    console.log('📱 To:', req.body.To);
    console.log('💬 Message:', req.body.Body);
    console.log('📋 Full body:', JSON.stringify(req.body, null, 2));
    
    // Send a simple response back via Twilio
    const Twilio = require('twilio');
    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    if (req.body.From && req.body.Body) {
      const responseMessage = `🤖 AI Hotel Receptionist: Hello! I received your message: "${req.body.Body}". I'm a test response to confirm the webhook is working! 🏨`;
      
      await client.messages.create({
        body: responseMessage,
        from: req.body.To, // Twilio sandbox number
        to: req.body.From   // Guest's number
      });
      
      console.log('✅ Response sent back to guest!');
    }
    
    // Return TwiML response
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Webhook test server running' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Webhook test server running on port ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/api/communications/twilio/whatsapp/webhook`);
}); 