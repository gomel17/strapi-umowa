import { getAllPages, getPageBySlug, getPagePaths } from '../../lib/api';
import { mockPage, mockPagesResponse } from '../mocks/strapiData';
import { fetchAPI } from '../../lib/strapi';

// Mock the fetchAPI function
jest.mock('../../lib/strapi', () => ({
  fetchAPI: jest.fn(),
}));

const mockedFetchAPI = fetchAPI as jest.MockedFunction<typeof fetchAPI>;

describe('API Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPageBySlug', () => {
    it('fetches a page by slug correctly', async () => {
      // Mock the response for a single page query
      mockedFetchAPI.mockResolvedValueOnce({
        data: [mockPage],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } }
      });

      const page = await getPageBySlug('test-page');
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', {
        filters: {
          slug: {
            $eq: 'test-page',
          },
        },
        populate: '*',
      });
      
      expect(page).toEqual(mockPage);
    });

    it('returns null when page is not found', async () => {
      // Mock empty response when page is not found
      mockedFetchAPI.mockResolvedValueOnce({
        data: [],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } }
      });

      const page = await getPageBySlug('non-existent-page');
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', expect.anything());
      expect(page).toBeNull();
    });
  });

  describe('getAllPages', () => {
    it('fetches all pages with default parameters', async () => {
      mockedFetchAPI.mockResolvedValueOnce(mockPagesResponse);

      const response = await getAllPages();
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', {
        populate: '*',
        pagination: { page: 1, pageSize: 100 },
        sort: ['publishedAt:desc'],
      });
      
      expect(response).toEqual(mockPagesResponse);
    });

    it('fetches pages with custom parameters', async () => {
      mockedFetchAPI.mockResolvedValueOnce(mockPagesResponse);

      const customParams = {
        populate: 'image,seo',
        pagination: { page: 2, pageSize: 10 },
        sort: ['title:asc'],
      };

      await getAllPages(customParams);
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', customParams);
    });
  });

  describe('getPagePaths', () => {
    it('gets all page paths for static generation', async () => {
      // Mock response with two pages
      mockedFetchAPI.mockResolvedValueOnce({
        data: [
          { attributes: { slug: 'test-page' } },
          { attributes: { slug: 'second-page' } },
        ],
        meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 2 } }
      });

      const paths = await getPagePaths();
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', {
        fields: ['slug'],
        pagination: { page: 1, pageSize: 100 },
      });
      
      expect(paths).toEqual([
        { params: { slug: 'test-page' } },
        { params: { slug: 'second-page' } },
      ]);
    });

    it('returns empty array when no pages found', async () => {
      // Mock empty response
      mockedFetchAPI.mockResolvedValueOnce({
        data: [],
        meta: { pagination: { page: 1, pageSize: 100, pageCount: 0, total: 0 } }
      });

      const paths = await getPagePaths();
      
      expect(mockedFetchAPI).toHaveBeenCalledWith('/pages', expect.anything());
      expect(paths).toEqual([]);
    });
  });
});