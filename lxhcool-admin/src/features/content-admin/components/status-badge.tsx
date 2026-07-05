import { Badge } from '@/components/ui/badge'
import type { PublishStatus } from '../types'

export function StatusBadge({ status }: { status: PublishStatus }) {
  const variant = status === 'PUBLISHED' ? 'default' : 'outline'
  const label: Record<PublishStatus, string> = {
    PUBLISHED: '已发布',
    DRAFT: '草稿',
    HIDDEN: '隐藏',
  }

  return <Badge variant={variant}>{label[status]}</Badge>
}
