import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar" [class.expanded]="!sidebarCollapsed">

      <!-- Hamburger — mobile only -->
      <button class="menu-toggle" (click)="menuToggle.emit()" aria-label="Toggle menu">
        <i class="bi bi-list"></i>
      </button>

      <!-- Brand logo — mobile only -->
      <div class="mobile-brand">
        <div class="brand-icon">H</div>
      </div>

      <!-- Page title — desktop only -->
      <div class="topbar-left hide-mobile">
        <h1 class="page-title-top">{{ getPageTitle() }}</h1>
      </div>

      <!-- Search — hidden on mobile -->
      <div class="topbar-center hide-mobile">
        <div class="search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Search rooms, bookings, guests…" class="top-search" />
          <kbd>⌘K</kbd>
        </div>
      </div>

      <!-- Right actions -->
      <div class="topbar-right">

        <!-- Hotel selector — hidden on small mobile -->
        <div class="hotel-selector hide-xs">
          <div class="hotel-badge">
            <div class="hotel-dot"></div>
            <span>{{ tenant?.name || 'Grand Hotel' }}</span>
            <i class="bi bi-chevron-down"></i>
          </div>
        </div>

        <button class="icon-btn theme-btn" (click)="toggleTheme()" [title]="isDarkTheme ? 'Light mode' : 'Dark mode'">
          <i class="bi" [class.bi-moon-stars]="isDarkTheme" [class.bi-sun]="!isDarkTheme"></i>
        </button>

        <button class="icon-btn notif-btn">
          <i class="bi bi-bell"></i>
          <span class="notif-dot"></span>
        </button>

        <div class="profile-dropdown" (click)="toggleProfile()">
          <div class="avatar">{{ userInitial }}</div>
          @if (profileOpen) {
            <div class="dropdown-panel">
              <div class="dropdown-header">
                <div class="dh-name">{{ user?.name }}</div>
                <div class="dh-email">{{ user?.email }}</div>
              </div>
              <div class="dropdown-items">
                <a class="dropdown-item" routerLink="/settings">
                  <i class="bi bi-person"></i> My Profile
                </a>
                <a class="dropdown-item" routerLink="/settings">
                  <i class="bi bi-building"></i> Hotel Settings
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" (click)="logout()">
                  <i class="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      position: fixed; top: 0; right: 0;
      left: var(--sidebar-collapsed);
      height: var(--topbar-height);
      background: rgba(10,11,13,0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center;
      padding: 0 1.5rem; gap: 1rem;
      z-index: 90;
      transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
    }

    [data-theme="light"] .topbar {
      background: rgba(255,255,255,0.85);
    }

    .topbar.expanded { left: var(--sidebar-width); }

    /* Hamburger — visible only on mobile */
    .menu-toggle {
      display: none;
      width: 40px; height: 40px;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: var(--transition);
      flex-shrink: 0;
    }
    .menu-toggle:hover { border-color: var(--color-border-hover); }
    .menu-toggle:active { transform: scale(0.95); }

    /* Mobile brand icon */
    .mobile-brand {
      display: none;
      align-items: center;
    }
    .mobile-brand .brand-icon {
      width: 32px; height: 32px;
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.9rem;
    }

    .topbar-left { flex: 0 0 auto; display: flex; align-items: center; }
    .topbar-center { flex: 1; max-width: 420px; }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }

    .page-title-top { font-size: 1rem; font-weight: 600; color: var(--color-text); }

    .search-wrap {
      position: relative; display: flex; align-items: center;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 0 0.875rem;
    }
    .search-wrap:focus-within { border-color: var(--color-accent); }
    .search-wrap i { color: var(--color-text-subtle); font-size: 0.85rem; flex-shrink: 0; }
    .top-search {
      background: 0; border: 0; outline: 0;
      color: var(--color-text); font-size: 0.85rem;
      padding: 0.5rem; flex: 1;
    }
    .top-search::placeholder { color: var(--color-text-subtle); }
    kbd {
      font-size: 0.65rem; color: var(--color-text-subtle);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: 4px; padding: 0.1rem 0.35rem;
    }

    .hotel-badge {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 0.8rem; font-weight: 500;
      cursor: pointer; transition: var(--transition);
      white-space: nowrap;
    }
    .hotel-badge:hover { border-color: var(--color-border-hover); }
    .hotel-dot { width: 7px; height: 7px; background: var(--color-green); border-radius: 50%; }
    .hotel-badge i { font-size: 0.7rem; color: var(--color-text-muted); }

    .icon-btn {
      width: 36px; height: 36px;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; transition: var(--transition);
      flex-shrink: 0;
    }
    .icon-btn:hover { color: var(--color-text); border-color: var(--color-border-hover); }
    .theme-btn:hover { color: var(--color-accent); }

    .notif-dot {
      width: 7px; height: 7px;
      background: var(--color-red); border-radius: 50%;
      position: absolute; top: 6px; right: 6px;
      border: 1.5px solid var(--color-bg);
    }

    .profile-dropdown { position: relative; cursor: pointer; }
    .avatar {
      width: 36px; height: 36px;
      background: var(--color-accent-soft);
      color: var(--color-accent);
      border: 1.5px solid var(--color-accent);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.875rem;
      transition: var(--transition);
    }
    .avatar:hover { background: var(--color-accent); color: #fff; }

    .dropdown-panel {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 220px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-modal);
      overflow: hidden;
      animation: slideUp 0.15s ease;
      z-index: 200;
    }
    .dropdown-header {
      padding: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .dh-name { font-weight: 600; font-size: 0.875rem; }
    .dh-email { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.15rem; }
    .dropdown-items { padding: 0.5rem; }
    .dropdown-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      font-size: 0.875rem;
      transition: var(--transition);
      text-decoration: none;
      border: none; background: none; cursor: pointer; width: 100%;
    }
    .dropdown-item:hover { background: var(--color-surface-2); color: var(--color-text); }
    .dropdown-item.danger:hover { background: var(--color-red-soft); color: var(--color-red); }
    .dropdown-item i { font-size: 0.9rem; }
    .dropdown-divider { height: 1px; background: var(--color-border); margin: 0.35rem 0; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .topbar {
        left: 0 !important;
        padding: 0 0.75rem;
        gap: 0.5rem;
      }

      .menu-toggle { display: flex; }
      .mobile-brand { display: flex; }

      /* Hide on mobile */
      .hide-mobile { display: none !important; }
    }

    @media (max-width: 480px) {
      /* Hide hotel selector on very small screens */
      .hide-xs { display: none !important; }

      .topbar-right { gap: 0.4rem; }

      .icon-btn { width: 32px; height: 32px; }
      .avatar { width: 32px; height: 32px; font-size: 0.8rem; }
    }
  `]
})
export class TopbarComponent {
  @Input() sidebarCollapsed = false;
  @Input() isMobile = false;
  @Output() menuToggle = new EventEmitter<void>();

  private auth = inject(AuthService);
  private themeSvc = inject(ThemeService);

  profileOpen = false;
  isDarkTheme = false;
  user = this.auth.currentUser;
  tenant = this.auth.currentTenant;

  constructor() {
    this.themeSvc.theme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
    });
  }

  get userInitial() { return this.user?.name?.charAt(0).toUpperCase() || 'U'; }

  getPageTitle(): string {
    const path = window.location.pathname.split('/')[1];
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', rooms: 'Rooms', bookings: 'Bookings',
      guests: 'Guests', reports: 'Reports', settings: 'Settings'
    };
    return titles[path] || 'Dashboard';
  }

  toggleProfile() { this.profileOpen = !this.profileOpen; }
  toggleTheme() { this.themeSvc.toggleTheme(); }
  logout() { this.auth.logout(); }
}