import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed" [class.visible]="visible">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">H</div>
          @if (!collapsed) {
            <div class="brand-text">
              <span class="brand-name">HotelOS</span>
              <span class="brand-tenant">{{ tenant?.name }}</span>
            </div>
          }
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <i class="bi" [class.bi-layout-sidebar]="!collapsed" [class.bi-layout-sidebar-reverse]="collapsed"></i>
        </button>
      </div>
<nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a class="nav-item"
            [routerLink]="item.route"
            routerLinkActive="active"
            (click)="closeOnMobile()"
            [title]="collapsed ? item.label : ''">
            <span class="nav-icon"><i class="bi {{ item.icon }}"></i></span>
            @if (!collapsed) {
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        @if (!collapsed) {
          <div class="user-info">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-details">
              <div class="user-name">{{ user?.name }}</div>
              <div class="user-role">{{ user?.role }}</div>
            </div>
          </div>
        }
        <button class="logout-btn" (click)="logout()" [title]="collapsed ? 'Logout' : ''">
          <i class="bi bi-box-arrow-right"></i>
          @if (!collapsed) { <span>Logout</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed); }

    .sidebar-header {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: var(--topbar-height);
    }

    .brand { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .brand-icon {
      width: 36px; height: 36px;
      background: var(--color-accent);
      color: #fff;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
      flex-shrink: 0;
    }
    .brand-text { min-width: 0; }
    .brand-name { display: block; font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
    .brand-tenant {
      display: block; font-size: 0.7rem;
      color: var(--color-text-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .collapse-btn {
      background: none; border: none; color: var(--color-text-muted);
      cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm);
      transition: var(--transition); flex-shrink: 0;
    }
    .collapse-btn:hover { color: var(--color-text); background: var(--color-surface-2); }

    .sidebar-nav {
      flex: 1; padding: 1rem 0.75rem; overflow-y: auto;
      display: flex; flex-direction: column; gap: 0.15rem;
    }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-decoration: none;
      transition: var(--transition);
      white-space: nowrap;
      position: relative;
    }
    .nav-item:hover { background: var(--color-surface-2); color: var(--color-text); }
    .nav-item.active { background: var(--color-accent-soft); color: var(--color-accent); }
    .nav-item.active .nav-icon { color: var(--color-accent); }
    .nav-icon { font-size: 1.1rem; width: 20px; text-align: center; flex-shrink: 0; }
    .nav-label { font-size: 0.875rem; font-weight: 500; }
    .nav-badge {
      margin-left: auto;
      background: var(--color-accent); color: #fff;
      font-size: 0.65rem; font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 100px; min-width: 18px; text-align: center;
    }

    .sidebar-footer {
      padding: 0.75rem; border-top: 1px solid var(--color-border);
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .user-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; }
    .user-avatar {
      width: 32px; height: 32px;
      background: var(--color-accent-soft);
      color: var(--color-accent);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; flex-shrink: 0;
    }
    .user-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .user-role { font-size: 0.7rem; color: var(--color-text-muted); white-space: nowrap; }

    .logout-btn {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-md);
      background: none; border: none;
      color: var(--color-text-muted);
      cursor: pointer; transition: var(--transition); font-size: 0.875rem;
      width: 100%;
    }
    .logout-btn:hover { background: var(--color-red-soft); color: var(--color-red); }

    @media (max-width: 768px) {
      .sidebar {
        left: -100%;
        width: 280px !important;
        z-index: 1000;
        box-shadow: var(--shadow-modal);
        transition: left 0.3s cubic-bezier(0.4,0,0.2,1);
      }
      .sidebar.visible { left: 0; }
      .collapse-btn { display: none; }
      .nav-item {
        padding: 0.875rem 0.75rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() visible = true;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  private auth = inject(AuthService);

  get user() { return this.auth.currentUser; }
  get tenant() { return this.auth.currentTenant; }

  get userInitial(): string { return this.user?.name?.charAt(0).toUpperCase() || 'U'; }

  get navItems(): NavItem[] {
    const role = this.user?.role;

    if (role === 'SuperAdmin') {
      return [
        { label: 'Hotels', icon: 'bi-building', route: '/superadmin' },
        { label: 'Onboard Hotel', icon: 'bi-plus-circle', route: '/superadmin/onboard' },
      ];
    }

    const items: NavItem[] = [
      { label: 'Dashboard', icon: 'bi-grid-1x2', route: '/dashboard' },
      { label: 'Rooms', icon: 'bi-door-open', route: '/rooms' },
      { label: 'Bookings', icon: 'bi-calendar-check', route: '/bookings' },
      { label: 'Guests', icon: 'bi-people', route: '/guests' },
      { label: 'Reports', icon: 'bi-bar-chart', route: '/reports' },
      { label: 'Settings', icon: 'bi-gear', route: '/settings' },
    ];

    if (role === 'HotelAdmin') {
      items.push({ label: 'Users', icon: 'bi-person-gear', route: '/users' });
    }

    return items;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  closeOnMobile() {
    if (window.innerWidth <= 768) this.close.emit();
  }

  logout() { this.auth.logout(); }
}