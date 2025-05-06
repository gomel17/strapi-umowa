# Authentication

This guide covers how to use the authentication utilities in `lib/auth.ts` to implement user registration, login, and protected content features with Strapi.

## Overview

The authentication module provides utilities for:

- User registration
- User login
- Fetching user profiles
- Managing authentication state

## Authentication Functions

### `login`

Authenticates a user with their credentials and returns a JWT token and user object.

```typescript
async function login(identifier: string, password: string): Promise<{
  jwt: string;
  user: User;
}>
```

#### Example

```typescript
import { login } from '@/lib/auth';

async function handleLogin(email: string, password: string) {
  try {
    const { jwt, user } = await login(email, password);
    
    // Store the token in localStorage or a secure cookie
    localStorage.setItem('auth_token', jwt);
    
    // Store user info or dispatch to state management
    console.log('Logged in user:', user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: error.message };
  }
}
```

### `register`

Registers a new user with Strapi and returns a JWT token and user object.

```typescript
async function register(
  username: string, 
  email: string, 
  password: string
): Promise<{
  jwt: string;
  user: User;
}>
```

#### Example

```typescript
import { register } from '@/lib/auth';

async function handleRegistration(username: string, email: string, password: string) {
  try {
    const { jwt, user } = await register(username, email, password);
    
    // Store the token and proceed with onboarding
    localStorage.setItem('auth_token', jwt);
    
    return { success: true, user };
  } catch (error) {
    console.error('Registration failed:', error);
    return { success: false, error: error.message };
  }
}
```

### `getCurrentUser`

Fetches the current user's profile using a JWT token.

```typescript
async function getCurrentUser(token: string): Promise<User>
```

#### Example

```typescript
import { getCurrentUser } from '@/lib/auth';

async function fetchUserProfile() {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const user = await getCurrentUser(token);
    return user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    // Handle token expiration or other errors
    if (error.statusCode === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login page
    }
    throw error;
  }
}
```

## Implementing Authentication in Next.js

### Context Provider for Auth State

To manage authentication state across your application, implement an Auth Context:

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, getCurrentUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token and load user on initial render
    async function loadUserFromToken() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    }

    loadUserFromToken();
  }, []);

  // Login function
  const loginUser = async (email: string, password: string) => {
    // Implementation using the login function
    // ...
  };

  // Logout function
  const logoutUser = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  // Register function
  const registerUser = async (username: string, email: string, password: string) => {
    // Implementation using the register function
    // ...
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login: loginUser,
        logout: logoutUser,
        register: registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Protected Route Component

Create a wrapper component to protect routes that require authentication:

```tsx
// components/ProtectedRoute.tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : null;
}
```

### Login Form Example

```tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      // Redirect or show success message
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Error Handling

The authentication module includes a custom `AuthError` class for improved error handling:

```typescript
class AuthError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
```

Use it to handle different types of authentication errors:

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.statusCode) {
      case 400:
        // Handle validation errors
        console.error('Validation error:', error.message);
        break;
      case 401:
        // Handle invalid credentials
        console.error('Authentication failed:', error.message);
        break;
      case 429:
        // Handle rate limiting
        console.error('Too many attempts:', error.message);
        break;
      default:
        console.error(`Error (${error.statusCode}):`, error.message);
    }
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### JWT Token Security

- Store tokens in memory (variable) for short-lived sessions
- For persistent sessions, use `localStorage` or secure cookies
- Implement token refresh logic for longer sessions
- Add token expiration checks

### User Roles and Permissions

Strapi provides role-based access control. Check user roles to authorize actions:

```typescript
function canEditContent(user) {
  if (!user) return false;
  
  // Check for specific role
  if (user.role?.type === 'editor' || user.role?.type === 'admin') {
    return true;
  }
  
  return false;
}
```

## Next Steps

- Implement [preview mode](./preview-mode.md) for content editors
- Learn about [content types](./content-types.md) and permissions
- Explore [performance optimization](./performance.md) techniques