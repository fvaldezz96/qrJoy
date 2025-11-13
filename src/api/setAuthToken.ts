import axios from 'axios';

import { ENDPOINTS } from '../config';

const api = axios.create({
  baseURL: ENDPOINTS.auth.login.split('/auth')[0],
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
