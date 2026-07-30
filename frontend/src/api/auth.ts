import { apiClient } from './client';

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  token: string;
}

export async function googleLogin(
  credential: string
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/google',
    {
      credential,
    },
  );

  return data;
}
