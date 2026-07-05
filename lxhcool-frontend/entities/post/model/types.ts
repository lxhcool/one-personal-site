export type Post = {
  id: string;
  type: 'ARTICLE' | 'MOMENT';
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  content: string;
  media: Record<string, unknown>;
  coverImage: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
