export interface Sender {
  id: number;
  email: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  createdAt: string;
}

export interface SenderQueryParams {
  page?: number;
  limit?: number;
}
