import { http, HttpResponse } from 'msw';

// Specific Communications API Handlers

export const communicationsEndpointsHandlers = [

    http.get('/api/communications/stats', () => {
        console.log('Debug 2');
        console.log('🔥 STATS ENDPOINT CALLED - returning stats object');
        const statsData = {
            channels: [
            { channel: 'whatsapp', active: 2, waiting: 1, resolved: 1, total: 4 },
            { channel: 'sms', active: 1, waiting: 0, resolved: 1, total: 2 },
            { channel: 'email', active: 1, waiting: 0, resolved: 0, total: 1 },
            { channel: 'call', active: 0, waiting: 0, resolved: 0, total: 0 }
            ],
            totalActive: 4,
            totalWaiting: 1,
            alertsCount: 1,
            avgResponseTime: 45,
            __debug: 'THIS_IS_STATS_DATA'
        };
        console.log('📊 Stats data being returned:', statsData);
        return HttpResponse.json(statsData);
    }),

    http.get('/api/communications/conversations', () => {
        console.log('Debug 3');
        console.log('🔥 CONVERSATIONS ENDPOINT CALLED - returning conversations array');
        return HttpResponse.json([
        {
            id: 'conv-1',
            guestId: 'guest-1',
            guestName: 'Sarah Johnson',
            guestPhone: '+1-555-0123',
            channel: 'whatsapp',
            status: 'ai',
            language: { code: 'en', name: 'English', flag: '🇺🇸', confidence: 0.95 },
            lastMessage: 'Thank you! What time is breakfast served?',
            lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            unreadCount: 1,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.9,
            priority: 'low',
            tags: ['breakfast', 'inquiry'],
            messages: [
            {
                id: 'msg-1',
                content: 'Hello! I have a reservation for tonight.',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                confidence: 0.95
            },
            {
                id: 'msg-2',
                content: 'Hello Sarah! Your reservation is confirmed for room 101. Check-in is at 3 PM.',
                type: 'outbound',
                sender: 'ai',
                status: 'read',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                confidence: 0.9
            },
            {
                id: 'msg-3',
                content: 'Thank you! What time is breakfast served?',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                confidence: 0.95
            }
            ]
        },
        {
            id: 'conv-2',
            guestId: 'guest-2',
            guestName: 'Carlos Mendez',
            guestPhone: '+1-555-0456',
            channel: 'whatsapp',
            status: 'waiting',
            language: { code: 'es', name: 'Spanish', flag: '🇪🇸', confidence: 0.88 },
            lastMessage: 'Necesito hablar con alguien urgentemente sobre mi reserva',
            lastMessageTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            unreadCount: 3,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.3,
            priority: 'high',
            tags: ['urgent', 'reservation', 'spanish'],
            messages: [
            {
                id: 'msg-4',
                content: 'Hola, tengo una reserva para mañana pero necesito cambiar la fecha.',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                confidence: 0.88
            },
            {
                id: 'msg-5',
                content: 'Por favor, espere un momento mientras reviso su reserva.',
                type: 'outbound',
                sender: 'ai',
                status: 'read',
                timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
                confidence: 0.6
            },
            {
                id: 'msg-6',
                content: 'Necesito hablar con alguien urgentemente sobre mi reserva',
                type: 'inbound',
                sender: 'guest',
                status: 'unread',
                timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                confidence: 0.3
            }
                    ]
        },
        {
            id: 'conv-3',
            guestId: 'guest-3',
            guestName: 'Emily Chen',
            guestPhone: '+1-555-0789',
            channel: 'sms',
            status: 'human',
            language: { code: 'en', name: 'English', flag: '🇺🇸', confidence: 0.98 },
            lastMessage: 'Perfect, thank you for your help!',
            lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            unreadCount: 0,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.8,
            priority: 'medium',
            tags: ['resolved', 'checkout'],
            messages: [
            {
                id: 'msg-7',
                content: 'Hi, I need to check out early tomorrow. Is that possible?',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                confidence: 0.98
            },
            {
                id: 'msg-8',
                content: 'Hello Emily! Yes, early checkout is possible. What time would you like to check out?',
                type: 'outbound',
                sender: 'staff',
                status: 'read',
                timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
                confidence: 1.0
            },
            {
                id: 'msg-9',
                content: 'Perfect, thank you for your help!',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                confidence: 0.98
            }
            ]
        }
        ]);
    }),

    http.get('/api/communications/conversations/:id', ({ params }) => {
        console.log('Debug 4');
        console.log('🔥 INDIVIDUAL CONVERSATION ENDPOINT CALLED with ID:', params.id);
        // Mock conversations data - should match the list above
        const mockConversations = [
        {
            id: 'conv-1',
            guestId: 'guest-1',
            guestName: 'Sarah Johnson',
            guestPhone: '+1-555-0123',
            channel: 'whatsapp',
            status: 'ai',
            language: { code: 'en', name: 'English', flag: '🇺🇸', confidence: 0.95 },
            lastMessage: 'Thank you! What time is breakfast served?',
            lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            unreadCount: 1,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.9,
            priority: 'low',
            tags: ['breakfast', 'inquiry'],
            messages: [
            {
                id: 'msg-1',
                content: 'Hello! I have a reservation for tonight.',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                confidence: 0.95
            },
            {
                id: 'msg-2',
                content: 'Hello Sarah! Your reservation is confirmed for room 101. Check-in is at 3 PM.',
                type: 'outbound',
                sender: 'ai',
                status: 'read',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                confidence: 0.9
            },
            {
                id: 'msg-3',
                content: 'Thank you! What time is breakfast served?',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                confidence: 0.95
            }
            ]
        },
        {
            id: 'conv-2',
            guestId: 'guest-2',
            guestName: 'Carlos Mendez',
            guestPhone: '+1-555-0456',
            channel: 'whatsapp',
            status: 'waiting',
            language: { code: 'es', name: 'Spanish', flag: '🇪🇸', confidence: 0.88 },
            lastMessage: 'Necesito hablar con alguien urgentemente sobre mi reserva',
            lastMessageTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            unreadCount: 3,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.3,
            priority: 'high',
            tags: ['urgent', 'reservation', 'spanish'],
            messages: [
            {
                id: 'msg-4',
                content: 'Hola, tengo una reserva para mañana pero necesito cambiar la fecha.',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                confidence: 0.88
            },
            {
                id: 'msg-5',
                content: 'Por favor, espere un momento mientras reviso su reserva.',
                type: 'outbound',
                sender: 'ai',
                status: 'read',
                timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
                confidence: 0.6
            },
            {
                id: 'msg-6',
                content: 'Necesito hablar con alguien urgentemente sobre mi reserva',
                type: 'inbound',
                sender: 'guest',
                status: 'unread',
                timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                confidence: 0.3
            }
                    ]
        },
        {
            id: 'conv-3',
            guestId: 'guest-3',
            guestName: 'Emily Chen',
            guestPhone: '+1-555-0789',
            channel: 'sms',
            status: 'human',
            language: { code: 'en', name: 'English', flag: '🇺🇸', confidence: 0.98 },
            lastMessage: 'Perfect, thank you for your help!',
            lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            unreadCount: 0,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.8,
            priority: 'medium',
            tags: ['resolved', 'checkout'],
            messages: [
            {
                id: 'msg-7',
                content: 'Hi, I need to check out early tomorrow. Is that possible?',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                confidence: 0.98
            },
            {
                id: 'msg-8',
                content: 'Hello Emily! Yes, early checkout is possible. What time would you like to check out?',
                type: 'outbound',
                sender: 'staff',
                status: 'read',
                timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
                confidence: 1.0
            },
            {
                id: 'msg-9',
                content: 'Perfect, thank you for your help!',
                type: 'inbound',
                sender: 'guest',
                status: 'read',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                confidence: 0.98
            }
            ]
        }
        ];

        const conversation = mockConversations.find(conv => conv.id === params.id);
        if (!conversation) {
        console.log('🚫 Conversation not found for ID:', params.id);
        return new HttpResponse(null, { status: 404 });
        }
        
        console.log('✅ Returning conversation:', conversation.id);
        return HttpResponse.json(conversation);
    }),

    http.post('/api/communications/conversations/:id/messages', async ({ request, params }) => {
        console.log('Debug 5');
        const body = await request.json() as any;
        return HttpResponse.json({
        id: `msg-${Date.now()}`,
        content: body.content,
        type: 'outbound',
        sender: 'staff',
        status: 'sent',
        timestamp: new Date().toISOString(),
        confidence: 1.0
        });
    }),

    http.post('/api/communications/conversations/:id/takeover', ({ params }) => {
        console.log('Debug 6');
        return HttpResponse.json({
        success: true,
        conversation: {
            id: params.id,
            guestId: 'guest-1',
            guestName: 'Sarah Johnson',
            guestPhone: '+1-555-0123',
            channel: 'whatsapp',
            status: 'human',
            language: { code: 'en', name: 'English', flag: '🇺🇸', confidence: 0.95 },
            lastMessage: 'Thank you! What time is breakfast served?',
            lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            unreadCount: 1,
            hotelId: 'mock-hotel-1',
            hotelName: 'Grand Plaza Hotel',
            aiConfidence: 0.9,
            priority: 'low',
            tags: ['breakfast', 'inquiry'],
            messages: []
        }
        });
    }),

];