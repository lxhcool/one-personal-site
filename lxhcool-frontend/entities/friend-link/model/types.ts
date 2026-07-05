export type FriendLink = {
  id: string;
  name: string;
  url: string;
  category: string | null;
  logo: string | null;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};
