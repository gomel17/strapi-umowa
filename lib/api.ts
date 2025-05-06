import { fetchAPI } from './strapi';
import { Page, StrapiData, StrapiResponse, StrapiSingleResponse } from '../types/strapi';

/**
 * Fetches a single page by slug
 * 
 * @param {string} slug - The unique slug identifier for the page
 * @returns {Promise<StrapiData<Page> | null>} - The page data or null if not found
 * 
 * @example
 * ```typescript
 * // In getStaticProps
 * const page = await getPageBySlug('about-us');
 * if (!page) {
 *   return { notFound: true };
 * }
 * ```
 */
export async function getPageBySlug(slug: string) {
  const response = await fetchAPI<StrapiResponse<StrapiData<Page>>>('/pages', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: '*',
  });
  
  return response.data[0] || null;
}

/**
 * Fetches all pages with pagination, sorting, and population options
 * 
 * @param {Object} options - Query options
 * @param {string|string[]} options.populate - Relations to populate ('*' for all)
 * @param {Object} options.pagination - Pagination settings
 * @param {number} options.pagination.page - Page number (1-based)
 * @param {number} options.pagination.pageSize - Number of items per page
 * @param {string[]} options.sort - Sorting criteria (e.g., ['publishedAt:desc'])
 * @returns {Promise<StrapiResponse<StrapiData<Page>>>} - Paginated response with pages data
 * 
 * @example
 * ```typescript
 * // Get first page of most recently published pages
 * const pagesResponse = await getAllPages({
 *   pagination: { page: 1, pageSize: 10 },
 *   sort: ['publishedAt:desc']
 * });
 * 
 * console.log(`Total pages: ${pagesResponse.meta.pagination.total}`);
 * ```
 */
export async function getAllPages({
  populate = '*',
  pagination = { page: 1, pageSize: 100 },
  sort = ['publishedAt:desc'],
} = {}) {
  const response = await fetchAPI<StrapiResponse<StrapiData<Page>>>('/pages', {
    populate,
    pagination,
    sort,
  });
  
  return response;
}

/**
 * Gets page paths for static generation with Next.js
 * 
 * @returns {Promise<Array<{params: {slug: string}}>>} - Array of path objects for getStaticPaths
 * 
 * @example
 * ```typescript
 * // In getStaticPaths
 * export const getStaticPaths: GetStaticPaths = async () => {
 *   const paths = await getPagePaths();
 *   return {
 *     paths,
 *     fallback: 'blocking'
 *   };
 * }
 * ```
 */
export async function getPagePaths() {
  const pagesResponse = await fetchAPI<StrapiResponse<StrapiData<Page>>>('/pages', {
    fields: ['slug'],
    pagination: { page: 1, pageSize: 100 },
  });

  return pagesResponse.data.map((page) => ({
    params: { slug: page.attributes.slug },
  }));
}

/**
 * Add other content type API helpers as you create them in Strapi
 */