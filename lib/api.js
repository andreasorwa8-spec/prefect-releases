import Constants from 'expo-constants';
import { getMobileSession } from './auth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.88.254:3000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;

  let sessionToken = null;
  try {
    const session = await getMobileSession();
    sessionToken = session?.sessionToken || null;
  } catch {
    sessionToken = null;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { 'X-Session-Token': sessionToken } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type');
    let data = null;
    if (contentType?.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const message =
        (typeof data === 'object' && data?.error) || `HTTP ${res.status}`;
      throw new ApiError(message, res.status, data);
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error', 0, null);
  }
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, { ...options, method: 'POST', body: JSON.stringify(body || {}) }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body: JSON.stringify(body || {}) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export { API_URL, ApiError };