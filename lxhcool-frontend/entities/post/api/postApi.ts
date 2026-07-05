import { requestPublicApi } from '~/shared/api/client';
import type { Post } from '~/entities/post/model/types';

export function listPublicPosts(type?: Post['type']) {
  return requestPublicApi<Post[]>(
    `/public/posts${type ? `?type=${encodeURIComponent(type)}` : ''}`,
  );
}

export function getPublicPost(slug: string) {
  return requestPublicApi<Post>(`/public/posts/${encodeURIComponent(slug)}`);
}
