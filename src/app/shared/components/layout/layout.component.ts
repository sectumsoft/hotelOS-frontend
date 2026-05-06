import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="page-wrapper">
      @if (showSidebarOverlay) {
        <div class="sidebar-overlay" [class.visible]="sidebarVisible" (click)="closeMobileMenu()"></div>
      }
      <app-sidebar
        [(collapsed)]="sidebarCollapsed"
        [visible]="sidebarVisible"
        (close)="closeMobileMenu()">
      </app-sidebar>
      <app-topbar
        [sidebarCollapsed]="sidebarCollapsed"
        [isMobile]="isMobile"
        (menuToggle)="toggleMobileMenu()">
      </app-topbar>
      <main class="main-content" [class.collapsed]="sidebarCollapsed">
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar-overlay.visible {
      display: block;
      opacity: 1;
    }

    @media (max-width: 768px) {
      .sidebar-overlay { display: block; pointer-events: none; }
      .sidebar-overlay.visible { pointer-events: all; }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  private themeSvc = inject(ThemeService);

  sidebarCollapsed = false;
  sidebarVisible = true;
  showSidebarOverlay = false;
  isMobile = false;

  private resizeHandler = () => this.handleResize();

  ngOnInit() {
    this.themeSvc.setTheme(this.themeSvc.getTheme());
    window.addEventListener('resize', this.resizeHandler);
    this.handleResize();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private handleResize() {
    const width = window.innerWidth;
    if (width <= 768) {
      this.isMobile = true;
      this.showSidebarOverlay = true;
      this.sidebarVisible = false;
      this.sidebarCollapsed = false;
    } else if (width <= 1024) {
      this.isMobile = false;
      this.showSidebarOverlay = false;
      this.sidebarVisible = true;
      this.sidebarCollapsed = true;
    } else {
      this.isMobile = false;
      this.showSidebarOverlay = false;
      this.sidebarVisible = true;
      this.sidebarCollapsed = false;
    }
  }

  toggleMobileMenu() {
    if (window.innerWidth <= 768) {
      this.sidebarVisible = !this.sidebarVisible;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeMobileMenu() {
    if (window.innerWidth <= 768) {
      this.sidebarVisible = false;
    }
  }
}