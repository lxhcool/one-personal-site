export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}
