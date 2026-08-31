import api from "./api.js";

/**
 * Get services available to the authenticated user.
 *
 * providerId is optional.
 */
export async function getServices(
  providerId = null
) {
  const params = {};

  if (providerId) {
    params.providerId = providerId;
  }

  const response = await api.get(
    "/services",
    { params }
  );

  return response.data?.data || [];
}

/**
 * Get one service.
 */
export async function getService(serviceId) {
  const response = await api.get(
    `/services/${serviceId}`
  );

  return response.data?.data || null;
}
