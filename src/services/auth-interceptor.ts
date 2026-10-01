import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService, AUTH_LOGIN_URL, AUTH_REGISTER_URL } from './auth-service';

const authApiOrigin = new URL(AUTH_LOGIN_URL).origin;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url === AUTH_LOGIN_URL || request.url === AUTH_REGISTER_URL) {
    return next(request);
  }

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url, authApiOrigin).origin;
  } catch {
    return next(request);
  }

  if (requestOrigin !== authApiOrigin) {
    return next(request);
  }

  const accessToken = inject(AuthService).getAccessToken();
  return accessToken
    ? next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }))
    : next(request);
};