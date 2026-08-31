import api from './api.js';

export async function getCommunities() {
  const response = await api.get('/communities');
  return response.data.data;
}

export async function getCommunity(communityId) {
  const response = await api.get(`/communities/${communityId}`);
  return response.data.data;
}

export async function getCommunityOverview(communityId) {
  const response = await api.get(`/communities/${communityId}/overview`);
  return response.data.data;
}
