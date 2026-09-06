import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UserInfo, Tenant, ApiResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getStoredUser());
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(this.getStoredTenant());

  currentUser$ = this.currentUserSubject.asObservable();
  currentTenant$ = this.currentTenantSubject.asObservable();

  get currentUser(): UserInfo | null { return this.currentUserSubject.value; }
  get currentTenant(): Tenant | null { return this.currentTenantSubject.value; }
  get token(): string | null { return localStorage.getItem('token'); }
  get isLoggedIn(): boolean { return !!this.token && !!this.currentUser; }

  /** Where a user should land after login, based on their role. */
  get homeRoute(): string {
    return this.currentUser?.role === 'SuperAdmin' ? '/superadmin' : '/dashboard';
  }

  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, JSON.stringify(req), { headers }).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem('tenant', JSON.stringify(res.data.tenant));
          this.currentUserSubject.next(res.data.user);
          this.currentTenantSubject.next(res.data.tenant);
        }
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.currentTenantSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  private getStoredUser(): UserInfo | null {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }

  private getStoredTenant(): Tenant | null {
    try { return JSON.parse(localStorage.getItem('tenant') || 'null'); }
    catch { return null; }
  }
  changePassword(data: { currentPassword: string; newPassword: string }) {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8'
  });

  return this.http.post<ApiResponse<boolean>>(
    `${environment.apiUrl}/auth/change-password`,
    JSON.stringify(data),
    { headers }
  );
}
}
