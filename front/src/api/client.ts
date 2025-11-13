import axios from 'axios';

import { API_BASE_URL } from '../config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

api.interceptors.request.use((cfg) => {
  if (authToken) cfg.headers.Authorization = `Bearer ${authToken}`;
  return cfg;
});

export default api;
