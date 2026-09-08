import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const role = auth.currentUser?.role;

  if (role && allowedRoles.includes(role)) return true;

  router.navigate([auth.homeRoute]);
  return false;
};

/**
 * Blocks SuperAdmin from tenant-scoped pages (dashboard, rooms, bookings, …)
 * and sends them to their own area instead. The backend rejects those calls
 * for a SuperAdmin anyway, so this keeps the UI consistent with the API.
 */
export const notSuperAdminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser?.role === 'SuperAdmin') {
    router.navigate(['/superadmin']);
    return false;
  }
  return true;
};

/**
 * Gates a feature module for Staff by their granted permissions.
 * Admins pass through; a Staff member without the module is sent to the dashboard.
 */
export const moduleGuard = (moduleKey: string): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser?.role === 'SuperAdmin') { router.navigate(['/superadmin']); return false; }
  if (auth.canAccess(moduleKey)) return true;

  router.navigate(['/dashboard']);
  return false;
};
