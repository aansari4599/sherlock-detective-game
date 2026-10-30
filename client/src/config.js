const PROD_SERVER_FALLBACK = 'https://sherlock-detective-server.onrender.com';

export function getServerUrl() {
  if (process.env.REACT_APP_SERVER_URL) return process.env.REACT_APP_SERVER_URL;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'http://localhost:3001';
    }
  }

  return PROD_SERVER_FALLBACK;
}

export const SERVER_URL = getServerUrl();
