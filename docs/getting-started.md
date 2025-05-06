# Getting Started with Strapi Integration

This guide will help you set up and configure the Strapi integration for your Next.js project.

## Prerequisites

- A running Strapi instance (either locally or deployed)
- A Next.js project
- API token from your Strapi admin panel

## Installation

The Strapi integration is already included in your project, but if you're adding it to a new project, you would need to set up the following dependencies:

```bash
# Install required packages
npm install axios swr
```

## Configuration

### Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Strapi API URL (no trailing slash)
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337

# Strapi API Token (generated in Strapi Admin Panel)
STRAPI_API_TOKEN=your-strapi-api-token
```

> **Note:** The `NEXT_PUBLIC_` prefix makes the variable available in both client and server-side code, while the `STRAPI_API_TOKEN` is only available server-side for security.

### Getting a Strapi API Token

1. Log in to your Strapi Admin Panel
2. Navigate to Settings > API Tokens
3. Click "Create new API Token"
4. Fill in:
   - Name: `Next.js App`
   - Description: `Token for Next.js frontend`
   - Token duration: `Unlimited` (or set an expiry)
   - Token type: `Read-only` (or as needed)
5. Select the permissions needed for your application
6. Click "Save" and copy the generated token

## Folder Structure

The Strapi integration is organized into the following structure:

```
lib/
├── api.ts              # Content-specific API helpers
├── auth.ts             # Authentication utilities
├── cache.ts            # Caching system
├── env.ts              # Environment validation
└── strapi.ts           # Core API utilities

types/
└── strapi.ts           # TypeScript interfaces for Strapi data

hooks/
└── useStrapi.ts        # Client-side data fetching hooks
```

## Validating Your Setup

To ensure your integration is working correctly, create a simple test page:

```tsx
// pages/strapi-test.tsx
import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/strapi';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function testConnection() {
      try {
        // Try to fetch something simple from Strapi
        await fetchAPI('/pages', { pagination: { limit: 1 } });
        setStatus('success');
        setMessage('Successfully connected to Strapi!');
      } catch (error: any) {
        setStatus('error');
        setMessage(`Error connecting to Strapi: ${error.message}`);
        console.error(error);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Strapi Connection Test</h1>
      
      {status === 'loading' && <p>Testing connection to Strapi...</p>}
      
      {status === 'success' && (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
```

Visit this page in your browser to verify that your Strapi connection is working.

## Next Steps

Now that you've set up the integration, you can start:

1. [Working with content types](./content-types.md)
2. [Fetching data using the core API](./core-api.md)
3. [Setting up authentication](./authentication.md)
4. [Using client-side data fetching hooks](./client-side-fetching.md)