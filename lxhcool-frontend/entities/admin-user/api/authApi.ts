import type { AdminUser } from '~/entities/admin-user/model/types';
import type { ApiResponse } from '~/shared/types/api';
import { getRequiredPublicRuntimeConfig } from '~/shared/config/env';

export async function loginAdminUser(payload: { email: string; password: string }) {
  const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
  const response = await $fetch<ApiResponse<AdminUser>>(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    body: payload,
    credentials: 'include',
  });
  return response;
}

export async function getCurrentAdminUser() {
  const { apiBaseUrl } = getRequiredPublicRuntimeConfig();

  try {
    const response = await $fetch<ApiResponse<AdminUser>>(`${apiBaseUrl}/auth/me`, {
      credentials: 'include',
    });

    return response.success ? response.data : null;
  } catch {
    return null;
  }
}

export async function logoutAdminUser() {
  const { apiBaseUrl } = getRequiredPublicRuntimeConfig();
  await $fetch<ApiResponse<boolean>>(`${apiBaseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
