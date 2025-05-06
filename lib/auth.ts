import axios from 'axios';
import { getStrapiURL } from './strapi';

/**
 * Authentication error class
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * User type from Strapi
 */
export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: number;
    name: string;
    description: string;
    type: string;
  }
}

/**
 * Login response from Strapi
 */
interface LoginResponse {
  jwt: string;
  user: User;
}

/**
 * Login to Strapi with credentials
 */
export async function login(identifier: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post(
      `${getStrapiURL()}/api/auth/local`,
      {
        identifier,
        password,
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new AuthError(
        error.response.data?.error?.message || 'Authentication failed',
        error.response.status
      );
    }
    throw new AuthError('Authentication request failed');
  }
}

/**
 * Register a new user
 */
export async function register(
  username: string, 
  email: string, 
  password: string
): Promise<LoginResponse> {
  try {
    const response = await axios.post(
      `${getStrapiURL()}/api/auth/local/register`,
      {
        username,
        email,
        password,
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new AuthError(
        error.response.data?.error?.message || 'Registration failed',
        error.response.status
      );
    }
    throw new AuthError('Registration request failed');
  }
}

/**
 * Fetch the current user profile using a JWT token
 */
export async function getCurrentUser(token: string): Promise<User> {
  try {
    const response = await axios.get(
      `${getStrapiURL()}/api/users/me?populate=role`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new AuthError(
        error.response.data?.error?.message || 'Failed to retrieve user profile',
        error.response.status
      );
    }
    throw new AuthError('User profile request failed');
  }
}