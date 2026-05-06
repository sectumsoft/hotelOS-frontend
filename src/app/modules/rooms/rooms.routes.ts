import { Routes } from '@angular/router';

export const roomsRoutes: Routes = [
  { path: '', loadComponent: () => import('./rooms-list/rooms-list.component').then(m => m.RoomsListComponent) },
  { path: 'add', loadComponent: () => import('./room-form/room-form.component').then(m => m.RoomFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./room-form/room-form.component').then(m => m.RoomFormComponent) }
];
