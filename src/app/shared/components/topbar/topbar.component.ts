import { Component, Input, Output, EventEmitter, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { SearchService, SearchHit } from '../../../core/services/search.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="topbar" [class.expanded]="!sidebarCollapsed">

      <button class="menu-toggle" (click)="menuToggle.emit()" aria-label="Toggle menu">
        <i class="bi bi-list"></i>
      </button>

      <div class="mobile-brand"><div class="brand-icon">H</div></div>

      <div class="topbar-left">
        <h1 class="page-title-top">{{ getPageTitle() }}</h1>
      </div>

      <!-- Global search -->
      <div class="search-wrap hide-mobile">
        <i class="bi bi-search"></i>
        <input type="text" [(ngModel)]="q" (ngModelChange)="onSearchType($event)"
               (focus)="searchOpen = true" placeholder="Search rooms, bookings, guests…" class="top-search" />
        @if (q) { <button class="search-clear" (click)="clearSearch()"><i class="bi bi-x"></i></button> }

        @if (searchOpen && q.trim().length >= 2) {
          <div class="search-panel">
            @if (searching) {
              <div class="sp-empty"><span class="loading-spinner"></span></div>
            } @else if (!hasResults()) {
              <div class="sp-empty">No matches for “{{ q }}”</div>
            } @else {
              @if (results.rooms.length) {
                <div class="sp-group">Rooms</div>
                @for (h of results.rooms; track h.label) {
                  <button class="sp-item" (click)="goTo(h)"><i class="bi bi-door-open"></i><span>{{ h.label }}</span><small>{{ h.sub }}</small></button>
                }
              }
              @if (results.bookings.length) {
                <div class="sp-group">Bookings</div>
                @for (h of results.bookings; track h.label) {
                  <button class="sp-item" (click)="goTo(h)"><i class="bi bi-calendar-check"></i><span>{{ h.label }}</span><small>{{ h.sub }}</small></button>
                }
              }
              @if (results.guests.length) {
                <div class="sp-group">Guests</div>
                @for (h of results.guests; track h.label) {
                  <button class="sp-item" (click)="goTo(h)"><i class="bi bi-person"></i><span>{{ h.label }}</span><small>{{ h.sub }}</small></button>
                }
              }
            }
          </div>
        }
      </div>

      <div class="topbar-right">

        <div class="hotel-selector hide-xs">
          <div class="hotel-badge"><div class="hotel-dot"></div><span>{{ tenant?.name || 'Hotel' }}</span></div>
        </div>

        <button class="icon-btn theme-btn" (click)="toggleTheme()" [title]="isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'">
          <i class="bi" [class.bi-moon-stars]="isDarkTheme" [class.bi-sun]="!isDarkTheme"></i>
        </button>

        <!-- Notifications -->
        <div class="pop-wrap">
          <button class="icon-btn" (click)="toggleNotif($event)" aria-label="Notifications">
            <i class="bi bi-bell"></i>
            @if (feed.unreadCount > 0) { <span class="notif-dot"></span> }
          </button>
          @if (notifOpen) {
            <div class="dropdown-panel notif-panel">
              <div class="dropdown-header notif-head">
                <span>Notifications</span>
                @if (feed.unreadCount > 0) { <span class="notif-count">{{ feed.unreadCount }} new</span> }
              </div>
              <div class="notif-list">
                @if (notifLoading) {
                  <div class="notif-empty"><span class="loading-spinner"></span></div>
                } @else if (feed.items.length === 0) {
                  <div class="notif-empty"><i class="bi bi-check2-circle"></i><span>No activity yet</span></div>
                } @else {
                  @for (n of feed.items; track n.id) {
                    <button class="notif-item" [class.unread]="!n.isRead" (click)="openNotif(n)">
                      <span class="notif-ico" [attr.data-type]="n.type"><i class="bi {{ notifSvc.iconFor(n.type) }}"></i></span>
                      <span class="notif-body">
                        <span class="notif-title">{{ n.title }}</span>
                        <span class="notif-text">{{ n.message }}</span>
                        <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
                      </span>
                    </button>
                  }
                }
              </div>
              <a class="notif-foot" routerLink="/bookings" (click)="notifOpen = false">Go to bookings</a>
            </div>
          }
        </div>

        <!-- Profile -->
        <div class="pop-wrap">
          <div class="avatar" (click)="toggleProfile($event)">{{ userInitial }}</div>
          @if (profileOpen) {
            <div class="dropdown-panel">
              <div class="dropdown-header">
                <div class="dh-name">{{ user?.name }}</div>
                <div class="dh-email">{{ user?.email }}</div>
                <div class="dh-role">{{ user?.role }}</div>
              </div>
              <div class="dropdown-items">
                @if (user?.role === 'HotelAdmin') {
                  <a class="dropdown-item" routerLink="/settings" (click)="profileOpen=false"><i class="bi bi-building"></i> Hotel Settings</a>
                  <a class="dropdown-item" routerLink="/users" (click)="profileOpen=false"><i class="bi bi-people"></i> Staff</a>
                }
                <button class="dropdown-item danger" (click)="logout()"><i class="bi bi-box-arrow-right"></i> Logout</button>
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
      background: var(--topbar-bg);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center;
      padding: 0 1.25rem; gap: 1rem;
      z-index: 90;
      transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .topbar.expanded { left: var(--sidebar-width); }

    .menu-toggle {
      display: none; width: 40px; height: 40px;
      background: var(--color-surface-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text);
      cursor: pointer; align-items: center; justify-content: center;
      font-size: 1.2rem; transition: var(--transition); flex-shrink: 0;
    }
    .menu-toggle:active { transform: scale(0.95); }
    .mobile-brand { display: none; }
    .mobile-brand .brand-icon {
      width: 32px; height: 32px; background: var(--color-accent); color: #fff;
      border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.9rem;
    }

    .topbar-left { flex-shrink: 0; }
    .page-title-top { font-size: 1.05rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; white-space: nowrap; }
    .topbar-right { display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0; margin-left: auto; }

    /* search */
    .search-wrap {
      position: relative; flex: 1; max-width: 440px;
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 0 0.75rem;
    }
    .search-wrap:focus-within { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft); }
    .search-wrap > i { color: var(--color-text-subtle); font-size: 0.85rem; flex-shrink: 0; }
    .top-search {
      flex: 1; background: none; border: none; outline: none;
      color: var(--color-text); font-size: 0.85rem; padding: 0.5rem 0; font-family: var(--font-sans);
    }
    .top-search::placeholder { color: var(--color-text-subtle); }
    .search-clear {
      background: none; border: none; color: var(--color-text-subtle); cursor: pointer;
      display: flex; padding: 0.15rem; border-radius: 4px;
    }
    .search-clear:hover { color: var(--color-text); }
    .search-panel {
      position: absolute; top: calc(100% + 8px); left: 0; right: 0;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-modal);
      overflow: hidden; z-index: 200; max-height: 60vh; overflow-y: auto;
      animation: slideUp 0.14s ease;
    }
    .sp-empty { padding: 1.25rem; text-align: center; color: var(--color-text-muted); font-size: 0.82rem; }
    .sp-group {
      padding: 0.5rem 0.85rem 0.3rem; font-size: 0.66rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--color-text-subtle);
    }
    .sp-item {
      display: flex; align-items: center; gap: 0.6rem; width: 100%;
      padding: 0.5rem 0.85rem; border: none; background: none; cursor: pointer; text-align: left;
      color: var(--color-text); font-size: 0.85rem; transition: var(--transition);
    }
    .sp-item:hover { background: var(--color-surface-2); }
    .sp-item i { color: var(--color-text-muted); font-size: 0.85rem; flex-shrink: 0; }
    .sp-item span { flex-shrink: 0; }
    .sp-item small { color: var(--color-text-muted); font-size: 0.75rem; margin-left: auto; white-space: nowrap; }

    .hotel-badge {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.8rem; background: var(--color-surface-2);
      border: 1px solid var(--color-border); border-radius: 100px;
      font-size: 0.8rem; font-weight: 600; white-space: nowrap;
    }
    .hotel-dot { width: 7px; height: 7px; background: var(--color-green); border-radius: 50%; box-shadow: 0 0 0 3px var(--color-green-soft); }

    .icon-btn {
      width: 36px; height: 36px;
      background: var(--color-surface-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; transition: var(--transition); flex-shrink: 0;
    }
    .icon-btn:hover { color: var(--color-text); border-color: var(--color-border-hover); background: var(--color-surface); }
    .theme-btn:hover { color: var(--color-accent); }
    .notif-dot {
      width: 8px; height: 8px; background: var(--color-red); border-radius: 50%;
      position: absolute; top: 5px; right: 5px; border: 2px solid var(--color-bg);
    }

    .pop-wrap { position: relative; }
    .avatar {
      width: 36px; height: 36px; cursor: pointer;
      background: var(--color-accent-soft); color: var(--color-accent);
      border: 1.5px solid var(--color-accent); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.875rem; transition: var(--transition);
    }
    .avatar:hover { background: var(--color-accent); color: #fff; }

    .dropdown-panel {
      position: absolute; top: calc(100% + 10px); right: 0; width: 260px;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-modal);
      overflow: hidden; z-index: 200; animation: slideUp 0.15s ease;
    }
    .dropdown-header { padding: 0.85rem 1rem; border-bottom: 1px solid var(--color-border); }
    .dh-name { font-weight: 600; font-size: 0.875rem; }
    .dh-email { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.15rem; }
    .dh-role { font-size: 0.68rem; color: var(--color-accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.3rem; }
    .dropdown-items { padding: 0.4rem; }
    .dropdown-item {
      display: flex; align-items: center; gap: 0.7rem; padding: 0.55rem 0.7rem;
      border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 0.875rem;
      transition: var(--transition); text-decoration: none;
      border: none; background: none; cursor: pointer; width: 100%;
    }
    .dropdown-item:hover { background: var(--color-surface-2); color: var(--color-text); }
    .dropdown-item.danger:hover { background: var(--color-red-soft); color: var(--color-red); }

    .notif-panel { width: 340px; }
    .notif-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 0.875rem; }
    .notif-count { font-size: 0.68rem; font-weight: 700; background: var(--color-red-soft); color: var(--color-red); border-radius: 100px; padding: 0.05rem 0.5rem; }
    .notif-list { max-height: 360px; overflow-y: auto; }
    .notif-empty { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 2rem 1rem; color: var(--color-text-muted); font-size: 0.82rem; }
    .notif-empty i { font-size: 1.5rem; color: var(--color-green); }
    .notif-item {
      display: flex; align-items: flex-start; gap: 0.65rem; width: 100%;
      padding: 0.7rem 0.85rem; border: none; background: none; cursor: pointer; text-align: left;
      border-bottom: 1px solid var(--color-border); transition: var(--transition); position: relative;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: var(--color-surface-2); }
    .notif-item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-accent); }
    .notif-ico {
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
      background: var(--color-blue-soft); color: var(--color-blue);
    }
    .notif-ico[data-type="booking-cancelled"] { background: var(--color-red-soft); color: var(--color-red); }
    .notif-ico[data-type="check-out"] { background: var(--color-yellow-soft); color: var(--color-yellow); }
    .notif-ico[data-type="check-in"], .notif-ico[data-type="booking-created"] { background: var(--color-green-soft); color: var(--color-green); }
    .notif-ico[data-type="staff-added"] { background: var(--color-purple-soft); color: var(--color-purple); }
    .notif-body { display: flex; flex-direction: column; min-width: 0; gap: 0.1rem; }
    .notif-title { font-size: 0.82rem; font-weight: 600; color: var(--color-text); }
    .notif-text { font-size: 0.76rem; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .notif-time { font-size: 0.68rem; color: var(--color-text-subtle); }
    .notif-foot { display: block; text-align: center; padding: 0.6rem; font-size: 0.78rem; font-weight: 600; border-top: 1px solid var(--color-border); color: var(--color-accent); }
    .notif-foot:hover { background: var(--color-surface-2); }

    @media (max-width: 900px) { .search-wrap { max-width: 260px; } }
    @media (max-width: 768px) {
      .topbar { left: 0 !important; padding: 0 0.75rem; gap: 0.5rem; }
      .menu-toggle { display: flex; }
      .mobile-brand { display: flex; }
      .topbar-left, .search-wrap { display: none; }
      .notif-panel, .dropdown-panel { width: min(340px, calc(100vw - 1.5rem)); }
    }
    @media (max-width: 480px) {
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
  notifSvc = inject(NotificationService);
  private searchSvc = inject(SearchService);
  private router = inject(Router);
  private host = inject(ElementRef);

  profileOpen = false;
  notifOpen = false;
  notifLoading = false;
  feed = { unreadCount: 0, items: [] as AppNotification[] };

  searchOpen = false;
  searching = false;
  q = '';
  results = { rooms: [] as SearchHit[], bookings: [] as SearchHit[], guests: [] as SearchHit[] };
  private search$ = new Subject<string>();

  isDarkTheme = false;
  user = this.auth.currentUser;
  tenant = this.auth.currentTenant;

  constructor() {
    this.themeSvc.theme$.subscribe(t => this.isDarkTheme = t === 'dark');
    this.loadFeed();

    this.search$.pipe(
      debounceTime(250),
      switchMap(term => { this.searching = true; return this.searchSvc.query(term); })
    ).subscribe({
      next: res => { if (res.success) this.results = res.data; this.searching = false; },
      error: () => { this.searching = false; }
    });
  }

  get userInitial() { return this.user?.name?.charAt(0).toUpperCase() || 'U'; }

  getPageTitle(): string {
    const path = window.location.pathname.split('/')[1];
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', rooms: 'Rooms', bookings: 'Bookings', guests: 'Guests',
      reports: 'Reports', settings: 'Settings', users: 'Staff Management', superadmin: 'Hotels'
    };
    return titles[path] || 'Dashboard';
  }

  // ── search ──
  onSearchType(v: string) {
    this.searchOpen = true;
    if (v.trim().length >= 2) this.search$.next(v.trim());
    else this.results = { rooms: [], bookings: [], guests: [] };
  }
  clearSearch() { this.q = ''; this.searchOpen = false; this.results = { rooms: [], bookings: [], guests: [] }; }
  hasResults() { return this.results.rooms.length + this.results.bookings.length + this.results.guests.length > 0; }
  goTo(h: SearchHit) { this.clearSearch(); this.router.navigate([h.link]); }

  // ── notifications ──
  loadFeed() {
    this.notifLoading = true;
    this.notifSvc.getFeed().subscribe({
      next: res => { if (res.success) this.feed = res.data; this.notifLoading = false; },
      error: () => { this.notifLoading = false; }
    });
  }
  toggleNotif(e: Event) {
    e.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.profileOpen = false;
    if (this.notifOpen) {
      this.loadFeed();
      if (this.feed.unreadCount > 0) {
        this.notifSvc.markAllRead().subscribe(() => {
          this.feed.unreadCount = 0;
          this.feed.items = this.feed.items.map(i => ({ ...i, isRead: true }));
        });
      }
    }
  }
  openNotif(n: AppNotification) {
    this.notifOpen = false;
    this.router.navigate([n.link || '/dashboard']);
  }
  timeAgo(iso: string): string {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  toggleTheme() { this.themeSvc.toggleTheme(); }
  toggleProfile(e: Event) { e.stopPropagation(); this.profileOpen = !this.profileOpen; this.notifOpen = false; }
  logout() { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target)) {
      this.profileOpen = false;
      this.notifOpen = false;
      this.searchOpen = false;
    }
  }
}
