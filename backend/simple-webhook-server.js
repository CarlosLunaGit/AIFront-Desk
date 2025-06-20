require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Twilio = require('twilio');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Twilio
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('🔧 Twilio Configuration:');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing');
console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing');
console.log('WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing'
  });
});

// Twilio WhatsApp Webhook
app.post('/api/communications/twilio/whatsapp/webhook', async (req, res) => {
  try {
    const { From, To, Body, MessageSid } = req.body;
    
    console.log('📱 Twilio WhatsApp message received:', {
      from: From,
      to: To,
      body: Body,
      messageSid: MessageSid
    });

    if (!From || !Body) {
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    // Simple AI response
    const responses = [
      "Hello! I'm the AI hotel receptionist. How can I help you with your reservation today?",
      "Thank you for contacting us! I can help you check availability, make reservations, or answer questions about our hotel.",
      "Hi there! I'm here to assist you with your hotel needs. What would you like to know?",
      "Welcome! I can help you with room bookings, check-in information, or any other hotel services."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Send response back to guest
    await twilioClient.messages.create({
      body: randomResponse,
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: From
    });

    console.log('✅ Response sent successfully');
    
    // Return empty TwiML response
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Simple webhook server is working!',
    endpoints: [
      'GET /health',
      'POST /api/communications/twilio/whatsapp/webhook',
      'GET /test'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple webhook server running on port ${PORT}`);
  console.log(`🌐 Webhook URL: http://localhost:${PORT}/api/communications/twilio/whatsapp/webhook`);
  console.log(`📋 ngrok URL: https://6a54-90-229-227-149.ngrok-free.app/api/communications/twilio/whatsapp/webhook`);
}); 