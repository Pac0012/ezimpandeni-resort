import axios from 'axios';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && String(envUrl).trim()) {
    return String(envUrl).trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

export default apiClient;