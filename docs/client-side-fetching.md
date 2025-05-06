# Client-side Data Fetching

This guide explains how to use the client-side data fetching hooks provided in `hooks/useStrapi.ts` to efficiently fetch data from your Strapi backend.

## Overview

The client-side hooks are built on top of [SWR](https://swr.vercel.app/) (Stale-While-Revalidate), a React Hooks library for data fetching that features:

- Automatic revalidation
- Built-in caching
- Error handling
- Reusable data across components

## Available Hooks

### `usePage`

Fetches a single page by slug.

```typescript
function usePage(slug: string): {
  page: StrapiData<Page> | undefined;
  isLoading: boolean;
  isError: Error | undefined;
}
```

#### Example

```tsx
import { usePage } from '@/hooks/useStrapi';

function PageContent({ slug }) {
  const { page, isLoading, isError } = usePage(slug);
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading page</div>;
  if (!page) return <div>Page not found</div>;
  
  return (
    <article>
      <h1>{page.attributes.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.attributes.content }} />
    </article>
  );
}
```

### `usePages`

Fetches a collection of pages with pagination.

```typescript
function usePages({ limit = 10 } = {}): {
  pages: StrapiData<Page>[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | undefined;
  isLoading: boolean;
  isError: Error | undefined;
}
```

#### Example

```tsx
import { usePages } from '@/hooks/useStrapi';

function PageList() {
  const { pages, pagination, isLoading, isError } = usePages({ limit: 5 });
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading pages</div>;
  
  return (
    <div>
      <h1>Pages</h1>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            <a href={`/pages/${page.attributes.slug}`}>
              {page.attributes.title}
            </a>
          </li>
        ))}
      </ul>
      
      {pagination && (
        <div>
          Showing {pages.length} of {pagination.total} pages
        </div>
      )}
    </div>
  );
}
```

### `useContent`

Generic hook for fetching any content type.

```typescript
function useContent<T>(path: string, params: Record<string, string> = {}): {
  data: T | undefined;
  isLoading: boolean;
  isError: Error | undefined;
  refresh: () => Promise<void>;
}
```

#### Example

```tsx
import { useContent } from '@/hooks/useStrapi';
import { StrapiResponse, StrapiData } from '@/types/strapi';

// Define your custom content type
interface Article {
  title: string;
  content: string;
  publishedAt: string;
  author: {
    data: {
      id: number;
      attributes: {
        name: string;
      }
    }
  }
}

function ArticleList() {
  // Type your response for type safety
  const { data, isLoading, isError, refresh } = useContent<StrapiResponse<StrapiData<Article>>>(
    '/articles',
    {
      populate: 'author',
      sort: 'publishedAt:desc',
      'pagination[limit]': '10'
    }
  );
  
  if (isLoading) return <div>Loading articles...</div>;
  if (isError) return <div>Error loading articles</div>;
  
  return (
    <div>
      <h1>Latest Articles</h1>
      <button onClick={() => refresh()}>Refresh</button>
      
      <ul>
        {data?.data.map((article) => (
          <li key={article.id}>
            <h2>{article.attributes.title}</h2>
            <p>By: {article.attributes.author.data.attributes.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Usage

### Conditional Fetching

To fetch data conditionally, you can pass `null` instead of a path:

```tsx
// Will not fetch if slug is empty
const { page } = usePage(slug || null);
```

### Custom API Routes

The hooks use API routes under the hood. Make sure to implement the corresponding API routes in your Next.js app:

```typescript
// app/api/strapi/pages/[slug]/route.ts
import { NextResponse } from 'next/server';
import { getPageBySlug } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const page = await getPageBySlug(slug);
  
  if (!page) {
    return NextResponse.json(
      { error: 'Page not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(page);
}
```

### Error Handling

You can implement more detailed error handling:

```tsx
function ArticleDetail({ slug }) {
  const { data, isLoading, isError } = useContent(`/articles/${slug}`);
  
  if (isLoading) {
    return <div>Loading article...</div>;
  }
  
  if (isError) {
    return (
      <div className="error-container">
        <h2>Error Loading Article</h2>
        <p>
          We couldn't load the article you requested. 
          Please try refreshing the page.
        </p>
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    );
  }
  
  if (!data || !data.data) {
    return <div>Article not found</div>;
  }
  
  // Render article
}
```

### Reusing Data Between Components

One of SWR's benefits is that it deduplicates requests with the same key, allowing you to use the same data across multiple components without additional network requests:

```tsx
// Component 1
function Header() {
  const { data } = useContent('/global/header');
  // ...
}

// Component 2 - no additional network request is made
function Footer() {
  const { data } = useContent('/global/header');
  // ...
}
```

## Performance Considerations

### Automatic Revalidation

By default, the hooks will revalidate data when:

1. The user focuses the window
2. The network reconnects
3. The component remounts

To customize this behavior, you can create a custom SWR configuration:

```tsx
// _app.tsx or a wrapper component
import { SWRConfig } from 'swr';

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig 
      value={{
        refreshInterval: 0, // Disable automatic polling
        revalidateOnFocus: false, // Disable auto revalidation on focus
        dedupingInterval: 5000, // Dedupe requests for 5 seconds
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}
```

## Next Steps

- Learn about [authentication](./authentication.md) for protected content
- Explore [preview mode](./preview-mode.md) for viewing draft content
- Review [performance optimization](./performance.md) techniques