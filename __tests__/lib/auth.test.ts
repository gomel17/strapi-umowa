import { login, register, getCurrentUser, AuthError } from '../../lib/auth';
import { mockAuthResponse, mockUser } from '../mocks/strapiData';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in user with valid credentials', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await login('test@example.com', 'password123');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1337/api/auth/local',
        {
          identifier: 'test@example.com',
          password: 'password123',
        }
      );
      
      expect(result).toEqual(mockAuthResponse);
    });

    it('throws AuthError on authentication failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid identifier or password',
            }
          }
        }
      });

      await expect(login('wrong@example.com', 'wrongpass')).rejects.toThrow(AuthError);
      await expect(login('wrong@example.com', 'wrongpass')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid identifier or password',
      });
    });

    it('handles network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(login('test@example.com', 'password123')).rejects.toThrow(AuthError);
      await expect(login('test@example.com', 'password123')).rejects.toMatchObject({
        message: 'Authentication request failed',
      });
    });
  });

  describe('register', () => {
    it('successfully registers a new user', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await register('testuser', 'test@example.com', 'password123');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:1337/api/auth/local/register',
        {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }
      );
      
      expect(result).toEqual(mockAuthResponse);
    });

    it('throws AuthError on registration failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              message: 'Email is already taken',
            }
          }
        }
      });

      await expect(register('testuser', 'existing@example.com', 'password123')).rejects.toThrow(AuthError);
      await expect(register('testuser', 'existing@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email is already taken',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('fetches current user profile with valid token', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

      const result = await getCurrentUser('valid-token');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:1337/api/users/me?populate=role',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );
      
      expect(result).toEqual(mockUser);
    });

    it('throws AuthError when token is invalid', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid token',
            }
          }
        }
      });

      await expect(getCurrentUser('invalid-token')).rejects.toThrow(AuthError);
      await expect(getCurrentUser('invalid-token')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid token',
      });
    });

    it('handles network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(getCurrentUser('valid-token')).rejects.toThrow(AuthError);
      await expect(getCurrentUser('valid-token')).rejects.toMatchObject({
        message: 'User profile request failed',
      });
    });
  });
});