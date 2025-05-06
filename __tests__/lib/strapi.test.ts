import { fetchAPI, getStrapiMedia, getStrapiURL, StrapiApiError } from '../../lib/strapi';
import { mockPagesResponse } from '../mocks/strapiData';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Strapi Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStrapiURL', () => {
    it('returns URL with default base when no path provided', () => {
      expect(getStrapiURL()).toBe('http://localhost:1337');
    });

    it('appends path to base URL', () => {
      expect(getStrapiURL('/api/pages')).toBe('http://localhost:1337/api/pages');
    });
  });

  describe('fetchAPI', () => {
    it('fetches data successfully', async () => {
      const mockResponse = { data: mockPagesResponse };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await fetchAPI('/pages');
      expect(result).toEqual(mockPagesResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:1337/api/pages', 
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('adds correct query parameters', async () => {
      const mockResponse = { data: mockPagesResponse };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await fetchAPI('/pages', { 
        filters: { slug: { $eq: 'test' } },
        populate: '*'
      });
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('filters%5Bslug%5D%5B%24eq%5D=test&populate=%2A'),
        expect.anything()
      );
    });

    it('adds preview state when preview is true', async () => {
      const mockResponse = { data: mockPagesResponse };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await fetchAPI('/pages', {}, {}, true);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('publicationState=preview'),
        expect.anything()
      );
    });

    it('handles response error correctly', async () => {
      const mockError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Page not found' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(fetchAPI('/pages')).rejects.toThrow(StrapiApiError);
      await expect(fetchAPI('/pages')).rejects.toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('Not Found')
      });
    });

    it('handles network error correctly', async () => {
      const mockError = {
        request: {},
        message: 'Network Error'
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(fetchAPI('/pages')).rejects.toThrow(StrapiApiError);
      await expect(fetchAPI('/pages')).rejects.toMatchObject({
        statusCode: 0,
        message: expect.stringContaining('Network error')
      });
    });
  });

  describe('getStrapiMedia', () => {
    it('returns full URL for media with relative path', () => {
      const media = {
        data: {
          id: 1,
          attributes: {
            url: '/uploads/image.jpg',
            // Other required properties omitted for brevity
            name: 'image.jpg',
            alternativeText: null,
            caption: null,
            width: 800,
            height: 600,
            formats: null,
            hash: 'image_hash',
            ext: '.jpg',
            mime: 'image/jpeg',
            size: 123.45,
            previewUrl: null,
            provider: 'local',
            createdAt: '2025-01-01T12:00:00.000Z',
            updatedAt: '2025-01-01T12:00:00.000Z',
          }
        }
      };

      expect(getStrapiMedia(media)).toBe('http://localhost:1337/uploads/image.jpg');
    });

    it('returns absolute URL for media with absolute path', () => {
      const media = {
        data: {
          id: 1,
          attributes: {
            url: 'https://example.com/uploads/image.jpg',
            // Other required properties omitted for brevity
            name: 'image.jpg',
            alternativeText: null,
            caption: null,
            width: 800,
            height: 600,
            formats: null,
            hash: 'image_hash',
            ext: '.jpg',
            mime: 'image/jpeg',
            size: 123.45,
            previewUrl: null,
            provider: 'local',
            createdAt: '2025-01-01T12:00:00.000Z',
            updatedAt: '2025-01-01T12:00:00.000Z',
          }
        }
      };

      expect(getStrapiMedia(media)).toBe('https://example.com/uploads/image.jpg');
    });

    it('returns null for null or undefined media', () => {
      expect(getStrapiMedia(null)).toBeNull();
      expect(getStrapiMedia(undefined)).toBeNull();
      expect(getStrapiMedia({ data: null })).toBeNull();
    });
  });
});