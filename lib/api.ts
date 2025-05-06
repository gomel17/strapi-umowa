import { fetchAPI } from './strapi';
import { Page, StrapiData, StrapiResponse, StrapiSingleResponse } from '../types/strapi';

/**
 * Fetches a single page by slug
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
 * Fetches all pages
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
 * Gets page paths for static generation
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