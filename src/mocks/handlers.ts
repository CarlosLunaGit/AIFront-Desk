import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';

// Type definitions for our API
interface MessageRequest {
  content: string;
  recipientId: string;
  type: 'text' | 'image' | 'file';
}

interface LoginRequest {
  email: string;
  password: string;
}

// Mock data
const mockStats = {
  activeGuests: 12,
  availableRooms: 25,
  pendingMessages: 5,
  todayBookings: 8,
};

const mockMessages = [
  {
    id: '1',
    content: 'Hello, I would like to check in early',
    type: 'inbound',
    status: 'read',
    timestamp: new Date().toISOString(),
    sender: {
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  },
  {
    id: '2',
    content: 'Of course! We can accommodate early check-in at 1 PM. Would that work for you?',
    type: 'outbound',
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sender: {
      name: 'Hotel Staff',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  },
];

// Mock handlers
export const handlers: HttpHandler[] = [
  // Dashboard stats
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json(mockStats);
  }),

  // Messages
  http.get('/api/communications/:guestId', () => {
    return HttpResponse.json(mockMessages);
  }),

  // Send message
  http.post('/api/communications/send', async ({ request }) => {
    const body = await request.json() as MessageRequest;
    const newMessage = {
      id: Date.now().toString(),
      content: body.content,
      recipientId: body.recipientId,
      type: body.type,
      timestamp: new Date().toISOString(),
      status: 'sent',
      sender: {
        id: '1',
        name: 'Hotel Staff',
        avatar: '/staff-avatar.png'
      }
    };
    return HttpResponse.json(newMessage);
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest;
    if (body.email === 'demo@hotel.com' && body.password === 'demo123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          name: 'Hotel Staff',
          email: body.email,
          role: 'staff'
        }
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'demo@hotel.com',
      name: 'Demo Hotel',
      hotelName: 'Demo Hotel',
      subscriptionTier: 'premium',
    });
  }),
]; 