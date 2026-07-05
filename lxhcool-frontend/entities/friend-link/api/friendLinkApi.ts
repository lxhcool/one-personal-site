import { requestPublicApi } from '~/shared/api/client';
import type { FriendLink } from '~/entities/friend-link/model/types';

export function listPublicFriendLinks() {
  return requestPublicApi<FriendLink[]>('/public/friend-links');
}
