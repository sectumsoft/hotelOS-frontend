import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { RoomTypeService } from '../../../core/services/room-type.service';
import { ToastService } from '../../../core/services/toast.service';
import { Room, RoomFilter, RoomStatus, RoomType, RoomTypeOption } from '../../../shared/models';
import { environment } from '../../../../environments/environment';
import { RoomImportComponent } from './room-import.component';

@Component({
  selector: 'app-rooms-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RoomImportComponent],
  template: `
    <div class="rooms-page">
      <div class="page-header">
        <div class="page-title">
          <h2>Rooms</h2>
          <p>{{ totalCount }} rooms managed</p>
        </div>
        <div class="page-actions">
          <div class="view-toggle">
            <button [class.active]="viewMode==='grid'" (click)="viewMode='grid'"><i class="bi bi-grid-3x3-gap"></i></button>
            <button [class.active]="viewMode==='list'" (click)="viewMode='list'"><i class="bi bi-list-ul"></i></button>
          </div>
          <button class="btn-ghost" (click)="showImport = true">
            <i class="bi bi-file-earmark-spreadsheet"></i> Import Excel
          </button>
          <a routerLink="/rooms/add" class="btn-primary-custom">
            <i class="bi bi-plus-lg"></i> Add Room
          </a>
        </div>
      </div>

      @if (showImport) {
        <app-room-import (close)="showImport = false" (imported)="onImported()" />
      }

      <div class="filters-bar">
        <div class="search-bar" style="flex:1;max-width:320px">
          <i class="bi bi-search"></i>
          <input type="text" [(ngModel)]="filter.search" (ngModelChange)="onFilterChange()" placeholder="Search rooms…" class="form-input" style="padding-left:2.25rem" />
        </div>
        <label class="fbar-field">
          <span>Status</span>
          <select class="form-input" [(ngModel)]="filter.status" (ngModelChange)="onFilterChange()">
            <option value="">All status</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </label>
        <label class="fbar-field">
          <span>Type</span>
          <select class="form-input" [(ngModel)]="filter.roomType" (ngModelChange)="onFilterChange()">
            <option value="">All types</option>
            @for (t of roomTypes; track t.id) {
              <option [value]="t.name">{{ t.name }}</option>
            }
          </select>
        </label>
        <div class="filter-summary">
          <span class="badge-status available">{{ availableCount }} Available</span>
          <span class="badge-status occupied">{{ occupiedCount }} Occupied</span>
          <span class="badge-status maintenance">{{ maintenanceCount }} Maintenance</span>
        </div>
      </div>

      @if (loading) {
        <div class="rooms-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton" style="height:320px;border-radius:var(--radius-lg)"></div>
          }
        </div>
      } @else if (loadError) {
        <div class="empty-state">
          <i class="bi bi-wifi-off"></i>
          <h4>Couldn’t load rooms</h4>
          <p>The server didn’t respond. Check your connection and try again.</p>
          <button class="btn-primary-custom" style="margin-top:0.75rem" (click)="loadRooms()">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      } @else if (rooms.length === 0) {
        <div class="empty-state">
          <i class="bi bi-door-open"></i>
          <h4>No rooms found</h4>
          <p>Try adjusting your filters or add a new room.</p>
        </div>
      } @else {
        @if (viewMode === 'grid') {
          <div class="rooms-grid">
            @for (room of rooms; track room.id) {
              <div class="room-card">
                <div class="room-image">
<img [src]="room.images?.length ? getImageUrl(room.images[0].imageUrl) : getRoomPlaceholder(room.roomType)" [alt]="room.roomType" />
                 <div class="room-status">
                    <span class="badge-status {{ room.status.toLowerCase() }}">{{ room.status }}</span>
                  </div>
                </div>
                <div class="room-body">
                  <div class="room-number">Room {{ room.roomNumber }}</div>
                  <div class="room-name">{{ room.roomType }}</div>
                  <div class="room-price">\₹{{ room.pricePerNight }}<span> / night</span></div>
                  <div class="room-amenities">
                    @for (a of room.amenities.slice(0,4); track a) {
                      <span class="amenity-tag">{{ a }}</span>
                    }
                    @if (room.amenities.length > 4) {
                      <span class="amenity-tag">+{{ room.amenities.length - 4 }}</span>
                    }
                  </div>
                  <div class="room-actions">
                    <a [routerLink]="['/rooms/edit', room.id]" class="btn-ghost" style="flex:1;justify-content:center;font-size:0.8rem;padding:0.45rem">
                      <i class="bi bi-pencil"></i> Edit
                    </a>
                    <button class="btn-danger-ghost" style="flex:1;justify-content:center;font-size:0.8rem;padding:0.45rem" (click)="confirmDelete(room)">
                      <i class="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="card-surface" style="padding:0;overflow:hidden">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Price/Night</th>
                  <th>Amenities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (room of rooms; track room.id) {
                  <tr>
                    <td><strong>{{ room.roomNumber }}</strong></td>
                    <td>{{ room.roomType }}</td>
                    <td><span style="font-family:var(--font-mono);color:var(--color-accent)">₹{{ room.pricePerNight }}</span></td>
                    <td>{{ room.amenities ? room.amenities.slice(0,3).join(', ') : '' }}</td>
                    <td><span class="badge-status {{ room.status.toLowerCase() }}">{{ room.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:0.5rem">
                        <a [routerLink]="['/rooms/edit', room.id]" class="btn-ghost" style="padding:0.3rem 0.75rem;font-size:0.8rem">Edit</a>
                        <button class="btn-danger-ghost" style="padding:0.3rem 0.75rem;font-size:0.8rem" (click)="confirmDelete(room)">Delete</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      @if (!loadError && !loading && rooms.length > 0) {
        <div class="pagination-wrapper">
          <span class="pagination-info">Showing {{ (filter.pageNumber-1)*filter.pageSize+1 }}–{{ Math.min(filter.pageNumber*filter.pageSize, totalCount) }} of {{ totalCount }}</span>
          <div class="pagination-controls">
            <button (click)="prevPage()" [disabled]="filter.pageNumber===1"><i class="bi bi-chevron-left"></i></button>
            @for (p of pages; track p) {
              <button [class.active]="p===filter.pageNumber" (click)="goPage(p)">{{ p }}</button>
            }
            <button (click)="nextPage()" [disabled]="filter.pageNumber===totalPages"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      }
    </div>

    @if (deleteTarget) {
      <div class="modal-overlay" (click)="deleteTarget=null">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Room</h3>
            <button class="modal-close" (click)="deleteTarget=null"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete <strong>Room {{ deleteTarget.roomNumber }}</strong>? This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="deleteTarget=null">Cancel</button>
            <button class="btn-danger-ghost" style="border-color:var(--color-red);color:var(--color-red)" (click)="deleteRoom()">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .view-toggle {
      display: flex;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      button {
        padding: 0.45rem 0.75rem;
        border: none; background: none;
        color: var(--color-text-muted);
        cursor: pointer; font-size: 0.9rem;
        transition: var(--transition);
        &.active { background: var(--color-surface-2); color: var(--color-text); }
        &:hover:not(.active) { color: var(--color-text); }
      }
    }
    .filter-summary { display: flex; gap: 0.5rem; margin-left: auto; }
  `]
})
export class RoomsListComponent implements OnInit {
  private roomSvc = inject(RoomService);
  private roomTypeSvc = inject(RoomTypeService);
  private toast = inject(ToastService);
  Math = Math;

  roomTypes: RoomTypeOption[] = [];
  rooms: Room[] = [];
  loading = true;
  loadError = false;
  viewMode: 'grid' | 'list' = 'grid';
  deleteTarget: Room | null = null;
  showImport = false;
  totalCount = 0;
  totalPages = 1;

  filter: RoomFilter = { pageNumber: 1, pageSize: 12, search: '', status: '' as any, roomType: '' as any };

  /** Set just before a pure page-nav reload so loadRooms() can reuse the cached
   *  total instead of asking the server to COUNT the same filter again. */
  private pageNavOnly = false;

  get availableCount() { return this.rooms.filter(r => r.status === 'Available').length; }
  get occupiedCount() { return this.rooms.filter(r => r.status === 'Occupied').length; }
  get maintenanceCount() { return this.rooms.filter(r => r.status === 'Maintenance').length; }
  get pages(): number[] { return Array.from({length: this.totalPages}, (_, i) => i+1); }

  ngOnInit() {
    this.loadRooms();
    this.roomTypeSvc.list().subscribe({
      next: res => { if (res.success) this.roomTypes = res.data; },
      error: () => {}
    });
  }

  loadRooms() {
    this.loading = true;
    const skipCount = this.pageNavOnly && this.totalCount > 0;
    this.pageNavOnly = false;
    this.filter.skipCount = skipCount;
    this.roomSvc.getAll(this.filter).subscribe({
      next: res => {
        if (res.success) {
          this.rooms = res.data.items;
          if (!skipCount) {
            this.totalCount = res.data.totalCount;
            this.totalPages = res.data.totalPages;
          }
          this.loadError = false;
        }
        this.loading = false;
      },
      error: () => {
        this.rooms = [];
        this.totalCount = 0;
        this.totalPages = 1;
        this.loadError = true;
        this.loading = false;
        this.toast.error('Could not load rooms. Please try again.');
      }
    });
  }

  onFilterChange() { this.filter.pageNumber = 1; this.loadRooms(); }
  prevPage() { if (this.filter.pageNumber > 1) { this.filter.pageNumber--; this.pageNavOnly = true; this.loadRooms(); } }
  nextPage() { if (this.filter.pageNumber < this.totalPages) { this.filter.pageNumber++; this.pageNavOnly = true; this.loadRooms(); } }
  goPage(p: number) { this.filter.pageNumber = p; this.pageNavOnly = true; this.loadRooms(); }

  confirmDelete(room: Room) { this.deleteTarget = room; }

  onImported() {
    this.filter.pageNumber = 1;
    this.loadRooms();
  }

  deleteRoom() {
    if (!this.deleteTarget) return;
    this.roomSvc.delete(this.deleteTarget.id).subscribe({
      next: () => { this.toast.success('Room deleted'); this.deleteTarget = null; this.loadRooms(); },
      error: () => { this.toast.error('Failed to delete room'); }
    });
  }
getImageUrl(url: string): string {
  return `${environment.apiUrl.replace('/api', '')}${url}`;
}
  getRoomPlaceholder(type: RoomType): string {
    const colors: Record<string,string> = { Standard:'1e293b', Deluxe:'1e1b4b', Suite:'1a0a00' };
    return `https://placehold.co/400x200/${colors[type] || '1e293b'}/6b7280?text=${type}`;
  }

}
