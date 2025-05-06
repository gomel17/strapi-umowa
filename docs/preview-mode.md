# Preview Mode

This guide explains how to implement and use the preview mode functionality in your Next.js application to view draft content from Strapi before it's published.

## Overview

Preview mode allows content editors to see unpublished content directly from the Strapi admin panel. This is especially useful for:

- Reviewing content before publishing
- Testing layout and design with real content
- Getting stakeholder approval on content changes

## How Preview Mode Works

1. Strapi adds a "Preview" button to the content editor UI
2. When clicked, it redirects to a special API route in your Next.js app
3. This route enables preview mode and redirects to the actual content page
4. The page then fetches the draft version of the content

## Setting Up Preview Mode

### 1. Create the Preview API Route

First, let's examine the preview route implementation:

```typescript
// app/api/preview/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAPI } from '@/lib/strapi';

export async function GET(request: Request) {
  // Parse the request URL to get query parameters
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const secret = searchParams.get('secret');
  const contentType = searchParams.get('contentType') || 'page';

  // Check the secret token
  if (secret !== process.env.STRAPI_PREVIEW_SECRET) {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }

  // Check if the slug exists
  if (!slug) {
    return NextResponse.json(
      { message: 'Missing slug parameter' },
      { status: 400 }
    );
  }

  try {
    // Fetch the content to validate it exists
    // The fetchAPI function will include draft content when preview=true
    const data = await fetchAPI(
      `/${contentType}s`, 
      { filters: { slug: { $eq: slug } } },
      {}, 
      true // Enable preview mode
    );

    // If content doesn't exist, return 404
    if (!data?.data || data.data.length === 0) {
      return NextResponse.json(
        { message: `${contentType} not found` },
        { status: 404 }
      );
    }

    // Enable preview mode by setting a cookie
    cookies().set({
      name: '__next_preview_data',
      value: JSON.stringify({ slug, contentType }),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    });

    cookies().set({
      name: '__previewMode',
      value: 'true',
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    });

    // Redirect to the page
    let redirectUrl: string;

    switch (contentType) {
      case 'page':
        redirectUrl = `/${slug}`;
        break;
      case 'article':
        redirectUrl = `/articles/${slug}`;
        break;
      default:
        redirectUrl = `/${contentType}s/${slug}`;
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { message: 'Error enabling preview mode' },
      { status: 500 }
    );
  }
}
```

### 2. Update Data Fetching Logic

Modify your page components to fetch draft content when in preview mode:

```tsx
// app/[slug]/page.tsx
import { cookies } from 'next/headers';
import { getPageBySlug } from '@/lib/api';
import PageContent from '@/components/PageContent';

export default async function Page({ params }) {
  const { slug } = params;
  const cookieStore = cookies();
  const previewCookie = cookieStore.get('__previewMode');
  const isPreview = previewCookie?.value === 'true';

  // Fetch page data, passing preview flag if needed
  const page = await getPageBySlug(slug, isPreview);

  if (!page) {
    return <div>Page not found</div>;
  }

  return (
    <>
      {isPreview && (
        <div className="bg-amber-500 p-4 text-white text-center font-bold">
          Preview Mode - This is a draft version
          <button 
            className="ml-4 bg-white text-amber-500 px-4 py-1 rounded"
            onClick={() => {
              // Exit preview mode
              document.cookie = '__previewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = '__next_preview_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              window.location.reload();
            }}
          >
            Exit Preview
          </button>
        </div>
      )}
      <PageContent page={page} />
    </>
  );
}
```

### 3. Update API Helper Functions

Modify your API helpers to support preview mode:

```typescript
// lib/api.ts

/**
 * Fetches a single page by slug
 * @param slug The page slug
 * @param preview Whether to fetch draft content
 */
export async function getPageBySlug(slug: string, preview: boolean = false) {
  const response = await fetchAPI<StrapiResponse<StrapiData<Page>>>(
    '/pages',
    {
      filters: {
        slug: {
          $eq: slug,
        },
      },
      populate: '*',
    },
    {},
    preview // Pass the preview flag
  );
  
  return response.data[0] || null;
}
```

## Setting Up Strapi

### 1. Configure Preview URL in Strapi

In your Strapi admin panel:

1. Go to Settings > Content-Types Builder
2. Select your content type (e.g., Page)
3. Find the URL field or add one if it doesn't exist
4. Configure the preview URL pattern:

```
{your-next-app-url}/api/preview?secret={STRAPI_PREVIEW_SECRET}&slug={slug}&contentType=page
```

Replace `{your-next-app-url}` with your actual application URL, and `{STRAPI_PREVIEW_SECRET}` with the secret key you'll define in your environment variables.

### 2. Add Preview Secret to Environment Variables

Update your `.env.local` file with a secure random string for the preview secret:

```env
# Strapi Preview Mode Secret
STRAPI_PREVIEW_SECRET=your-secure-random-string
```

This secret prevents unauthorized access to your preview mode.

## Testing Preview Mode

1. Create a draft article or page in Strapi without publishing it
2. Click the "Preview" button in the Strapi admin panel
3. You should be redirected to your Next.js app showing the draft content

## Additional Features

### Preview Mode Banner

Add a visible banner to indicate when a user is viewing content in preview mode:

```tsx
function PreviewModeBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white py-2 px-4 text-center z-50">
      <p className="font-bold">Preview Mode Active</p>
      <button 
        className="ml-4 bg-white text-blue-600 px-2 py-1 rounded text-sm"
        onClick={() => {
          // Exit preview mode by clearing cookies
          document.cookie = '__previewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = '__next_preview_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          window.location.reload();
        }}
      >
        Exit Preview
      </button>
    </div>
  );
}
```

### Preview Links for Multiple Content Types

You can extend the preview functionality to support different content types:

```typescript
// Determine redirect URL based on content type
function getPreviewUrl(contentType: string, slug: string) {
  switch (contentType) {
    case 'page':
      return `/api/preview?contentType=page&slug=${slug}`;
    case 'article':
      return `/api/preview?contentType=article&slug=${slug}`;
    case 'product':
      return `/api/preview?contentType=product&slug=${slug}`;
    default:
      return `/api/preview?contentType=${contentType}&slug=${slug}`;
  }
}
```

## Security Considerations

### Protecting Preview Mode

Always ensure that:

1. The preview secret is strong and unique
2. The preview cookie is HTTP-only
3. The preview URL is protected against unauthorized access
4. The preview cookie has a reasonable expiration time

### Sanitizing Draft Content

Draft content might contain unfinished or potentially unsafe content. Implement proper sanitization:

```typescript
import DOMPurify from 'dompurify';

// In your component
const sanitizedContent = DOMPurify.sanitize(page.attributes.content);

// Then render it
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

## Next Steps

- Learn about [caching strategies](./performance.md) for better performance
- Explore [authentication](./authentication.md) for protected content
- Understand [content types](./content-types.md) and how to work with them