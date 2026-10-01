import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, tap } from 'rxjs';

export const AUTH_LOGIN_URL = 'https://iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast/Auth/login';
// export const AUTH_LOGIN_URL = 'https://localhost:7081/api/Auth/login';
export const AUTH_REGISTER_URL = 'https://iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast/Auth/register';
// export const AUTH_REGISTER_URL = 'https://localhost:7081/api/Auth/register';

interface LoginResponse {
  accessToken?: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly accessTokenState = signal(this.readStoredToken());
  readonly isAuthenticated = computed(() => {
    const token = this.accessTokenState();
    return token !== null && !isTokenExpired(token);
  });

  signIn(username: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(AUTH_LOGIN_URL, { username, password }).pipe(
      map(response => response.accessToken ?? response.token),
      map(token => {
        if (!token || isTokenExpired(token)) {
          throw new Error('The login response did not contain a valid JWT.');
        }
        return token;
      }),
      tap(token => this.storeToken(token)),
      map(() => undefined)
    );
  }

  register(username: string, password: string): Observable<void> {
    return this.http.post<void>(AUTH_REGISTER_URL, { username, password });
  }

  signOut(): void {
    this.accessTokenState.set(null);
    if (this.isBrowser) {
      window.sessionStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return this.isAuthenticated() ? this.accessTokenState() : null;
  }

  private readStoredToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const token = window.sessionStorage.getItem('accessToken');
    return token && !isTokenExpired(token) ? token : null;
  }

  private storeToken(token: string): void {
    this.accessTokenState.set(token);
    if (this.isBrowser) {
      window.sessionStorage.setItem('accessToken', token);
    }
  }
}

function isTokenExpired(token: string): boolean {
  const payload = token.split('.')[1];
  if (!payload) {
    return true;
  }

  try {
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');
    const claims = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    return typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}