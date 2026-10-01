import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticated = signal(false);
  readonly isAuthenticated = this.authenticated.asReadonly();

  signIn(username: string, password: string): boolean {
    const isValid = username === 'admin' && password === '123';
    this.authenticated.set(isValid);
    return isValid;
  }

  signOut(): void {
    this.authenticated.set(false);
  }
}