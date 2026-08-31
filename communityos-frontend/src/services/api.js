import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    'VITE_API_URL is not configured. Check your .env files.'
  );
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('co_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API responses/errors
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('co_token');
      localStorage.removeItem('co_user');

      // Only redirect if the user is actually logged in
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export default api;
