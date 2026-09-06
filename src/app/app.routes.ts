import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard, notSuperAdminGuard } from './core/guards/role.guard';
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [notSuperAdminGuard],
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'rooms',
        canActivate: [notSuperAdminGuard],
        loadChildren: () => import('./modules/rooms/rooms.routes').then(m => m.roomsRoutes)
      },
      {
        path: 'bookings',
        canActivate: [notSuperAdminGuard],
        loadChildren: () => import('./modules/bookings/bookings.routes').then(m => m.bookingsRoutes)
      },
      {
        path: 'guests',
        canActivate: [notSuperAdminGuard],
        loadComponent: () => import('./modules/guests/guests.component').then(m => m.GuestsComponent)
      },
      {
        path: 'reports',
        canActivate: [notSuperAdminGuard],
        loadComponent: () => import('./modules/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        canActivate: [notSuperAdminGuard],
        loadComponent: () => import('./modules/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['HotelAdmin'])],
        loadComponent: () => import('./modules/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'superadmin',
        canActivate: [roleGuard(['SuperAdmin'])],
        loadChildren: () => import('./modules/superadmin/superadmin.routes').then(m => m.superadminRoutes)
      },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
