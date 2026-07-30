export interface Sender {
  id: number;
  name?: string;
  email: string;
  username: string;
  smtpHost?: string;
  smtpPort?: number;
  verificationStatus?: 'verified' | 'unknown';
  createdAt: string;
}

export interface SenderQueryParams {
  page?: number;
  limit?: number;
}

export interface CreateSenderRequest {
  email: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
}

export interface UpdateSenderRequest {
  email?: string;
  smtpHost?: string;
  smtpPort?: number;
  username?: string;
  password?: string;
}
