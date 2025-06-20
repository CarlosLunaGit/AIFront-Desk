# 📱 Twilio WhatsApp Testing Guide

## 🎯 **Objective**
Test the AI Hotel Receptionist WhatsApp integration using Twilio's sandbox environment.

## 📋 **Prerequisites**
- ✅ Backend server running on port 3001
- ✅ MongoDB connected and populated with test data
- ✅ Twilio account with WhatsApp sandbox access
- ✅ ngrok or similar tunneling service for webhook testing

## 🔧 **Setup Steps**

### **1. Twilio Configuration**
Your Twilio settings should be configured in `backend/.env`:
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### **2. Webhook Configuration**
- **Webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/communications/twilio/whatsapp/webhook`
- **HTTP Method**: POST
- **Content Type**: application/x-www-form-urlencoded

### **3. WhatsApp Sandbox Setup**
1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Join sandbox by sending: `join circle-ride` to `+1 415 523 8886`
3. You should receive confirmation: "You are all set! You have joined the sandbox..."

## 🧪 **Testing Scenarios**

### **Basic Greeting Test**
**Send**: `Hello!`
**Expected**: Welcome message from Grand Plaza Hotel

### **Reservation Request Test**
**Send**: `I need a room for 2 people this weekend`
**Expected**: AI should detect reservation intent and ask for dates

### **Date Specification Test**
**Send**: `Friday 27th June till Sunday 29th`
**Expected**: AI should process dates and ask for guest count or preferences

### **Amenities Inquiry Test**
**Send**: `What amenities do you have?`
**Expected**: Information about hotel facilities

### **General Help Test**
**Send**: `Can you help me with my reservation?`
**Expected**: Professional assistance offer

## 📊 **Expected Log Output**
```
[info]: Twilio WhatsApp message received: {"body":"Hello!","from":"whatsapp:+YOUR_PHONE","to":"whatsapp:+14155238886"}
[info]: Found tenant: {"tenantId":"xxx","tenantName":"Grand Plaza Hotel"}
[info]: Processing message with state: greeting
[info]: Making OpenAI API call: {"model":"gpt-3.5-turbo"}
[info]: Twilio WhatsApp message sent: {"messageSid":"SMxxx","status":"queued"}
```

## 🎯 **Success Criteria**
- ✅ Messages route to correct hotel (Grand Plaza Hotel)
- ✅ AI responses are contextual and professional
- ✅ Conversation state transitions properly
- ✅ No 404 or 500 errors in logs
- ✅ Response time under 3 seconds

## 🚨 **Troubleshooting**

### **404 Webhook Errors**
- Check ngrok tunnel is active
- Verify webhook URL in Twilio console
- Ensure server is running on port 3001

### **No AI Responses**
- Check OpenAI API key configuration
- Verify rate limits not exceeded
- Check logs for API errors

### **Database Issues**
- Ensure MongoDB is running
- Check tenant data exists
- Verify phone number mapping

### **Rate Limiting**
- OpenAI free tier: 3 requests/minute
- Add billing to OpenAI for higher limits
- Check usage dashboard

## 📱 **Multi-Tenant Testing**

### **Current Setup**
- **Grand Plaza Hotel**: Uses Twilio sandbox (+14155238886)
- **Seaside Resort**: Configured for future dedicated number

### **Production Scaling**
- Each hotel gets dedicated Twilio phone number
- Webhook routes messages based on "To" field
- Tenant lookup by phone number

## 🔄 **Continuous Testing**
1. Test different message types daily
2. Monitor response quality and accuracy
3. Check conversation flow completeness
4. Verify multi-language support (if enabled)
5. Test edge cases and error scenarios

## 📈 **Performance Metrics**
- **Response Time**: < 3 seconds
- **AI Confidence**: > 0.7 for clear requests
- **Conversation Completion**: > 80%
- **Error Rate**: < 5%

---
**Last Updated**: June 20, 2025
**Status**: ✅ Fully Functional with OpenAI Integration 