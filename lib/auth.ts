import axios from 'axios';
import { getStrapiURL } from './strapi';

/**
 * Authentication error class for handling Strapi authentication errors
 * 
 * @class AuthError
 * @extends Error
 * @property {number} statusCode - HTTP status code of the auth error
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
 * 
 * @interface User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - User's email address
 * @property {string} provider - Authentication provider (e.g., 'local', 'github')
 * @property {boolean} confirmed - Whether the user's email is confirmed
 * @property {boolean} blocked - Whether the user is blocked
 * @property {string} createdAt - ISO timestamp of user creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {Object} [role] - User role information
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
 * 
 * @interface LoginResponse
 * @property {string} jwt - JSON Web Token for authenticated requests
 * @property {User} user - User profile information
 */
interface LoginResponse {
  jwt: string;
  user: User;
}

/**
 * Login to Strapi with credentials
 * 
 * @param {string} identifier - Username or email to login with
 * @param {string} password - User password
 * @returns {Promise<LoginResponse>} - JWT token and user object
 * @throws {AuthError} - If authentication fails
 * 
 * @example
 * ```typescript
 * // In a login form handler
 * try {
 *   const { jwt, user } = await login(email, password);
 *   
 *   // Save token in localStorage or secure cookie
 *   localStorage.setItem('token', jwt);
 *   
 *   // Save user data in state or context
 *   setUser(user);
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     setError(error.message);
 *   } else {
 *     setError('An unexpected error occurred');
 *   }
 * }
 * ```
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
 * Register a new user in Strapi
 * 
 * @param {string} username - Desired username
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<LoginResponse>} - JWT token and user object
 * @throws {AuthError} - If registration fails
 * 
 * @example
 * ```typescript
 * // In a registration form handler
 * try {
 *   const { jwt, user } = await register(username, email, password);
 *   
 *   // Save token in localStorage or secure cookie
 *   localStorage.setItem('token', jwt);
 *   
 *   // Show success message and redirect
 *   showNotification('Registration successful!');
 *   router.push('/profile');
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     // Handle specific error cases
 *     if (error.message.includes('email')) {
 *       setEmailError(error.message);
 *     } else {
 *       setError(error.message);
 *     }
 *   } else {
 *     setError('An unexpected error occurred');
 *   }
 * }
 * ```
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
 * 
 * @param {string} token - JWT token from login/registration
 * @returns {Promise<User>} - User profile data
 * @throws {AuthError} - If fetching the profile fails or token is invalid
 * 
 * @example
 * ```typescript
 * // In a profile page or protected route
 * useEffect(() => {
 *   async function fetchUserProfile() {
 *     try {
 *       const token = localStorage.getItem('token');
 *       if (!token) {
 *         router.push('/login');
 *         return;
 *       }
 *       
 *       const user = await getCurrentUser(token);
 *       setUserProfile(user);
 *     } catch (error) {
 *       // Token might be expired
 *       localStorage.removeItem('token');
 *       router.push('/login');
 *     }
 *   }
 *   
 *   fetchUserProfile();
 * }, []);
 * ```
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