/**
 * Udhaar API URL & Request Utilities
 * Reads VITE_API_URL from .env when configured for separate domains.
 * Falls back to relative paths / Vite proxy in local development.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return cleanPath;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/^http/, 'ws');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:5000`;
}

export function getReceiptUrl(url) {
  if (!url) return '';
  // If already absolute URL (e.g. Supabase Storage public URL: https://...), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative path starting with /uploads, route to backend server domain
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const base = API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname.includes('udhaar.store') ? 'https://server.udhaar.store' : '');
  return base ? `${base}${cleanPath}` : cleanPath;
}

// Automatically ensure window.fetch routes relative /api and /uploads calls to API_BASE_URL in production
if (typeof window !== 'undefined' && API_BASE_URL) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (resource, init) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api') || resource.startsWith('/uploads')) {
        return originalFetch(`${API_BASE_URL}${resource}`, init);
      }
    }
    return originalFetch(resource, init);
  };
}
