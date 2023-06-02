export interface ApiResponse<T> {
  ecode: number;
  status: number;
  edesc: string;
  response: T;
}
