'use client';

import useSWR from 'swr';
import { StrapiData, StrapiResponse, StrapiSingleResponse, Page } from '@/types/strapi';

/**
 * Base fetcher function that will be used by SWR
 * 
 * @param {string} url - The URL to fetch data from
 * @returns {Promise<any>} - The parsed JSON data
 * @throws {Error} - If the fetch request fails
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
 * 
 * @param {string} slug - The slug of the page to fetch
 * @returns {Object} - Hook return values
 * @returns {StrapiData<Page> | undefined} - The fetched page data
 * @returns {boolean} isLoading - Whether the request is in progress
 * @returns {Error | undefined} isError - Error object if the request failed
 * 
 * @example
 * ```tsx
 * function PageComponent() {
 *   const { page, isLoading, isError } = usePage('about-us');
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (isError) return <div>Error loading page</div>;
 *   if (!page) return <div>Page not found</div>;
 *   
 *   return (
 *     <div>
 *       <h1>{page.attributes.title}</h1>
 *       <div dangerouslySetInnerHTML={{ __html: page.attributes.content }} />
 *     </div>
 *   );
 * }
 * ```
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
 * Custom hook to fetch multiple pages with pagination
 * 
 * @param {Object} options - Hook options
 * @param {number} [options.limit=10] - Maximum number of pages to fetch
 * @returns {Object} - Hook return values
 * @returns {Array<StrapiData<Page>>} pages - Array of page data
 * @returns {Object | undefined} pagination - Pagination metadata
 * @returns {boolean} isLoading - Whether the request is in progress
 * @returns {Error | undefined} isError - Error object if the request failed
 * 
 * @example
 * ```tsx
 * function PageList() {
 *   const { pages, pagination, isLoading, isError } = usePages({ limit: 20 });
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (isError) return <div>Error loading pages</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Pages</h1>
 *       <ul>
 *         {pages.map(page => (
 *           <li key={page.id}>
 *             <Link href={`/pages/${page.attributes.slug}`}>
 *               {page.attributes.title}
 *             </Link>
 *           </li>
 *         ))}
 *       </ul>
 *       <div>
 *         Showing {pagination?.pageSize} of {pagination?.total} pages
 *       </div>
 *     </div>
 *   );
 * }
 * ```
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
 * Generic hook for fetching any content type from Strapi
 * 
 * @template T - The expected return type from the API
 * @param {string} path - API path segment (e.g., '/articles')
 * @param {Record<string, string>} params - Query parameters to include
 * @returns {Object} - Hook return values
 * @returns {T | undefined} data - The fetched data
 * @returns {boolean} isLoading - Whether the request is in progress
 * @returns {Error | undefined} isError - Error object if the request failed
 * @returns {Function} refresh - Function to manually refresh the data
 * 
 * @example
 * ```tsx
 * // Fetch a list of articles with a specific tag
 * function TaggedArticles({ tag }) {
 *   const { data, isLoading, isError, refresh } = useContent<StrapiResponse<StrapiData<Article>>>(
 *     '/articles',
 *     { tags: tag, limit: '10', sort: 'publishedAt:desc' }
 *   );
 *   
 *   // Add a refresh button
 *   return (
 *     <div>
 *       <button onClick={() => refresh()}>Refresh</button>
 *       
 *       {isLoading ? (
 *         <div>Loading articles...</div>
 *       ) : isError ? (
 *         <div>Error loading articles</div>
 *       ) : (
 *         <ArticleList articles={data?.data || []} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
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