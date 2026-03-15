const AUTH_BASE = '/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResult {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  user: AuthUser;
}

class AuthService {
  private readonly tokenKey = 'token';
  private readonly legacyTokenKey = 'ai_gateway_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) ?? localStorage.getItem(this.legacyTokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.legacyTokenKey, token);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.legacyTokenKey);
  }

  async register(payload: { email: string; password: string; name: string }): Promise<AuthResult> {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json() as Promise<AuthResult>;
  }

  async login(payload: { email: string; password: string }): Promise<AuthResult> {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json() as Promise<AuthResult>;
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; reset_token?: string }> {
    const res = await fetch(`${AUTH_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json() as Promise<{ success: boolean; message: string; reset_token?: string }>;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${AUTH_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json() as Promise<{ success: boolean; message: string }>;
  }

  async me(): Promise<{ user: AuthUser }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${AUTH_BASE}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    return res.json() as Promise<{ user: AuthUser }>;
  }
}

export const authService = new AuthService();

