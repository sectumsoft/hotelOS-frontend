import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  // ToastService has no HttpClient dependency, so it's safe to resolve eagerly.
  // AuthService pulls in HttpClient, so it stays lazy (below) to avoid a DI cycle.
  const toast = inject(ToastService);

  let headers = req.headers;
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  if (tenant?.id) headers = headers.set('X-Tenant-Id', tenant.id);

  const authReq = req.clone({ headers });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        inject(AuthService).logout();
      } else if (err.status === 0) {
        // network down, DNS failure, or CORS block — the request never landed
        toast.error('Can’t reach the server. Check your connection and try again.', 'Network error');
      } else if (err.status >= 500) {
        toast.error('Something went wrong on our end. Please try again in a moment.', 'Server error');
      }
      // 4xx (validation, not-found, conflict) is left for the calling component
      // to surface with context-specific messaging.
      return throwError(() => err);
    })
  );
};
