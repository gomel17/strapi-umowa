# Performance Optimization

This guide provides strategies and best practices for optimizing performance when working with Strapi and Next.js integration.

## Caching Strategies

### TTL-Based Caching

Our integration includes a TTL (Time-To-Live) based caching mechanism that can significantly reduce API calls and improve response times:

```tsx
import { getCachedData } from '@/lib/cache';

// In your data fetching function
export async function getOptimizedData(key: string) {
  // Try to get data from cache first with a 5-minute TTL
  return getCachedData(key, () => fetchFromStrapi(key), 300);
}
```

### Recommended Cache Durations

| Content Type | Cache Duration | Use Case |
|--------------|----------------|----------|
| Static pages | 1-24 hours | Content that rarely changes |
| Dynamic listings | 5-15 minutes | Content that updates periodically |
| User-specific data | No cache / 1 minute | Personalized content |
| Configuration data | 1 hour | Global site settings |

## Data Fetching Best Practices

### Optimize Query Parameters

Always specify exactly what fields and relationships you need to fetch:

```tsx
// Bad: Fetches all fields and relationships
fetchAPI('/articles', {
  populate: '*'
});

// Good: Only fetches what's needed
fetchAPI('/articles', {
  fields: ['title', 'slug', 'summary'],
  populate: {
    featuredImage: {
      fields: ['url', 'alt', 'width', 'height']
    },
    category: {
      fields: ['name', 'slug']
    }
  }
});
```

### Pagination Optimization

When working with large datasets, implement proper pagination:

```tsx
// Fetch paginated data efficiently
export async function getPaginatedArticles(page = 1, pageSize = 10) {
  return fetchAPI('/articles', {
    pagination: { page, pageSize },
    fields: ['title', 'slug', 'publishedAt'],
    sort: ['publishedAt:desc']
  });
}
```

### Parallel Data Fetching

Use `Promise.all` for parallel data fetching when multiple independent resources are needed:

```tsx
export async function getPageWithRelatedData(slug: string) {
  const [page, relatedArticles, globalSettings] = await Promise.all([
    getPageBySlug(slug),
    getRelatedArticles(slug),
    getGlobalSettings()
  ]);

  return { page, relatedArticles, globalSettings };
}
```

## Next.js Specific Optimizations

### Incremental Static Regeneration (ISR)

Use ISR to balance between static generation and dynamic fetching:

```tsx
// In getStaticProps
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const page = await getPageBySlug(slug);
  
  return {
    props: { page },
    // Regenerate page at most every 60 seconds if requested
    revalidate: 60
  };
};
```

### SWR Configuration

Configure SWR for optimal client-side data fetching:

```tsx
// In _app.tsx or similar global context
import { SWRConfig } from 'swr';

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5000,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        focusThrottleInterval: 10000
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}
```

### Memoization of Components

Use React's `useMemo` and `useCallback` for expensive computations or callbacks:

```tsx
// In a component that processes Strapi data
import { useMemo } from 'react';

function ContentDisplay({ strapiData }) {
  // Memoize processed data to prevent unnecessary recalculations
  const processedContent = useMemo(() => {
    return processComplexStrapiData(strapiData);
  }, [strapiData]);

  return <div>{processedContent}</div>;
}
```

## Media Optimization

### Image Optimization

Use Next.js Image component for Strapi media:

```tsx
import Image from 'next/image';
import { getStrapiMedia } from '@/lib/strapi';

function MediaDisplay({ media }) {
  const imageUrl = getStrapiMedia(media);
  
  if (!imageUrl) return null;
  
  return (
    <Image
      src={imageUrl}
      width={media.data.attributes.width || 800}
      height={media.data.attributes.height || 600}
      alt={media.data.attributes.alt || ''}
      placeholder="blur"
      blurDataURL={media.data.attributes.placeholder || undefined}
    />
  );
}
```

### Responsive Media Loading

Configure responsive loading based on device sizes:

```tsx
// In a component that displays Strapi media
<Image
  src={getStrapiMedia(media)}
  alt={media.data.attributes.alt || ''}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isPriority} // Set true for above-the-fold images
  quality={80}
/>
```

## Monitoring and Analysis

Implement monitoring to identify performance bottlenecks:

1. Use browser performance APIs to measure loading times for critical resources
2. Monitor Strapi API response times and identify slow queries
3. Set up performance budgets for key user interactions

```tsx
// Example: Measure API fetch performance
export async function measuredFetch(key, fetchFn) {
  const start = performance.now();
  try {
    const result = await fetchFn();
    const duration = performance.now() - start;
    console.log(`[Performance] ${key} fetch took ${duration.toFixed(2)}ms`);
    
    // Could send metrics to monitoring service
    // trackPerformanceMetric(key, duration);
    
    return result;
  } catch (error) {
    console.error(`[Performance] ${key} fetch failed after ${(performance.now() - start).toFixed(2)}ms`);
    throw error;
  }
}
```

By following these optimization strategies, you'll ensure that your Strapi-powered Next.js application delivers excellent performance and user experience.