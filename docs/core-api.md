# Core API Utilities

This document explains how to use the core API utilities in the Strapi integration.

## Base Utilities in `strapi.ts`

The `lib/strapi.ts` file contains the foundational API utilities that power all data fetching from your Strapi backend.

### `fetchAPI`

The primary function for making API requests to Strapi.

```typescript
fetchAPI<T>(
  path: string, 
  urlParamsObject = {}, 
  options = {}, 
  preview = false
): Promise<T>
```

#### Parameters

- `path`: The API endpoint path (without `/api` prefix)
- `urlParamsObject`: Query parameters for filtering, pagination, etc.
- `options`: Additional axios request options
- `preview`: Whether to fetch draft content

#### Example

```typescript
import { fetchAPI } from '@/lib/strapi';
import { StrapiResponse, Page } from '@/types/strapi';

// Basic usage
const response = await fetchAPI<StrapiResponse<Page>>('/pages');

// With filters
const filteredResponse = await fetchAPI<StrapiResponse<Page>>('/pages', {
  filters: {
    slug: {
      $eq: 'home'
    }
  },
  populate: '*' // Include all relations
});

// With pagination
const paginatedResponse = await fetchAPI<StrapiResponse<Page>>('/pages', {
  pagination: {
    page: 1,
    pageSize: 10
  },
  sort: ['publishedAt:desc']
});

// Fetching draft content (preview mode)
const draftResponse = await fetchAPI<StrapiResponse<Page>>(
  '/pages',
  { populate: '*' },
  {},
  true // Set preview to true
);
```

### `getStrapiURL`

Utility function to build the full Strapi API URL.

```typescript
getStrapiURL(path = ''): string
```

#### Example

```typescript
import { getStrapiURL } from '@/lib/strapi';

// Get base Strapi URL
const baseUrl = getStrapiURL(); // e.g., "http://localhost:1337"

// Get specific endpoint URL
const pagesUrl = getStrapiURL('/api/pages'); // e.g., "http://localhost:1337/api/pages"
```

### `getStrapiMedia`

Helper for getting the full URL for Strapi media assets.

```typescript
getStrapiMedia(media?: StrapiMedia | null): string | null
```

#### Example

```typescript
import { getStrapiMedia } from '@/lib/strapi';

// In a component
function ImageComponent({ image }) {
  const imageUrl = getStrapiMedia(image);
  
  if (!imageUrl) {
    return <div>No image available</div>;
  }
  
  return <img src={imageUrl} alt={image.data.attributes.alternativeText || ''} />;
}
```

## Error Handling

The integration includes a custom error class `StrapiApiError` that provides better context for API errors.

### `StrapiApiError`

```typescript
class StrapiApiError extends Error {
  statusCode: number;
  details: any;
}
```

#### Example: Handling API Errors

```typescript
import { fetchAPI, StrapiApiError } from '@/lib/strapi';

async function fetchData() {
  try {
    const data = await fetchAPI('/pages');
    return data;
  } catch (error) {
    if (error instanceof StrapiApiError) {
      console.error(`API Error ${error.statusCode}: ${error.message}`);
      
      // Handle specific error codes
      if (error.statusCode === 404) {
        // Handle not found
      } else if (error.statusCode === 403) {
        // Handle forbidden
      }
      
      // Access additional error details
      console.error('Details:', error.details);
    } else {
      console.error('Unknown error:', error);
    }
    
    throw error;
  }
}
```

## Best Practices

### Typing Your Responses

Always specify the expected response type when calling `fetchAPI` for type safety:

```typescript
import { fetchAPI } from '@/lib/strapi';
import { StrapiResponse, StrapiData, Article } from '@/types/strapi';

// Properly typed response
const articlesResponse = await fetchAPI<StrapiResponse<StrapiData<Article>>>('/articles', { 
  populate: 'author,category,image' 
});
```

### Handling Rate Limiting

Strapi may implement rate limiting. Handle potential 429 errors:

```typescript
try {
  const data = await fetchAPI('/resources');
  return data;
} catch (error) {
  if (error instanceof StrapiApiError && error.statusCode === 429) {
    console.log('Rate limited, retrying after delay');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchAPI('/resources');
  }
  throw error;
}
```

### Minimize Data Transfer

When fetching large collections, use the `fields` parameter to select only needed fields:

```typescript
// Good: Only fetch needed fields
const articlesResponse = await fetchAPI('/articles', {
  fields: ['title', 'slug', 'publishedAt'],
  pagination: { page: 1, pageSize: 10 }
});

// Bad: Fetching everything including potentially large fields
const articlesResponse = await fetchAPI('/articles', {
  populate: '*'
});
```

## Next Steps

- Learn about [working with specific content types](./content-types.md)
- Explore [caching strategies](./performance.md) for better performance
- Understand [authentication](./authentication.md) for protected content