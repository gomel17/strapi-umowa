import axios, { AxiosError } from 'axios';
import { StrapiData, StrapiMedia, StrapiResponse, StrapiSingleResponse } from '../types/strapi';

/**
 * API error class for specific handling of Strapi errors
 * 
 * @class StrapiApiError
 * @extends Error
 * @property {number} statusCode - HTTP status code of the error
 * @property {any} details - Additional error details from Strapi response
 */
export class StrapiApiError extends Error {
  statusCode: number;
  details: any;

  constructor(message: string, statusCode: number = 500, details: any = null) {
    super(message);
    this.name = 'StrapiApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Returns the URL to the Strapi API
 * 
 * @param {string} path - Path to append to the base URL
 * @returns {string} Complete Strapi API URL
 */
export function getStrapiURL(path = '') {
  return `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}${path}`;
}

/**
 * Helper to make GET requests to Strapi API endpoints
 * 
 * @template T - The expected return type of the API response
 * @param {string} path - Path of the API route (e.g., '/articles')
 * @param {Object} urlParamsObject - URL parameters for filtering, pagination, etc.
 * @param {Object} options - Additional options for axios request
 * @param {boolean} preview - Whether to fetch draft content
 * @returns {Promise<T>} - Promise resolving to the API response data
 * @throws {StrapiApiError} - Throws enhanced error with status code and details
 * 
 * @example
 * ```typescript
 * // Fetch published articles
 * const articles = await fetchAPI('/articles', { 
 *   sort: ['publishedAt:desc'],
 *   pagination: { page: 1, pageSize: 10 }
 * });
 * 
 * // Fetch draft content in preview mode
 * const draft = await fetchAPI('/articles', { 
 *   filters: { slug: 'my-article' }
 * }, {}, true);
 * ```
 */
export const fetchAPI = async <T = any>(
  path: string,
  urlParamsObject = {},
  options = {},
  preview = false
): Promise<T> => {
  try {
    // Merge default and user options
    const mergedOptions = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN || ''}`,
      },
      ...options,
    };

    // Define API params
    const queryParams = {
      ...urlParamsObject,
      // Add publicationState param if preview is set
      ...(preview ? { publicationState: 'preview' } : {}),
    };

    // Build request URL
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
      
    const requestUrl = `${getStrapiURL()}/api${path}${queryString ? `?${queryString}` : ''}`;

    // Log the request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Strapi] Fetching: ${requestUrl}${preview ? ' (preview)' : ''}`);
    }

    // Trigger API call
    const response = await axios.get(requestUrl, mergedOptions);
    
    // Handle response
    return response.data;
  } catch (error) {
    // Enhanced error handling
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const statusCode = axiosError.response.status;
      const message = `Strapi API error: ${axiosError.response.statusText || 'Unknown error'}`;
      const details = axiosError.response.data;
      
      console.error(`[Strapi] API Error ${statusCode}: ${message}`, details);
      throw new StrapiApiError(message, statusCode, details);
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error('[Strapi] Network Error: No response received', axiosError.request);
      throw new StrapiApiError('Network error: No response from Strapi API', 0);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[Strapi] Request Error:', error);
      throw new StrapiApiError('Error setting up API request');
    }
  }
};

/**
 * Get full URL for Strapi media
 * 
 * @param {StrapiMedia | null | undefined} media - The media object from Strapi
 * @returns {string | null} - Complete URL for the media or null if not available
 * 
 * @example
 * ```typescript
 * // In a component
 * const imageUrl = getStrapiMedia(page.attributes.image);
 * if (imageUrl) {
 *   // Use the image URL
 * }
 * ```
 */
export const getStrapiMedia = (media?: StrapiMedia | null): string | null => {
  if (!media || !media.data) return null;
  
  const { url } = media.data.attributes;
  return url.startsWith('/') ? `${getStrapiURL()}${url}` : url;
};
