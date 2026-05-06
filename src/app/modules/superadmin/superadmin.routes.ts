import { Routes } from '@angular/router';

export const superadminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../hotels/hotels.component').then(m => m.HotelsComponent)
  },
  {
    path: 'onboard',
    loadComponent: () => import('./onboard/onboard.component').then(m => m.OnboardComponent)
  }
];