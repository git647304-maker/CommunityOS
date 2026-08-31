import api from './api.js';

export async function getProviders() {
  const response = await api.get('/providers');
  return response.data.data;
}

export async function getProvider(providerId) {
  const response = await api.get(`/providers/${providerId}`);
  return response.data.data;
}

export async function getProviderOrders(providerId, status = null) {
  const response = await api.get(`/providers/${providerId}/orders`, {
    params: { status },
  });
  return response.data.data;
}

export async function acceptOrder(providerId, orderId) {
  const response = await api.post(
    `/providers/${providerId}/orders/${orderId}/accept`
  );
  return response.data.data;
}
