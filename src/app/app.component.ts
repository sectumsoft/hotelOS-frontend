import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { LoadingComponent } from './shared/components/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, LoadingComponent],
  template: `
    @if (navigating) {
      <app-loading mode="overlay" text="Loading" />
    }
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `
})
export class AppComponent {
  private router = inject(Router);
  navigating = false;

  // Lazy-loaded routes mean clicking a sidebar link can sit doing nothing
  // visible for a moment while the chunk downloads — there was no indicator
  // at all before. A short delay before showing it keeps a fast (cached)
  // navigation from flashing the loader for a single frame.
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.showTimer = setTimeout(() => (this.navigating = true), 150);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
        this.navigating = false;
      }
    });
  }
}
