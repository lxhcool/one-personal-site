import type { ApiResponse } from '~/shared/types/api';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

export async function requestPublicApi<T>(path: string): Promise<T> {
  const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await $fetch<ApiResponse<T>>(url);

  if (!response || response.success !== true || !('data' in response)) {
    const message = response && 'message' in response ? response.message : undefined;
    throw new Error(message ?? `Invalid API response from ${url}`);
  }

  return response.data;
}
