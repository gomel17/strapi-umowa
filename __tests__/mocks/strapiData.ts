import { Page, StrapiData, StrapiResponse, StrapiSingleResponse } from '../../types/strapi';

// Mock Page data
export const mockPage: StrapiData<Page> = {
  id: 1,
  attributes: {
    title: 'Test Page',
    slug: 'test-page',
    content: '<p>This is test content</p>',
    description: 'Test page description',
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-02T12:00:00.000Z',
    publishedAt: '2025-01-02T12:00:00.000Z',
    image: {
      data: {
        id: 1,
        attributes: {
          name: 'test-image.jpg',
          alternativeText: 'Test Image',
          caption: 'Test Caption',
          width: 1920,
          height: 1080,
          formats: {
            thumbnail: {
              url: '/uploads/thumbnail_test_image_1234.jpg',
            }
          },
          hash: 'test_image_1234',
          ext: '.jpg',
          mime: 'image/jpeg',
          size: 123.45,
          url: '/uploads/test_image_1234.jpg',
          previewUrl: null,
          provider: 'local',
          createdAt: '2025-01-01T12:00:00.000Z',
          updatedAt: '2025-01-01T12:00:00.000Z',
        }
      }
    },
    seo: {
      metaTitle: 'Test Page | My Site',
      metaDescription: 'This is a test page for testing purposes',
    }
  }
};

// Mock Pages response
export const mockPagesResponse: StrapiResponse<StrapiData<Page>> = {
  data: [
    mockPage,
    {
      id: 2,
      attributes: {
        title: 'Second Page',
        slug: 'second-page',
        content: '<p>Content for the second page</p>',
        description: 'Description for second page',
        createdAt: '2025-01-03T12:00:00.000Z',
        updatedAt: '2025-01-03T12:00:00.000Z',
        publishedAt: '2025-01-03T12:00:00.000Z',
        image: null,
        seo: {
          metaTitle: 'Second Page | My Site',
          metaDescription: 'This is the second test page',
        }
      }
    }
  ],
  meta: {
    pagination: {
      page: 1,
      pageSize: 25,
      pageCount: 1,
      total: 2
    }
  }
};

// Mock single page response
export const mockSinglePageResponse: StrapiSingleResponse<Page> = {
  data: mockPage,
  meta: {}
};

// Mock error responses
export const mockErrorResponse = {
  error: {
    status: 404,
    name: 'NotFoundError',
    message: 'Not found',
    details: {}
  }
};

export const mockAuthErrorResponse = {
  error: {
    status: 401,
    name: 'UnauthorizedError',
    message: 'Invalid credentials',
    details: {}
  }
};

// Mock user data for authentication tests
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  provider: 'local',
  confirmed: true,
  blocked: false,
  createdAt: '2025-01-01T12:00:00.000Z',
  updatedAt: '2025-01-01T12:00:00.000Z',
  role: {
    id: 2,
    name: 'Authenticated',
    description: 'Default role for authenticated users',
    type: 'authenticated'
  }
};

export const mockAuthResponse = {
  jwt: 'mock-jwt-token-1234567890',
  user: mockUser
};