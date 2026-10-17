import axios from 'axios';

const API_BASE_URL = process.env.Server_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;
let silentRefreshTimer: ReturnType<typeof setTimeout> | null = null;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export function stopSilentRefresh() {
  if (silentRefreshTimer) {
    clearTimeout(silentRefreshTimer);
    silentRefreshTimer = null;
  }
}

export function getTokenLifetimeInfo(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp, iat } = JSON.parse(jsonPayload);
    if (!exp) return null;

    const expMs = exp * 1000;
    const iatMs = iat ? iat * 1000 : expMs - 60000;
    const totalLifetimeMs = Math.max(10000, expMs - iatMs);
    // 1/10th buffer (10% of lifetime remaining)
    const bufferMs = Math.max(2000, totalLifetimeMs * 0.1);
    const remainingMs = expMs - Date.now();
    const isExpiredOrClose = remainingMs <= bufferMs;

    return {
      expMs,
      iatMs,
      totalLifetimeMs,
      bufferMs,
      remainingMs,
      isExpiredOrClose,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const info = getTokenLifetimeInfo(token);
  if (!info) return true;
  return info.isExpiredOrClose;
}

export function scheduleSilentRefresh(token: string) {
  if (typeof window === 'undefined') return;

  stopSilentRefresh();

  const info = getTokenLifetimeInfo(token);
  if (!info) return;

  // Refresh when 90% of the token lifetime has elapsed (at 1/10th remaining)
  const refreshInMs = Math.max(1000, info.remainingMs - info.bufferMs);

  silentRefreshTimer = setTimeout(async () => {
    try {
      console.log(
        `[Auth] Dynamic silent refresh triggered (lifetime: ${Math.round(
          info.totalLifetimeMs / 1000
        )}s, buffer: ${Math.round(info.bufferMs / 1000)}s)`
      );
      await refreshAccessToken();
    } catch {
      // Handled in refreshAccessToken
    }
  }, refreshInMs);
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newAccessToken = res.data.data.tokens.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
      }
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      // Dynamically schedule next refresh for this new token
      scheduleSilentRefresh(newAccessToken);

      return newAccessToken;
    } catch (err) {
      stopSilentRefresh();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const currentToken = localStorage.getItem('accessToken');
  if (!currentToken || isTokenExpired(currentToken)) {
    return await refreshAccessToken();
  }
  return currentToken;
}

// Request interceptor: attaches the current token to outgoing requests
api.interceptors.request.use(async (config) => {
  if (
    config.url?.includes('/auth/refresh') ||
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register')
  ) {
    return config;
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never trigger token refresh or page reload for authentication endpoints
    if (
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        // Resolve all waiting requests in the queue with the new access token
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        stopSilentRefresh();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Initialize proactive background refresh on initial load if logged in
if (typeof window !== 'undefined') {
  const existingToken = localStorage.getItem('accessToken');
  if (existingToken) {
    scheduleSilentRefresh(existingToken);
  }
}
