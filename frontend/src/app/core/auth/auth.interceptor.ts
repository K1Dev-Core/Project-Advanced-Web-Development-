import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const isJobRequest = request.url.includes('/jobs/');
  const outgoing = token && !isJobRequest ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      const isLogin = request.url.endsWith('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLogin && !isJobRequest && token) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
