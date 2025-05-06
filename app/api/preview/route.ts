import { validateEnv } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
}

/**
 * Preview mode handler for Strapi drafts
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');
  const secret = searchParams.get('secret');

  // Check the secret and next parameters
  if (secret !== process.env.PREVIEW_SECRET || !slug) {
    return NextResponse.json(
      { 
        error: 'Invalid token or missing slug' 
      },
      { 
        status: 401,
        statusText: 'Unauthorized'
      }
    );
  }

  // Enable Preview Mode by setting the cookies
  const response = NextResponse.redirect(new URL(`/${slug}`, request.url));
  
  // Set preview mode cookie
  response.cookies.set({
    name: '__preview_mode',
    value: 'true',
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 60, // 1 hour
  });
  
  return response;
}