import { Routes } from '@angular/router';

export const bookingsRoutes: Routes = [
  { path: '', loadComponent: () => import('./bookings-list/bookings-list.component').then(m => m.BookingsListComponent) },
  { path: 'add', loadComponent: () => import('./booking-form/booking-form.component').then(m => m.BookingFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./booking-form/booking-form.component').then(m => m.BookingFormComponent) }
];
