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
