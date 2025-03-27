import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const hubspotAPI = axios.create({
  baseURL: 'https://api.hubapi.com/crm/v3',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Solution avec vérification explicite
hubspotAPI.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
