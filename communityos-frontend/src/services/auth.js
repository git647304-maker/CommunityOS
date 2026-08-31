import api from './api.js';

export async function register(data) {
  const response = await api.post('/auth/register', data);
  return response.data.data;
}

export async function login(email, password, tenantId) {
  const response = await api.post('/auth/login', {
    email,
    password,
    tenantId,
  });

  return response.data.data;
}

export async function loginUser(email, password, tenantId) {
  return login(email, password, tenantId);
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data.data;
}
