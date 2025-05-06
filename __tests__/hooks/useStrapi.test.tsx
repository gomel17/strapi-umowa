import { renderHook } from '@testing-library/react';
import { usePage, usePages, useContent } from '../../hooks/useStrapi';
import { SWRConfig } from 'swr';
import React from 'react';
import { mockPage, mockPagesResponse } from '../mocks/strapiData';

// Mock the SWR hook
jest.mock('swr', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

// Import the mocked version
import useSWR from 'swr';

describe('useStrapi Hooks', () => {
  const mockedUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );

  describe('usePage', () => {
    it('returns page data when available', async () => {
      // Mock the SWR response
      mockedUseSWR.mockReturnValueOnce({
        data: mockPage,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { result } = renderHook(() => usePage('test-page'), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        '/api/strapi/pages/test-page',
        expect.any(Function)
      );
      
      expect(result.current).toEqual({
        page: mockPage,
        isLoading: false,
        isError: undefined,
      });
    });

    it('returns loading state', async () => {
      mockedUseSWR.mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isLoading: true,
        isValidating: true,
        mutate: jest.fn(),
      } as any);

      const { result } = renderHook(() => usePage('test-page'), { wrapper });
      
      expect(result.current).toEqual({
        page: undefined,
        isLoading: true,
        isError: undefined,
      });
    });

    it('returns error state', async () => {
      const error = new Error('Failed to fetch page');
      mockedUseSWR.mockReturnValueOnce({
        data: undefined,
        error,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { result } = renderHook(() => usePage('test-page'), { wrapper });
      
      expect(result.current).toEqual({
        page: undefined,
        isLoading: false,
        isError: error,
      });
    });

    it('returns null when slug is not provided', async () => {
      const { result } = renderHook(() => usePage(''), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        null,
        expect.any(Function)
      );
    });
  });

  describe('usePages', () => {
    it('returns pages data when available', async () => {
      mockedUseSWR.mockReturnValueOnce({
        data: mockPagesResponse,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { result } = renderHook(() => usePages(), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        '/api/strapi/pages?limit=10',
        expect.any(Function)
      );
      
      expect(result.current).toEqual({
        pages: mockPagesResponse.data,
        pagination: mockPagesResponse.meta.pagination,
        isLoading: false,
        isError: undefined,
      });
    });

    it('accepts custom limit parameter', async () => {
      mockedUseSWR.mockReturnValueOnce({
        data: mockPagesResponse,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      renderHook(() => usePages({ limit: 20 }), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        '/api/strapi/pages?limit=20',
        expect.any(Function)
      );
    });
  });

  describe('useContent', () => {
    it('fetches generic content with correct path', async () => {
      mockedUseSWR.mockReturnValueOnce({
        data: { some: 'data' },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      const { result } = renderHook(() => useContent('/articles'), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        '/api/strapi/articles',
        expect.any(Function)
      );
      
      expect(result.current).toEqual({
        data: { some: 'data' },
        isLoading: false,
        isError: undefined,
        refresh: expect.any(Function),
      });
    });

    it('adds query parameters to path', async () => {
      mockedUseSWR.mockReturnValueOnce({
        data: { some: 'data' },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any);

      renderHook(() => useContent('/articles', { 
        populate: '*',
        sort: 'createdAt:desc'
      }), { wrapper });
      
      expect(mockedUseSWR).toHaveBeenCalledWith(
        '/api/strapi/articles?populate=%2A&sort=createdAt%3Adesc',
        expect.any(Function)
      );
    });

    it('handles refresh correctly', async () => {
      const mockMutate = jest.fn();
      mockedUseSWR.mockReturnValueOnce({
        data: { some: 'data' },
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: mockMutate,
      } as any);

      const { result } = renderHook(() => useContent('/articles'), { wrapper });
      
      result.current.refresh();
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});