import { requestPublicApi } from '~/shared/api/client';
import type { Project } from '~/entities/project/model/types';

export function listPublicProjects(options?: { featured?: boolean }) {
  const query = options?.featured ? '?featured=true' : '';
  return requestPublicApi<Project[]>(`/public/projects${query}`);
}

export function getPublicProject(slug: string) {
  return requestPublicApi<Project>(`/public/projects/${encodeURIComponent(slug)}`);
}
