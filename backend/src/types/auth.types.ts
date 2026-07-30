export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  token: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface AuthenticatedUser {
  id: number;
  googleId: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}
