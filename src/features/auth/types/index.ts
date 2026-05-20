export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  tenantId?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
