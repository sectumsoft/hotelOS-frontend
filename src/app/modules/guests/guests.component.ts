import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, merge, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { GuestService, Guest, GuestDetail } from '../../core/services/guest.service';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="guests-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Guests</h2>
          <p>{{ totalCount() }} registered guest{{ totalCount() === 1 ? '' : 's' }}</p>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-bar" style="flex:1;max-width:360px">
          <i class="bi bi-search"></i>
          <input type="text" [(ngModel)]="search" (keyup.enter)="runSearch()"
                 (ngModelChange)="onType($event)"
                 placeholder="Search by name, phone or email…" class="form-input" style="padding-left:2.25rem" />
        </div>
        <button class="btn-primary-custom" (click)="runSearch()"><i class="bi bi-search"></i> Search</button>
        @if (search) {
          <button class="btn-ghost" (click)="clearSearch()"><i class="bi bi-x-lg"></i> Clear</button>
        }
      </div>

      @if (loading()) {
        <div class="card-surface" style="padding:2rem;text-align:center;color:var(--color-text-muted)">
          <span class="loading-spinner"></span>
        </div>
      } @else if (guests().length === 0) {
        <div class="empty-state">
          <i class="bi bi-people"></i>
          <h4>No guests found</h4>
          <p>{{ search ? 'Try a different name or number.' : 'Guests appear here once bookings are created.' }}</p>
        </div>
      } @else {
        <div class="card-surface" style="padding:0;overflow:hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th>Guest</th><th>Contact</th><th>Stays</th><th>ID</th><th>Since</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (g of guests(); track g.id) {
                <tr class="row-click" (click)="open(g)">
                  <td>
                    <div style="display:flex;align-items:center;gap:.75rem">
                      <div class="avatar-sm">{{ initial(g.name) }}</div>
                      <div>
                        <div style="font-weight:600">{{ g.name }}</div>
                        <div style="font-size:.75rem;color:var(--color-text-muted)">{{ g.email || '—' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ g.phone }}</td>
                  <td><span style="font-family:var(--font-mono);font-weight:600">{{ g.totalStays }}</span></td>
                  <td>
                    @if (g.hasIdProof) { <span class="badge-status checkedin">On file</span> }
                    @else { <span style="color:var(--color-text-subtle);font-size:.8rem">—</span> }
                  </td>
                  <td style="color:var(--color-text-muted)">{{ g.createdAt | date:'MMM d, y' }}</td>
                  <td style="text-align:right;color:var(--color-text-muted)"><i class="bi bi-chevron-right"></i></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination-wrapper">
          <span class="pagination-info">
            Showing {{ (pageNumber()-1)*pageSize+1 }}–{{ Math.min(pageNumber()*pageSize, totalCount()) }} of {{ totalCount() }}
          </span>
          <div class="pagination-controls">
            <button (click)="prevPage()" [disabled]="pageNumber()===1"><i class="bi bi-chevron-left"></i></button>
            @for (p of pages(); track p) {
              <button [class.active]="p===pageNumber()" (click)="goPage(p)">{{ p }}</button>
            }
            <button (click)="nextPage()" [disabled]="pageNumber()===totalPages()"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      }
    </div>

    <!-- GUEST 360 -->
    @if (detailOpen()) {
      <div class="modal-overlay" (click)="detailOpen.set(false)">
        <div class="modal-panel g360" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-person-vcard"></i> Guest 360</h3>
            <button class="modal-close" (click)="detailOpen.set(false)"><i class="bi bi-x"></i></button>
          </div>

          <div class="modal-body" style="max-height:78vh;overflow-y:auto">
            @if (detailLoading()) {
              <div style="padding:2rem;text-align:center;color:var(--color-text-muted)"><span class="loading-spinner"></span></div>
            } @else if (detail()) {
              @if (detail(); as d) {

              <div class="g360-head">
                <div class="avatar-lg">{{ initial(d.guest.name) }}</div>
                <div>
                  <div style="font-size:1.1rem;font-weight:700">{{ d.guest.name }}</div>
                  <div style="color:var(--color-text-muted);font-size:.85rem">
                    <i class="bi bi-telephone"></i> {{ d.guest.phone }}
                    @if (d.guest.email) { &nbsp;·&nbsp; <i class="bi bi-envelope"></i> {{ d.guest.email }} }
                  </div>
                  @if (d.guest.address) {
                    <div style="color:var(--color-text-muted);font-size:.8rem;margin-top:.15rem"><i class="bi bi-geo-alt"></i> {{ d.guest.address }}</div>
                  }
                  <div style="color:var(--color-text-subtle);font-size:.72rem;margin-top:.15rem">Guest since {{ d.guest.createdAt | date:'MMM y' }}</div>
                </div>
              </div>

              <div class="g360-stats">
                <div class="stat"><div class="v">{{ d.stats.totalBookings }}</div><div class="l">Bookings</div></div>
                <div class="stat"><div class="v">{{ d.stats.totalNights }}</div><div class="l">Nights</div></div>
                <div class="stat"><div class="v">{{ d.stats.totalSpent | currency:'INR':'symbol':'1.0-0' }}</div><div class="l">Total spent</div></div>
                <div class="stat"><div class="v" [style.color]="d.stats.outstanding > 0 ? 'var(--color-red)' : 'var(--color-green)'">{{ d.stats.outstanding | currency:'INR':'symbol':'1.0-0' }}</div><div class="l">Outstanding</div></div>
              </div>

              <!-- primary guest ID proof -->
              <div class="g360-section">
                <div class="g360-section-h">Identity</div>
                @if (d.guest.idProofUrl || d.guest.idProofNumber) {
                  <div class="id-card">
                    <div>
                      <div style="font-size:.75rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em">{{ d.guest.idProofType || 'ID' }}</div>
                      <div style="font-family:var(--font-mono);font-weight:600">{{ d.guest.idProofNumber || '—' }}</div>
                    </div>
                    <ng-container *ngTemplateOutlet="proofThumb; context:{ url: d.guest.idProofUrl }"></ng-container>
                  </div>
                } @else {
                  <p class="muted-sm">No ID captured yet — it's collected at check-in.</p>
                }
              </div>

              <!-- booking history + companions -->
              <div class="g360-section">
                <div class="g360-section-h">Stay history</div>
                @if (d.bookings.length === 0) {
                  <p class="muted-sm">No bookings yet.</p>
                }
                @for (b of d.bookings; track b.bookingNumber) {
                  <div class="stay">
                    <div class="stay-top">
                      <div>
                        <span style="font-family:var(--font-mono);font-weight:700">{{ b.bookingNumber }}</span>
                        <span class="badge-status" [class.confirmed]="b.status==='Confirmed'" [class.checkedin]="b.status==='CheckedIn'"
                              [class.cancelled]="b.status==='Cancelled' || b.status==='CheckedOut'">{{ b.status }}</span>
                      </div>
                      <div style="font-family:var(--font-mono);color:var(--color-accent);font-weight:600">{{ b.totalAmount | currency:'INR':'symbol':'1.0-0' }}</div>
                    </div>
                    <div class="stay-meta">
                      Room {{ b.roomNumber }} · {{ b.roomType }} &nbsp;|&nbsp;
                      {{ b.checkInDate | date:'MMM d' }} → {{ b.checkOutDate | date:'MMM d, y' }} ({{ b.nights }}n)
                      @if (b.balanceAmount > 0) { &nbsp;|&nbsp; <span style="color:var(--color-red)">Balance {{ b.balanceAmount | currency:'INR':'symbol':'1.0-0' }}</span> }
                    </div>

                    @if (b.companions.length > 0) {
                      <div class="companions">
                        <div class="companions-h">Accompanying guests ({{ b.companions.length }})</div>
                        @for (c of b.companions; track c.name + c.idProofNumber) {
                          <div class="companion">
                            <div class="companion-info">
                              <div style="font-weight:600;font-size:.85rem">{{ c.name }}</div>
                              <div style="font-size:.75rem;color:var(--color-text-muted)">
                                @if (c.phone) { {{ c.phone }} &nbsp;·&nbsp; }
                                {{ c.idProofType || 'ID' }}: <span style="font-family:var(--font-mono)">{{ c.idProofNumber || '—' }}</span>
                              </div>
                            </div>
                            <ng-container *ngTemplateOutlet="proofThumb; context:{ url: c.idProofUrl }"></ng-container>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              }
            } @else {
              <p class="muted-sm">Could not load this guest.</p>
            }
          </div>
        </div>
      </div>
    }

    <!-- reusable ID-proof thumbnail -->
    <ng-template #proofThumb let-url="url">
      @if (url) {
        @if (isPdf(url)) {
          <a class="proof-pdf" [href]="fileUrl(url)" target="_blank" rel="noopener">
            <i class="bi bi-file-earmark-pdf"></i> Open PDF
          </a>
        } @else {
          <img class="proof-img" [src]="fileUrl(url)" alt="ID proof"
               (click)="lightbox.set(fileUrl(url)); $event.stopPropagation()"
               (error)="onImgError($event)" />
        }
      } @else {
        <span class="proof-none">No file</span>
      }
    </ng-template>

    <!-- LIGHTBOX -->
    @if (lightbox()) {
      <div class="lightbox" (click)="lightbox.set(null)">
        <img [src]="lightbox()!" alt="ID proof" (error)="lightbox.set(null)" />
        <button class="lightbox-close"><i class="bi bi-x-lg"></i></button>
      </div>
    }
  `,
  styles: [`
    .row-click { cursor: pointer; }
    .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: var(--color-accent-soft); color: var(--color-accent);
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .8rem; flex-shrink: 0; }
    .avatar-lg { width: 56px; height: 56px; border-radius: 50%; background: var(--color-accent-soft); color: var(--color-accent);
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.4rem; flex-shrink: 0; }
    .muted-sm { font-size: .82rem; color: var(--color-text-muted); }

    .g360 { max-width: 680px; }
    .g360-head { display: flex; gap: 1rem; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); }

    .g360-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; margin: 1rem 0; }
    .g360-stats .stat { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: .7rem .6rem; text-align: center; }
    .g360-stats .v { font-family: var(--font-mono); font-weight: 700; font-size: 1rem; }
    .g360-stats .l { font-size: .68rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; margin-top: .15rem; }

    .g360-section { margin-top: 1.1rem; }
    .g360-section-h { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); margin-bottom: .5rem; }

    .id-card { display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: .75rem .9rem; }

    .stay { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: .8rem; margin-bottom: .6rem; }
    .stay-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .stay-top .badge-status { margin-left: .5rem; }
    .stay-meta { font-size: .78rem; color: var(--color-text-muted); margin-top: .3rem; }

    .companions { margin-top: .6rem; padding-top: .6rem; border-top: 1px dashed var(--color-border); }
    .companions-h { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted); margin-bottom: .4rem; }
    .companion { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .35rem 0; }

    .proof-img { width: 54px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); cursor: zoom-in; background: var(--color-surface-2); }
    .proof-pdf { font-size: .78rem; color: var(--color-accent); display: inline-flex; align-items: center; gap: .3rem; white-space: nowrap; }
    .proof-none { font-size: .72rem; color: var(--color-text-subtle); }

    .lightbox { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,.9); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .lightbox img { max-width: 100%; max-height: 100%; border-radius: 8px; }
    .lightbox-close { position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; border-radius: 50%; border: none;
      background: rgba(255,255,255,.15); color: #fff; cursor: pointer; font-size: 1rem; }

    @media (max-width: 640px) {
      .g360-stats { grid-template-columns: repeat(2, 1fr); }
      .g360-head { flex-direction: column; }
    }
  `]
})
export class GuestsComponent implements OnInit {
  private guestSvc = inject(GuestService);
  Math = Math;

  guests = signal<Guest[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  totalPages = signal(1);
  pageNumber = signal(1);
  pageSize = 20;
  search = '';

  detailOpen = signal(false);
  detailLoading = signal(false);
  detail = signal<GuestDetail | null>(null);
  lightbox = signal<string | null>(null);

  private query$ = new Subject<void>();
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  fileUrl = (p?: string) => this.guestSvc.fileUrl(p);
  isPdf = (u?: string) => !!u && /\.pdf($|\?)/i.test(u);
  initial = (n: string) => (n?.trim()?.[0] || '?').toUpperCase();

  ngOnInit() {
    // instant first load; debounce only the subsequent searches/paging
    merge(of(void 0), this.query$.pipe(debounceTime(350))).pipe(
      switchMap(() => {
        this.loading.set(true);
        return this.guestSvc.getAll(this.search.trim(), this.pageNumber(), this.pageSize);
      })
    ).subscribe({
      next: res => {
        if (res.success) {
          this.guests.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
          this.totalPages.set(res.data.totalPages || 1);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onType(_: string) { this.pageNumber.set(1); this.query$.next(); }
  runSearch() { this.pageNumber.set(1); this.query$.next(); }
  clearSearch() { this.search = ''; this.pageNumber.set(1); this.query$.next(); }

  prevPage() { if (this.pageNumber() > 1) { this.pageNumber.update(p => p - 1); this.query$.next(); } }
  nextPage() { if (this.pageNumber() < this.totalPages()) { this.pageNumber.update(p => p + 1); this.query$.next(); } }
  goPage(p: number) { this.pageNumber.set(p); this.query$.next(); }

  open(g: Guest) {
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.guestSvc.getById(g.id).subscribe({
      next: res => { this.detail.set(res.success ? res.data : null); this.detailLoading.set(false); },
      error: () => this.detailLoading.set(false)
    });
  }

  onImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.replaceWith(Object.assign(document.createElement('span'), {
      className: 'proof-none', textContent: 'preview unavailable'
    }));
  }
}
