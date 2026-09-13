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

  // Every push to qa ships new content-hashed JS chunks. A tab that's been open
  // since before a deploy still has the OLD chunk filenames baked into its
  // already-loaded bundle; clicking a route it hasn't visited yet tries to fetch
  // one of those old filenames, which no longer exists on the CURRENT deployment
  // — Cloudflare Pages' SPA fallback serves index.html for the 404 instead, and
  // the browser refuses to run HTML as a JS module ("Failed to fetch dynamically
  // imported module"). There was no recovery at all: the navigation just failed
  // silently. A hard reload fetches the current build's fresh asset manifest and
  // fixes it in one shot — guarded so a genuinely broken deploy doesn't reload-loop.
  private static readonly RELOAD_GUARD_KEY = 'innwise:chunk-reload-attempted';

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.showTimer = setTimeout(() => (this.navigating = true), 150);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
        this.navigating = false;
      } else if (event instanceof NavigationError) {
        if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
        this.navigating = false;
        this.recoverFromStaleChunkIfNeeded(event.error);
      }
    });
  }

  private recoverFromStaleChunkIfNeeded(error: unknown): void {
    const message = String((error as any)?.message ?? error ?? '');
    const looksLikeStaleChunk = /dynamically imported module|loading chunk|importing a module script failed/i.test(message);
    if (!looksLikeStaleChunk) return;

    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem(AppComponent.RELOAD_GUARD_KEY) === '1'; } catch { /* private mode etc. */ }

    if (alreadyTried) {
      // Already reloaded once this session and it's still failing — a hard
      // refresh loop won't help. Let the user decide instead of spinning forever.
      // eslint-disable-next-line no-console
      console.error('A page reload already failed to recover from a stale-chunk error. Please refresh manually.', error);
      return;
    }

    try { sessionStorage.setItem(AppComponent.RELOAD_GUARD_KEY, '1'); } catch { /* ignore */ }
    window.location.reload();
  }
}
