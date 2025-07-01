import { http, HttpResponse } from "msw";

interface LoginRequest {
    email: string;
    password: string;
}

export const authEndpointsHandlers = [
    // Auth endpoints
    http.post('/api/auth/login', async ({ request }) => {
        console.log('Debug Auth 1');
        const { email, password } = await request.json() as LoginRequest;
        
        // Mock authentication logic
        if (email && password) {
          const user = {
            id: 'user-1',
            email,
            name: email.split('@')[0],
            role: 'admin',
            hotelId: '65b000000000000000000001'
          };
    
          return HttpResponse.json({
            user,
            token: 'mock-jwt-token',
            expiresIn: '7d'
          });
        }
    
        return new HttpResponse(null, { status: 401 });
      }),
    
      // Get current user
      http.get('/api/auth/me', () => {
        console.log('Debug Auth 2');
        const user = {
          id: 'user-1',
          email: 'admin@aifrontdesk.com',
          name: 'Admin User',
          role: 'admin',
          hotelId: '65b000000000000000000001'
        };
    
        return HttpResponse.json(user);
      }),
    
      // Register endpoint (placeholder)
      http.post('/api/auth/register', async ({ request }) => {
        console.log('Debug Auth 3');
        const userData = await request.json() as any;
        
        const newUser = {
          id: `user-${Date.now()}`,
          ...userData,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
    
        return HttpResponse.json({
          user: newUser,
          token: 'mock-jwt-token',
          expiresIn: '7d'
        }, { status: 201 });
      })
];