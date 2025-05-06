# Strapi Integration Documentation

This documentation provides comprehensive information about the Strapi integration for your Next.js project. Here you'll find guides on how to use the various utilities, best practices, and examples.

## Table of Contents

- [Getting Started](./getting-started.md)
  - Installation
  - Configuration
  - Environment variables

- [Core API](./core-api.md)
  - Base API utilities
  - Error handling
  - Fetching data

- [Content Types](./content-types.md)
  - Working with Pages
  - Custom content types
  - Media handling

- [Authentication](./authentication.md)
  - User login/registration
  - Protecting routes
  - Managing user profiles

- [Client-side Data Fetching](./client-side-fetching.md)
  - Using SWR hooks
  - Caching strategies
  - Revalidation

- [Preview Mode](./preview-mode.md)
  - Setting up preview
  - Viewing draft content

- [Performance Optimization](./performance.md)
  - Caching strategies
  - Data fetching best practices

- [Advanced Usage](./advanced-usage.md)
  - Custom hooks
  - Extending the API
  - TypeScript integration

## Quick Start

To use the Strapi integration in your Next.js project, make sure your environment variables are properly set:

```env
# .env.local
NEXT_PUBLIC_STRAPI_API_URL=http://your-strapi-instance.com
STRAPI_API_TOKEN=your-api-token
```

To fetch data from Strapi in a page component:

```tsx
// In a page component
import { getPageBySlug, getAllPages } from '@/lib/api';
import { GetStaticProps, GetStaticPaths } from 'next';

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await getPagePaths();
  return {
    paths,
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const page = await getPageBySlug(slug);
  
  if (!page) {
    return {
      notFound: true
    };
  }
  
  return {
    props: {
      page
    },
    revalidate: 60 // Re-generate page every 60 seconds if requested
  };
};
```

For client-side data fetching:

```tsx
// In a React component
import { usePage } from '@/hooks/useStrapi';

export default function PageComponent({ slug }) {
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

For more detailed documentation, explore the individual sections linked in the Table of Contents.