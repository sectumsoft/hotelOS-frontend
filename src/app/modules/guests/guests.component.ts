import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuestService, Guest } from '../../core/services/guest.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="guests-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Guests</h2>
          <p>{{ totalCount }} registered guests</p>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-bar" style="flex:1;max-width:320px">
          <i class="bi bi-search"></i>
          <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch($event)"
            placeholder="Search guests…" class="form-input" style="padding-left:2.25rem" />
        </div>
      </div>

      @if (loading) {
        <div class="card-surface" style="padding:2rem;text-align:center;color:var(--color-text-muted)">
          <span class="loading-spinner"></span>
        </div>
      } @else if (guests.length === 0) {
        <div class="empty-state">
          <i class="bi bi-people"></i>
          <h4>No guests found</h4>
          <p>Guests are added automatically when bookings are created.</p>
        </div>
      } @else {
        <div class="card-surface" style="padding:0;overflow:hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Total Stays</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              @for (g of guests; track g.id) {
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:.75rem">
                      <div style="width:32px;height:32px;background:var(--color-accent-soft);color:var(--color-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0">
                        {{ g.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div style="font-weight:600">{{ g.name }}</div>
                        <div style="font-size:.75rem;color:var(--color-text-muted)">{{ g.email || '—' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ g.phone }}</td>
                  <td style="color:var(--color-text-muted)">{{ g.address || '—' }}</td>
                  <td><span style="font-family:var(--font-mono);font-weight:600">{{ g.totalStays }}</span></td>
                  <td style="color:var(--color-text-muted)">{{ g.createdAt | date:'MMM d, y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- pagination -->
        <div class="pagination-wrapper">
          <span class="pagination-info">Showing {{ (pageNumber-1)*pageSize+1 }}–{{ Math.min(pageNumber*pageSize, totalCount) }} of {{ totalCount }}</span>
          <div class="pagination-controls">
            <button (click)="prevPage()" [disabled]="pageNumber===1"><i class="bi bi-chevron-left"></i></button>
            @for (p of pages; track p) {
              <button [class.active]="p===pageNumber" (click)="goPage(p)">{{ p }}</button>
            }
            <button (click)="nextPage()" [disabled]="pageNumber===totalPages"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      }
    </div>
  `
})
export class GuestsComponent implements OnInit {
  private guestSvc = inject(GuestService);
  Math = Math;

  guests: Guest[] = [];
  loading = false;
  totalCount = 0;
  totalPages = 1;
  pageNumber = 1;
  pageSize = 20;
  search = '';

  private searchSubject = new Subject<string>();

  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  ngOnInit() {
    // debounce search so API isn't called on every keystroke
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(s => {
      this.pageNumber = 1;
      this.loadGuests();
    });
    this.loadGuests();
  }

  onSearch(val: string) { this.searchSubject.next(val); }

  loadGuests() {
    this.loading = true;
    this.guestSvc.getAll(this.search, this.pageNumber, this.pageSize).subscribe({
      next: res => {
        if (res.success) {
          this.guests = res.data.items;
          this.totalCount = res.data.totalCount;
          this.totalPages = res.data.totalPages;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  prevPage() { if (this.pageNumber > 1) { this.pageNumber--; this.loadGuests(); } }
  nextPage() { if (this.pageNumber < this.totalPages) { this.pageNumber++; this.loadGuests(); } }
  goPage(p: number) { this.pageNumber = p; this.loadGuests(); }
}