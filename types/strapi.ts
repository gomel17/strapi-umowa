/**
 * Base Strapi API response type
 */
export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Single item response type
 */
export interface StrapiSingleResponse<T> {
  data: StrapiData<T>;
  meta: Record<string, any>;
}

/**
 * Structure of a single Strapi data item
 */
export interface StrapiData<T> {
  id: number;
  attributes: T & {
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

/**
 * Common media type for images and files
 */
export interface StrapiMedia {
  data: {
    id: number;
    attributes: {
      name: string;
      alternativeText: string | null;
      caption: string | null;
      width: number | null;
      height: number | null;
      formats: Record<string, any> | null;
      hash: string;
      ext: string;
      mime: string;
      size: number;
      url: string;
      previewUrl: string | null;
      provider: string;
      createdAt: string;
      updatedAt: string;
    };
  } | null;
}

/**
 * Example content type - customize based on your Strapi schema
 */
export interface Page {
  title: string;
  slug: string;
  content?: string;
  description?: string;
  image?: StrapiMedia;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: StrapiMedia;
  };
}

/**
 * Add more content type interfaces as needed
 */