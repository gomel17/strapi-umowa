import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { mockAuthResponse, mockErrorResponse, mockPagesResponse, mockSinglePageResponse, mockUser } from './strapiData';

// Base URL for Strapi API
const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Define handlers for different API endpoints
export const handlers = [
  // Pages endpoint
  rest.get(`${baseUrl}/api/pages`, (req, res, ctx) => {
    const slug = req.url.searchParams.get('filters[slug][$eq]');
    
    if (slug === 'test-page') {
      // Return single page data if slug is specified
      return res(
        ctx.status(200),
        ctx.json({
          data: [mockPagesResponse.data[0]],
          meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } }
        })
      );
    }
    
    // Return all pages by default
    return res(
      ctx.status(200),
      ctx.json(mockPagesResponse)
    );
  }),
  
  // Single page endpoint (if using /api/pages/:id format)
  rest.get(`${baseUrl}/api/pages/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === '1') {
      return res(
        ctx.status(200),
        ctx.json(mockSinglePageResponse)
      );
    }
    
    return res(
      ctx.status(404),
      ctx.json(mockErrorResponse)
    );
  }),
  
  // Authentication endpoints
  rest.post(`${baseUrl}/api/auth/local`, (req, res, ctx) => {
    const { identifier, password } = req.body as any;
    
    if (identifier === 'test@example.com' && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json(mockAuthResponse)
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        error: {
          status: 401,
          name: 'ValidationError',
          message: 'Invalid identifier or password',
          details: {}
        }
      })
    );
  }),
  
  rest.post(`${baseUrl}/api/auth/local/register`, (req, res, ctx) => {
    const { username, email, password } = req.body as any;
    
    if (email && username && password) {
      return res(
        ctx.status(200),
        ctx.json(mockAuthResponse)
      );
    }
    
    return res(
      ctx.status(400),
      ctx.json({
        error: {
          status: 400,
          name: 'ValidationError',
          message: 'Missing required fields',
          details: {}
        }
      })
    );
  }),
  
  rest.get(`${baseUrl}/api/users/me`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader === 'Bearer mock-jwt-token-1234567890') {
      return res(
        ctx.status(200),
        ctx.json(mockUser)
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        error: {
          status: 401,
          name: 'UnauthorizedError',
          message: 'Invalid token',
          details: {}
        }
      })
    );
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);