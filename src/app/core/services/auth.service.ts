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

  // "Keep me signed in" decides WHERE the session lives, not just a remembered
  // email: checked → localStorage (survives closing the browser); unchecked →
  // sessionStorage (gone once the tab/window closes). Without this split, every
  // login persisted forever in localStorage regardless of the checkbox, so
  // reopening the browser — or anyone else opening a bookmark on a shared
  // machine — landed straight in the dashboard with no re-authentication.
  get token(): string | null { return localStorage.getItem('token') ?? sessionStorage.getItem('token'); }
  get isLoggedIn(): boolean { return !!this.token && !!this.currentUser; }

  /** Where a user should land after login, based on their role. */
  get homeRoute(): string {
    return this.currentUser?.role === 'SuperAdmin' ? '/superadmin' : '/dashboard';
  }

  /** Module keys a Staff user was granted. Admins are unrestricted. */
  get modules(): string[] {
    return this.currentUser?.modules ?? [];
  }

  /** Can the current user reach a feature module? Admins always can. */
  canAccess(moduleKey: string): boolean {
    const role = this.currentUser?.role;
    if (role === 'HotelAdmin' || role === 'SuperAdmin') return true;
    if (role === 'Staff') return this.modules.includes(moduleKey);
    return false;
  }

  /** Session keys only — deliberately excludes unrelated app prefs like the
   *  theme choice or the remembered-email convenience, which should survive a
   *  login/logout, not just full-storage-clear anything named "user"-adjacent. */
  private static readonly SESSION_KEYS = ['token', 'refreshToken', 'user', 'tenant'];

  private clearSessionKeys(): void {
    for (const key of AuthService.SESSION_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  login(req: LoginRequest, rememberMe = false): Observable<ApiResponse<LoginResponse>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, JSON.stringify(req), { headers }).pipe(
      tap(res => {
        if (res.success) {
          // A previous session may be sitting in the other storage — clear both
          // before writing so there's never a stale duplicate copy.
          this.clearSessionKeys();
          const store = rememberMe ? localStorage : sessionStorage;
          store.setItem('token', res.data.token);
          store.setItem('refreshToken', res.data.refreshToken);
          store.setItem('user', JSON.stringify(res.data.user));
          store.setItem('tenant', JSON.stringify(res.data.tenant));
          this.currentUserSubject.next(res.data.user);
          this.currentTenantSubject.next(res.data.tenant);
        }
      })
    );
  }

  logout(): void {
    this.clearSessionKeys();
    this.currentUserSubject.next(null);
    this.currentTenantSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /** Keep the cached tenant name in sync after the hotel profile is edited. */
  refreshTenantName(name: string): void {
    const tenant = this.currentTenantSubject.value;
    if (!tenant || !name || tenant.name === name) return;
    const updated = { ...tenant, name };
    // Write back to whichever store actually holds the session.
    (localStorage.getItem('tenant') ? localStorage : sessionStorage)
      .setItem('tenant', JSON.stringify(updated));
    this.currentTenantSubject.next(updated);
  }

  private getStoredUser(): UserInfo | null {
    try { return JSON.parse(localStorage.getItem('user') ?? sessionStorage.getItem('user') ?? 'null'); }
    catch { return null; }
  }

  private getStoredTenant(): Tenant | null {
    try { return JSON.parse(localStorage.getItem('tenant') ?? sessionStorage.getItem('tenant') ?? 'null'); }
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
