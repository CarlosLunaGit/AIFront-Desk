// Enhanced Reservation Endpoints Test Script
// Run this in the browser console when the React app is running with MSW enabled

console.log('🧪 Testing Enhanced Reservation Endpoints...');

async function testEnhancedReservationEndpoints() {
  const results = [];
  
  // Test 1: Room Availability
  console.log('1️⃣ Testing Room Availability...');
  try {
    const response = await fetch('/api/rooms/availability?checkInDate=2025-06-29&checkOutDate=2025-07-02&totalGuests=2&hotelId=65b000000000000000000001');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Room Availability: SUCCESS', data);
      results.push({ test: 'Room Availability', status: 'SUCCESS', data });
    } else {
      console.log('❌ Room Availability: FAILED', data);
      results.push({ test: 'Room Availability', status: 'FAILED', error: data });
    }
  } catch (error) {
    console.log('❌ Room Availability: ERROR', error.message);
    results.push({ test: 'Room Availability', status: 'ERROR', error: error.message });
  }

  // Test 2: Reservation Pricing
  console.log('2️⃣ Testing Reservation Pricing...');
  try {
    const response = await fetch('/api/reservations/pricing?roomIds=room-101,room-102&checkInDate=2025-06-29&checkOutDate=2025-07-02&guestCount=2&hotelId=65b000000000000000000001');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Reservation Pricing: SUCCESS', data);
      results.push({ test: 'Reservation Pricing', status: 'SUCCESS', data });
    } else {
      console.log('❌ Reservation Pricing: FAILED', data);
      results.push({ test: 'Reservation Pricing', status: 'FAILED', error: data });
    }
  } catch (error) {
    console.log('❌ Reservation Pricing: ERROR', error.message);
    results.push({ test: 'Reservation Pricing', status: 'ERROR', error: error.message });
  }

  // Test 3: Create Enhanced Reservation
  console.log('3️⃣ Testing Create Enhanced Reservation...');
  try {
    const reservationData = {
      checkInDate: '2025-06-29',
      checkOutDate: '2025-07-02',
      hotelId: '65b000000000000000000001',
      roomAssignments: [
        {
          roomId: 'room-101',
          guests: [{ name: 'Test Guest', email: 'test@example.com', phone: '+1234567890' }]
        }
      ],
      pricing: { total: 450, currency: 'USD' }
    };

    const response = await fetch('/api/reservations/enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Create Enhanced Reservation: SUCCESS', data);
      results.push({ test: 'Create Enhanced Reservation', status: 'SUCCESS', data });
    } else {
      console.log('❌ Create Enhanced Reservation: FAILED', data);
      results.push({ test: 'Create Enhanced Reservation', status: 'FAILED', error: data });
    }
  } catch (error) {
    console.log('❌ Create Enhanced Reservation: ERROR', error.message);
    results.push({ test: 'Create Enhanced Reservation', status: 'ERROR', error: error.message });
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.table(results);
  
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Enhanced Reservation endpoints are working correctly.');
  } else {
    console.log(`⚠️ ${successCount}/${totalCount} tests passed. Some endpoints may need attention.`);
  }
  
  return results;
}

// Run the tests
testEnhancedReservationEndpoints(); 