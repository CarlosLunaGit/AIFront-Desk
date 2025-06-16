# 🏨 AI Hotel SMS/WhatsApp Reservation System Setup Guide

## 🎯 **Complete End-to-End Reservation Flow**

This guide will walk you through setting up a complete AI-powered hotel reservation system that handles:

1. **Guest Communication** via WhatsApp/SMS
2. **AI-Powered Conversations** for reservation collection
3. **Payment Authorization** (like real hotels)
4. **Email Confirmations** with beautiful templates
5. **Real-time Dashboard** for hotel staff

---

## 🚀 **Quick Start (5 Minutes)**

### 1. **Start the Backend Server**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. **Test the Complete Flow**
```bash
# In a new terminal
node test-reservation-flow.js
```

### 3. **See It In Action**
The test script simulates a complete guest reservation:
- Guest: "Hi, I'd like to book a room for March 15 to March 18"
- AI: Collects dates, guest count, contact info
- Payment: Authorizes credit card (doesn't charge)
- Email: Sends beautiful confirmation

---

## 🔧 **Production Setup**

### **Step 1: WhatsApp Business API Setup**

#### Option A: Meta WhatsApp Business API (Recommended)
1. **Create Meta Business Account**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create business account

2. **Set up WhatsApp Business API**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create new app → Business → WhatsApp
   - Get your credentials:
     ```env
     WHATSAPP_ACCESS_TOKEN=your_permanent_token
     WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
     WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
     ```

3. **Configure Webhook**
   - Webhook URL: `https://yourdomain.com/api/communications/whatsapp/webhook`
   - Verify Token: Use the same as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages`

#### Option B: Twilio WhatsApp (Easier Setup)
```bash
# Install Twilio
npm install twilio

# Update WhatsAppService.ts to use Twilio
# (We can provide this implementation)
```

### **Step 2: SMS Setup with Twilio**

1. **Create Twilio Account**
   - Sign up at [twilio.com](https://twilio.com)
   - Get free trial credits ($15)

2. **Get Credentials**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Update SMS Service**
   ```bash
   npm install twilio
   ```

   Replace the mock client in `SMSService.ts`:
   ```typescript
   import twilio from 'twilio';
   
   constructor() {
     this.client = twilio(
       process.env.TWILIO_ACCOUNT_SID,
       process.env.TWILIO_AUTH_TOKEN
     );
   }
   ```

### **Step 3: Payment Processing with Stripe**

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Get test keys (free)

2. **Configure Environment**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

3. **Test Credit Cards** (for development)
   ```
   Success: 4242424242424242
   Decline: 4000000000000002
   Insufficient Funds: 4000000000009995
   ```

### **Step 4: Email Service Setup**

#### Option A: Gmail (Free)
1. **Enable 2-Factor Authentication** on your Gmail
2. **Generate App Password**
   - Google Account → Security → App passwords
   - Generate password for "Mail"

3. **Configure Environment**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

#### Option B: SendGrid (Professional)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### **Step 5: AI Provider Setup**

#### OpenAI (Recommended)
```env
OPENAI_API_KEY=sk-your-openai-api-key
```

#### Free Trial Options
```env
# Use these for testing
OPENAI_API_KEY_TRIAL=sk-trial-key
ANTHROPIC_API_KEY_TRIAL=your-claude-trial-key
```

---

## 🧪 **Testing Your Setup**

### **1. Test Individual Components**

```bash
# Test WhatsApp
curl -X POST http://localhost:5000/api/communications/test/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test message"}'

# Test SMS
curl -X POST http://localhost:5000/api/communications/test/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test SMS"}'

# Test Email
curl -X POST http://localhost:5000/api/communications/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "message": "Test email"}'
```

### **2. Test Complete Reservation Flow**

```bash
# Run the interactive test
node test-reservation-flow.js

# Or test individual steps
curl -X POST http://localhost:5000/api/communications/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+1234567890",
            "to": "+1234567891",
            "type": "text",
            "text": {"body": "I want to book a room"}
          }]
        }
      }]
    }]
  }'
```

---

## 📱 **Real Guest Experience**

### **WhatsApp Flow**
```
Guest: Hi, I need a room for tonight
AI: Hello! Welcome to Grand Hotel. I'd be happy to help you make a reservation. What dates are you looking to stay with us?

Guest: March 15 to March 18
AI: Perfect! I have rooms available from March 15 to March 18. How many guests will be staying?

Guest: 2 guests
AI: Excellent! I have a Deluxe room available for 2 guests at $150/night. Your total for 3 nights would be $450.

To complete your reservation, I'll need your name and email address.

Guest: John Smith, john@example.com
AI: Thank you, John Smith! To secure your reservation, I'll need a credit card for authorization (like all hotels do). This is just to hold your room - you can pay at check-in.

Please provide your credit card number, expiry date (MM/YY), and CVC code.

Guest: 4242424242424242 12/25 123
AI: 🎉 Payment Authorized & Reservation Confirmed!

Thank you John Smith! Your credit card has been authorized and your reservation is confirmed.

📧 Confirmation details sent to john@example.com

See you on March 15! 🏨✨
```

### **Email Confirmation**
Beautiful HTML email with:
- Hotel branding
- Reservation details
- Payment authorization info
- Check-in instructions
- Cancellation policy

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Guest Phone   │───▶│  WhatsApp/SMS    │───▶│   AI Service    │
│                 │    │     Webhook      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Email Service   │◀───│ Payment Service  │◀───│ Conversation    │
│                 │    │   (Stripe)       │    │   Manager       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Hotel Dashboard │◀───│    Database      │◀───│ Reservation     │
│                 │    │   (MongoDB)      │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🎨 **Customization Options**

### **1. AI Personality**
Edit `HotelReservationAI.ts` to customize:
- Greeting messages
- Hotel-specific information
- Conversation flow
- Response tone

### **2. Email Templates**
Modify `EmailService.ts`:
- Hotel branding
- Colors and styling
- Additional information
- Multiple languages

### **3. Payment Flow**
Customize `PaymentService.ts`:
- Different payment providers
- Currency options
- Authorization vs. immediate charge
- Refund handling

### **4. Communication Channels**
Add more channels:
- Facebook Messenger
- Telegram
- Voice calls
- Web chat

---

## 🚀 **Deployment**

### **Option 1: Docker (Recommended)**
```bash
# Build and run
docker-compose up -d

# The system includes:
# - Backend API
# - MongoDB database
# - Redis for sessions
# - Nginx proxy
```

### **Option 2: Cloud Platforms**

#### Heroku
```bash
# Deploy backend
git push heroku main

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set STRIPE_SECRET_KEY=your-key
# ... etc
```

#### AWS/DigitalOcean
- Use the provided Docker configuration
- Set up load balancer
- Configure SSL certificates
- Set environment variables

---

## 📊 **Monitoring & Analytics**

### **Built-in Logging**
- All conversations logged
- Payment transactions tracked
- Error monitoring
- Performance metrics

### **Dashboard Features**
- Real-time conversations
- Reservation analytics
- Revenue tracking
- Guest satisfaction

---

## 🔒 **Security Best Practices**

1. **Environment Variables**
   - Never commit API keys
   - Use different keys for dev/prod
   - Rotate keys regularly

2. **Webhook Security**
   - Verify webhook signatures
   - Use HTTPS only
   - Rate limiting

3. **Payment Security**
   - PCI compliance
   - Tokenize card data
   - Audit payment logs

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### WhatsApp Not Receiving Messages
```bash
# Check webhook URL
curl -X GET "https://yourdomain.com/api/communications/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"

# Should return "test"
```

#### SMS Not Sending
```bash
# Verify Twilio credentials
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID.json" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

#### Payment Authorization Failing
```bash
# Test with Stripe test cards
# Check Stripe dashboard for error details
# Verify webhook endpoints
```

#### Email Not Sending
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check app password (not regular password)
# Verify 2FA is enabled
```

---

## 🎯 **Next Steps**

1. **Set up your first hotel**
2. **Configure communication channels**
3. **Test with real phone numbers**
4. **Customize AI responses**
5. **Deploy to production**
6. **Monitor and optimize**

---

## 💡 **Business Benefits**

- **24/7 Availability**: Never miss a reservation
- **Cost Reduction**: Reduce front desk staffing
- **Instant Responses**: Improve guest satisfaction
- **Payment Security**: Authorize cards like real hotels
- **Multi-Channel**: WhatsApp, SMS, email support
- **Scalable**: Handle multiple hotels

---

## 📞 **Support**

Need help? We've got you covered:
- 📧 Email: support@yourhoteltech.com
- 💬 WhatsApp: +1-555-HOTEL-AI
- 📖 Documentation: [docs.yourhoteltech.com](https://docs.yourhoteltech.com)
- 🎥 Video Tutorials: [youtube.com/yourhoteltech](https://youtube.com/yourhoteltech)

---

**🎉 Congratulations! You now have a complete AI-powered hotel reservation system!** 