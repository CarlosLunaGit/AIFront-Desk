# 🏨 Hotel Room Status Lifecycle Documentation

## 📋 **Overview**

This document defines the comprehensive room status lifecycle and reservation management system for the AI Hotel Receptionist platform. It covers the complete guest journey from booking to checkout, including all room status transitions and business logic.

## 🔄 **Room Status Types**

### **Primary Statuses**
| Status | Code | Color | Description | Business Logic |
|--------|------|-------|-------------|----------------|
| **Available** | A | Green | Room is ready for booking | No guests assigned |
| **Reserved** | R | Dark Gray | Room is fully booked | At capacity OR any guest wants room closed |
| **Partially Reserved** | PR | Light Gray | Room has space, all guests want it open | Has guests, under capacity, all keepOpen=true |
| **Occupied** | O | Red | Room is fully occupied | All guests checked-in AND (at capacity OR any keepOpen=false) |
| **Partially Occupied** | PO | Orange | Room has checked-in guests with space | Some checked-in, under capacity |
| **Cleaning** | C | Blue | Room is being cleaned | All guests checked out |
| **Maintenance** | M | Yellow | Room is under maintenance | Manual maintenance mode |

### **New Deoccupied Statuses**
| Status | Code | Color | Description | Business Logic |
|--------|------|-------|-------------|----------------|
| **Deoccupied** | D | Orange | All guests checked out, needs cleaning | Some guests checked out, none remaining |
| **Partially Deoccupied** | PD | Dark Orange | Some guests checked out, others remain | Mixed checkout scenario |

## 🎯 **Real Hotel Lifecycle**

### **Complete Guest Journey**

```
1. 📅 BOOKING PHASE
   Guest makes reservation → Room: Reserved → Reservation: ACTIVE
   
2. 🏨 CHECK-IN PHASE  
   Guest arrives and checks in → Room: Occupied → Reservation: ACTIVE
   
3. 🛏️ STAY PHASE
   Guest is staying → Room: Occupied/Partially Occupied → Reservation: ACTIVE
   
4. 🚪 CHECK-OUT PHASE
   Guest leaves → Room: Deoccupied → Reservation: INACTIVE
   
5. 🧹 CLEANING PHASE
   Housekeeping cleans → Room: Cleaning → Reservation: INACTIVE
   
6. ✅ READY PHASE
   Room cleaned and ready → Room: Available → Ready for new bookings
```

### **Multi-Guest Scenarios**

#### **Scenario 1: Family Room (Capacity 4)**
```
Initial: 2 guests book → Room: Partially Reserved → Reservation: ACTIVE
Add: 2 more guests book → Room: Reserved → Reservation: ACTIVE
Check-in: All 4 guests → Room: Occupied → Reservation: ACTIVE
Check-out: 2 guests leave → Room: Partially Deoccupied → Reservation: ACTIVE
Check-out: All guests leave → Room: Deoccupied → Reservation: INACTIVE
```

#### **Scenario 2: Business Travelers (Capacity 2)**
```
Guest A books (keepOpen: true) → Room: Partially Reserved → Reservation: ACTIVE
Guest B books (keepOpen: false) → Room: Reserved → Reservation: ACTIVE
Guest A checks in → Room: Partially Occupied → Reservation: ACTIVE
Guest B checks in → Room: Occupied → Reservation: ACTIVE
Guest A checks out → Room: Partially Deoccupied → Reservation: ACTIVE
Guest B checks out → Room: Cleaning → Reservation: INACTIVE
```

## 📊 **Business Logic Truth Table**

### **Room Status Calculation Priority**

| Guest Status(es) | Room Capacity | keepOpen Settings | Final Room Status | Reasoning |
|-----------------|---------------|-------------------|-------------------|-----------|
| All booked | Under capacity | All true | Partially Reserved | Room has space, guests want it open |
| All booked | At capacity | Any | Reserved | Room is full |
| All booked | Under capacity | Any false | Reserved | At least one guest wants room closed |
| All checked-in | Under capacity | All true | Partially Occupied | Room has space for more |
| All checked-in | At capacity | Any | Occupied | Room is full |
| All checked-in | Any | Any false | Occupied | At least one guest wants room closed |
| Mixed booked/checked-in | Any | Any | Partially Occupied | Active guests present |
| All checked-out | Any | Any | Cleaning | Needs housekeeping |
| Some checked-out | Remaining guests | Any | Partially Deoccupied | Mixed checkout state |
| Some checked-out | No remaining | Any | Deoccupied | All active guests gone |

### **Reservation Status Logic**

| Room Status | Guest Status | Reservation Status | Reason |
|-------------|--------------|-------------------|---------|
| Available | None | N/A | No reservation |
| Reserved | Booked | **ACTIVE** | Future reservation |
| Partially Reserved | Booked | **ACTIVE** | Future reservation |
| Occupied | Checked-in | **ACTIVE** | Current stay |
| Partially Occupied | Mixed | **ACTIVE** | Current stay |
| Cleaning | Checked-out | **INACTIVE** | Needs cleaning |
| Deoccupied | Checked-out | **INACTIVE** | All guests left |
| Partially Deoccupied | Mixed | **ACTIVE** | Some guests remain |
| Maintenance | Any | **INACTIVE** | Room maintenance |

## 🔧 **Implementation Details**

### **Room Status Calculation Function**

```typescript
export function recalculateRoomStatus(room: Room, guests: Guest[]): { status: RoomStatus, keepOpen: boolean } {
  const capacity = room.capacity || 1;
  
  if (guests.length === 0) {
    return { status: 'available', keepOpen: false };
  }

  // Separate guests by status
  const bookedGuests = guests.filter(g => g.status === 'booked');
  const checkedInGuests = guests.filter(g => g.status === 'checked-in');
  const checkedOutGuests = guests.filter(g => g.status === 'checked-out');

  // Business logic priority (real hotel scenario):
  
  // 1. All guests checked out → cleaning
  if (guests.every(g => g.status === 'checked-out')) {
    return { status: 'cleaning', keepOpen: false };
  }

  // 2. Mixed checkout scenario → deoccupied states
  if (checkedOutGuests.length > 0 && (checkedInGuests.length > 0 || bookedGuests.length > 0)) {
    return { status: 'partially-deoccupied', keepOpen };
  }

  // 3. Some guests checked out, none remaining → deoccupied
  if (checkedOutGuests.length > 0 && checkedInGuests.length === 0 && bookedGuests.length === 0) {
    return { status: 'deoccupied', keepOpen: false };
  }

  // 4-8. Additional logic for active guest scenarios...
}
```

### **Reservation Status Determination**

```typescript
export function determineReservationStatus(guests: Guest[], room: Room): ReservationStatus {
  // INACTIVE scenarios
  if (guests.every(g => g.status === 'checked-out')) {
    return { isActive: false, reason: 'All guests have checked out', category: 'inactive' };
  }

  if (['cleaning', 'deoccupied', 'partially-deoccupied', 'maintenance'].includes(room.status)) {
    return { isActive: false, reason: `Room is ${room.status}`, category: 'inactive' };
  }

  // ACTIVE scenarios
  if (guests.some(g => g.status === 'booked' || g.status === 'checked-in')) {
    return { isActive: true, reason: 'Guests are booked or checked in', category: 'active' };
  }

  return { isActive: false, reason: 'Unknown status', category: 'inactive' };
}
```

## 🎨 **Visual Design System**

### **Status Badge Colors**
```css
.status-available { background: #4CAF50; } /* Green */
.status-occupied { background: #F44336; } /* Red */
.status-partially-occupied { background: #FF9800; } /* Orange */
.status-partially-reserved { background: #BDBDBD; } /* Light Gray */
.status-reserved { background: #616161; } /* Dark Gray */
.status-deoccupied { background: #FF9800; } /* Orange */
.status-partially-deoccupied { background: #FF6F00; } /* Dark Orange */
.status-maintenance { background: #FFD600; } /* Yellow */
.status-cleaning { background: #2196F3; } /* Blue */
```

### **Status Initials**
- **A** = Available
- **R** = Reserved  
- **PR** = Partially Reserved
- **O** = Occupied
- **PO** = Partially Occupied
- **D** = Deoccupied
- **PD** = Partially Deoccupied
- **M** = Maintenance
- **C** = Cleaning

## 📱 **User Interface Components**

### **Reservations Page Tabs**
- **Active Tab**: Shows reservations with active guests or pending check-ins
- **Inactive Tab**: Shows completed, cancelled, or maintenance reservations
- **Status Chips**: Color-coded indicators with detailed tooltips

### **Room Management Grid**
- **Status Badges**: Text initials with color coding
- **Interactive Legend**: Hover tooltips with detailed descriptions
- **Filter Options**: All status types available in dropdown

## 🧪 **Testing Scenarios**

### **Test Case 1: Single Guest Lifecycle**
```
1. Alice books Room 101 (capacity 2, keepOpen: true)
   Expected: Room = Partially Reserved, Reservation = ACTIVE

2. Alice checks in
   Expected: Room = Partially Occupied, Reservation = ACTIVE

3. Alice checks out
   Expected: Room = Deoccupied, Reservation = INACTIVE

4. Housekeeping cleans
   Expected: Room = Cleaning, Reservation = INACTIVE

5. Room ready
   Expected: Room = Available, No reservation
```

### **Test Case 2: Multi-Guest Checkout**
```
1. Alice + Bob book Room 102 (capacity 2)
   Expected: Room = Reserved, Reservation = ACTIVE

2. Both check in
   Expected: Room = Occupied, Reservation = ACTIVE

3. Alice checks out (Bob remains)
   Expected: Room = Partially Deoccupied, Reservation = ACTIVE

4. Bob checks out
   Expected: Room = Cleaning, Reservation = INACTIVE
```

### **Test Case 3: Business Preferences**
```
1. Alice books (keepOpen: true), Bob books (keepOpen: false)
   Expected: Room = Reserved (Bob wants room closed)

2. Alice checks in, Bob still booked
   Expected: Room = Partially Occupied, Reservation = ACTIVE

3. Bob checks in with keepOpen: false
   Expected: Room = Occupied (room closed for further bookings)
```

## 📈 **Business Benefits**

### **For Hotel Staff**
- **Clear Visual Indicators**: Instant room status recognition
- **Efficient Housekeeping**: Knows which rooms need cleaning
- **Optimized Bookings**: Understands room availability at a glance
- **Guest Satisfaction**: Proper room preparation and service

### **For Hotel Management**
- **Revenue Optimization**: Better room utilization tracking
- **Operational Efficiency**: Streamlined check-in/check-out processes
- **Data-Driven Decisions**: Clear reservation lifecycle analytics
- **Quality Control**: Systematic room status management

### **For Guests**
- **Seamless Experience**: Rooms ready when expected
- **Preference Respect**: keepOpen settings honored
- **Quick Service**: Efficient check-in/check-out processes
- **Consistent Quality**: Standardized room preparation

## 🔮 **Future Enhancements**

### **Planned Features**
- **Automated Status Transitions**: Time-based status changes
- **Housekeeping Integration**: Staff mobile app notifications
- **Predictive Analytics**: Forecast room availability
- **Guest Preference Learning**: AI-powered keepOpen suggestions
- **Integration APIs**: PMS and booking system connections

### **Advanced Scenarios**
- **Extended Stay Management**: Long-term guest handling
- **Group Reservations**: Multi-room coordination
- **VIP Guest Handling**: Priority status and special services
- **Maintenance Scheduling**: Predictive maintenance alerts

---

**Last Updated**: June 26, 2024  
**Version**: 1.0  
**Status**: ✅ **Production Ready**

This documentation serves as the definitive guide for understanding and implementing the hotel room status lifecycle system. 