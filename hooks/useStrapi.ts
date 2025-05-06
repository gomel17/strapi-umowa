'use client';

import useSWR from 'swr';
import { StrapiData, StrapiResponse, StrapiSingleResponse, Page } from '@/types/strapi';

/**
 * Base fetcher function that will be used by SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

/**
 * Custom hook to fetch a page by slug
 */
export function usePage(slug: string) {
  const apiUrl = `/api/strapi/pages/${slug}`;
  
  const { data, error, isLoading } = useSWR<StrapiData<Page>>(
    slug ? apiUrl : null,
    fetcher
  );
  
  return {
    page: data,
    isLoading,
    isError: error
  };
}

/**
 * Custom hook to fetch all pages
 */
export function usePages({ limit = 10 } = {}) {
  const apiUrl = `/api/strapi/pages?limit=${limit}`;
  
  const { data, error, isLoading } = useSWR<StrapiResponse<StrapiData<Page>>>(
    apiUrl,
    fetcher
  );
  
  return {
    pages: data?.data || [],
    pagination: data?.meta.pagination,
    isLoading,
    isError: error
  };
}

/**
 * Generic hook for fetching any content type
 */
export function useContent<T>(path: string, params: Record<string, string> = {}) {
  // Build the query string from params
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  const apiUrl = `/api/strapi${path}${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<T>(apiUrl, fetcher);
  
  return {
    data,
    isLoading,
    isError: error,
    refresh: mutate
  };
}