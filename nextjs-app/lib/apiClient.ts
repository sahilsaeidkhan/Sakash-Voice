import axios, { AxiosError, AxiosResponse } from 'axios';
import { clearToken, getToken, redirectToLogin } from '@/lib/auth';

interface ErrorPayload {
  error?: string;
  message?: string;
}

const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('API request:', {
    method: config.method,
    url: `${config.baseURL || ''}${config.url || ''}`,
    hasToken: Boolean(token),
    data: config.data,
  });

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response;
  },
  async (error: AxiosError<ErrorPayload>) => {
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown API error';

    console.error('API error:', {
      status,
      url: error.config?.url,
      message: errorMessage,
      details: error.response?.data,
    });

    if (status === 401) {
      clearToken();
      redirectToLogin();
    }

    const isUserNotFound =
      status === 404 &&
      typeof errorMessage === 'string' &&
      errorMessage.toLowerCase().includes('user not found');

    if (isUserNotFound) {
      console.warn('User not found from API, redirecting to login fallback');
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export async function checkApiConnection(): Promise<string> {
  try {
    const response = await apiClient.get('/api/generate-topic');
    return response.status === 200 ? 'Connected' : 'Connection issue';
  } catch (error) {
    console.error('Check API connection failed:', error);
    throw new Error('Connection issue');
  }
}
