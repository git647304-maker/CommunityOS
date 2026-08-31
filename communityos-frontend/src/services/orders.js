import api from './api.js';

export async function createOrder(data) {
  const response = await api.post('/orders', data);
  return response.data.data;
}

export async function getOrders(page = 1, limit = 20) {
  const response = await api.get('/orders', {
    params: { page, limit },
  });
  return response.data.data;
}

export async function getOrder(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data.data;
}

export async function getOrderTimeline(orderId) {
  const response = await api.get(`/orders/${orderId}/timeline`);
  return response.data.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data.data;
}
