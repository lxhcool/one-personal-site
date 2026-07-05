import { requestPublicApi } from '~/shared/api/client';
import type { SiteWidget } from '~/entities/widget/model/types';

export function listPublicWidgets() {
  return requestPublicApi<SiteWidget[]>('/public/widgets');
}
