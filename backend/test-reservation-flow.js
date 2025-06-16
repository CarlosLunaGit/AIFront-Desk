#!/usr/bin/env node

/**
 * 🏨 AI Hotel Reservation Flow Test
 * 
 * This script demonstrates the complete end-to-end reservation flow:
 * 1. Guest sends WhatsApp/SMS message
 * 2. AI processes and responds
 * 3. Collects reservation details
 * 4. Processes payment authorization
 * 5. Sends confirmation email
 * 
 * Usage: node test-reservation-flow.js
 */

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000';
const TEST_TENANT_ID = '507f1f77bcf86cd799439011'; // Mock tenant ID
const TEST_PHONE = '+1234567890';

// Test data
const GUEST_MESSAGES = [
  "Hi, I'd like to book a room for March 15 to March 18",
  "2 guests",
  "John Smith, john@example.com",
  "4242424242424242 12/25 123" // Test credit card
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function simulateWhatsAppMessage(message, step) {
  console.log(`\n📱 Step ${step}: Guest sends WhatsApp message`);
  console.log(`Guest: "${message}"`);
  
  try {
    // Simulate WhatsApp webhook payload
    const webhookPayload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              to: '+1234567891', // Hotel's WhatsApp number
              type: 'text',
              text: { body: message }
            }],
            contacts: [{
              profile: { name: 'John Smith' }
            }]
          }
        }]
      }]
    };

    const response = await axios.post(
      `${BASE_URL}/api/communications/whatsapp/webhook`,
      webhookPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log(`✅ Webhook processed: ${response.status}`);
    console.log(`🤖 AI Response: [Sent via WhatsApp]`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error in step ${step}:`, error.response?.data || error.message);
    return null;
  }
}

async function testReservationFlow() {
  console.log('🎯 Starting AI Hotel Reservation Flow Test');
  console.log('=' .repeat(50));
  
  console.log(`
🏨 Scenario: New guest wants to make a reservation
📱 Channel: WhatsApp
🎭 Guest: John Smith
📅 Dates: March 15-18, 2024
👥 Guests: 2 people
💳 Payment: Test credit card
  `);

  // Wait for user to start
  await new Promise(resolve => {
    rl.question('Press Enter to start the simulation...', resolve);
  });

  // Step 1: Initial reservation request
  await simulateWhatsAppMessage(GUEST_MESSAGES[0], 1);
  await sleep(2000);

  // Step 2: Provide guest count
  await simulateWhatsAppMessage(GUEST_MESSAGES[1], 2);
  await sleep(2000);

  // Step 3: Provide contact information
  await simulateWhatsAppMessage(GUEST_MESSAGES[2], 3);
  await sleep(2000);

  // Step 4: Provide payment information
  await simulateWhatsAppMessage(GUEST_MESSAGES[3], 4);
  await sleep(3000);

  console.log('\n🎉 Reservation Flow Complete!');
  console.log('=' .repeat(50));
  
  console.log(`
✅ Expected Results:
1. 📱 Guest received AI responses via WhatsApp
2. 💳 Credit card was authorized (not charged)
3. 📧 Confirmation email sent to john@example.com
4. 🏨 Hotel staff notified in dashboard
5. 📊 Reservation recorded in system

🔍 Check your logs to see the detailed flow!
  `);

  rl.close();
}

async function testSMSFlow() {
  console.log('\n📱 Testing SMS Flow...');
  
  try {
    const smsPayload = {
      From: TEST_PHONE,
      To: '+1234567891',
      Body: "Hi, do you have rooms available for tonight?"
    };

    const response = await axios.post(
      `${BASE_URL}/api/communications/sms/webhook`,
      smsPayload,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    console.log('✅ SMS webhook processed successfully');
  } catch (error) {
    console.error('❌ SMS test failed:', error.response?.data || error.message);
  }
}

async function testPaymentProcessing() {
  console.log('\n💳 Testing Payment Processing...');
  
  try {
    const paymentPayload = {
      tenantId: TEST_TENANT_ID,
      guestPhone: TEST_PHONE,
      message: "4242424242424242 12/25 123",
      channel: "whatsapp"
    };

    const response = await axios.post(
      `${BASE_URL}/api/communications/payment/process-from-message`,
      paymentPayload
    );

    console.log('✅ Payment processing test completed');
  } catch (error) {
    console.error('❌ Payment test failed:', error.response?.data || error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
async function main() {
  console.log('🚀 AI Hotel Management System - Reservation Flow Test');
  console.log('Version: 1.0.0');
  console.log('Author: Your Hotel Tech Company\n');

  try {
    // Test server connectivity
    console.log('🔍 Checking server connectivity...');
    await axios.get(`${BASE_URL}/api/auth/health`).catch(() => {
      console.log('⚠️  Server not running. Please start the backend server first:');
      console.log('   cd backend && npm run dev');
      process.exit(1);
    });
    
    console.log('✅ Server is running!\n');

    // Run the main test
    await testReservationFlow();
    
    // Additional tests
    console.log('\n🧪 Running Additional Tests...');
    await testSMSFlow();
    await testPaymentProcessing();
    
    console.log('\n🎊 All tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up real WhatsApp Business API credentials');
    console.log('2. Configure Stripe payment processing');
    console.log('3. Set up email service (Gmail/SendGrid)');
    console.log('4. Test with real phone numbers');
    console.log('5. Deploy to production environment');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted. Goodbye!');
  rl.close();
  process.exit(0);
});

// Run the test
if (require.main === module) {
  main();
} 