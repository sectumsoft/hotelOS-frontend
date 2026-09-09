import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { RoomTypeService } from '../../../core/services/room-type.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { RoomTypeOption } from '../../../shared/models';
// in room-form.component.ts — top imports
import { Observable } from 'rxjs';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="room-form-page">
      <div class="page-header">
        <div class="page-title">
          <h2>{{ isEdit ? 'Edit Room' : 'Add New Room' }}</h2>
          <p>{{ isEdit ? 'Update room details' : 'Fill in the room details below' }}</p>
        </div>
        <div class="page-actions">
          <a routerLink="/rooms" class="btn-ghost"><i class="bi bi-arrow-left"></i> Back</a>
        </div>
      </div>

      <div class="form-layout">
        <div class="form-main">
          <div class="card-surface">
            <h4 style="margin-bottom:1.25rem">Room Information</h4>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <div class="form-group">
                  <label>Room Number *</label>
                  <input type="text" class="form-input" formControlName="roomNumber" placeholder="e.g. 101" />
                  @if (f['roomNumber'].invalid && f['roomNumber'].touched) {
                    <span class="field-err">Room number required</span>
                  }
                </div>
                <div class="form-group">
                  <label>Room Type *</label>
                  <select class="form-input" formControlName="roomType">
                    <option value="">Select type</option>
                    @for (t of roomTypes; track t.id) {
                      <option [value]="t.name">{{ t.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Price per Night (₹) *</label>
                  <input type="number" class="form-input" formControlName="pricePerNight" placeholder="e.g. 149" min="1" />
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select class="form-input" formControlName="status">
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="margin-bottom:1.25rem">
                <label>Description</label>
                <textarea class="form-input" formControlName="description" placeholder="Describe the room features, view, etc."></textarea>
              </div>

              <hr class="section-divider" />
              <h5 style="margin-bottom:1rem;font-size:0.9rem">Amenities</h5>
              <div class="checkbox-grid">
                @for (amenity of amenities; track amenity) {
                  <label class="checkbox-item">
                    <input type="checkbox" [checked]="isAmenitySelected(amenity)" (change)="toggleAmenity(amenity)" />
                    <i class="bi {{ getAmenityIcon(amenity) }}"></i>
                    {{ amenity }}
                  </label>
                }
              </div>

              <!-- ───────── IMAGE UPLOAD SECTION ───────── -->
              <hr class="section-divider" />
              <h5 style="margin-bottom:1rem;font-size:0.9rem">Room Images</h5>

              <!-- drop zone -->
              <div class="upload-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
                <i class="bi bi-cloud-arrow-up" style="font-size:1.75rem;color:var(--color-text-muted)"></i>
                <p style="margin:.5rem 0 .25rem;font-size:.875rem">Click or drag images here</p>
                <p style="font-size:.75rem;color:var(--color-text-muted)">JPG, PNG, WEBP — max 5MB each</p>
                <input #fileInput type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden (change)="onFilesSelected($event)" />
              </div>

              <!-- new image previews -->
              @if (newImagePreviews.length > 0) {
                <div class="image-grid" style="margin-top:1rem">
                  @for (preview of newImagePreviews; track preview.name; let i = $index) {
                    <div class="image-thumb">
                      <img [src]="preview.url" [alt]="preview.name" />
                      @if (i === 0 && existingImages.length === 0) {
                        <span class="primary-badge">Primary</span>
                      }
                      <button type="button" class="remove-btn" (click)="removeNewImage(i)">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- existing images (edit mode) -->
              @if (existingImages.length > 0) {
                <div style="margin-top:1rem">
                  <p style="font-size:.8rem;color:var(--color-text-muted);margin-bottom:.5rem">Existing Images</p>
                  <div class="image-grid">
                    @for (img of existingImages; track img.id) {
                      <div class="image-thumb" [class.marked-delete]="isMarkedForDelete(img.imageUrl)">
                        <img [src]="getImageUrl(img.imageUrl)" [alt]="'Room image'" />
                        @if (img.isPrimary) {
                          <span class="primary-badge">Primary</span>
                        }
                        <button type="button" class="remove-btn" (click)="toggleDeleteImage(img.imageUrl)">
                          <i class="bi" [class.bi-x]="!isMarkedForDelete(img.imageUrl)" [class.bi-arrow-counterclockwise]="isMarkedForDelete(img.imageUrl)"></i>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
              <!-- ───────── END IMAGE SECTION ───────── -->

              <hr class="section-divider" />
              <div style="display:flex;gap:0.75rem;margin-top:1.5rem;justify-content:flex-end">
                <a routerLink="/rooms" class="btn-ghost">Cancel</a>
                <button type="submit" class="btn-primary-custom" [disabled]="loading || form.invalid">
                  @if (loading) { <span class="loading-spinner" style="width:14px;height:14px;border-width:2px"></span> }
                  {{ isEdit ? 'Update Room' : 'Create Room' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="form-aside">
          <div class="card-surface">
            <h5 style="margin-bottom:1rem;font-size:0.9rem">Room Preview</h5>
            <div class="preview-card">
              <div class="preview-img">
                <!-- show first new image or first existing image if available -->
                @if (newImagePreviews.length > 0) {
                  <img [src]="newImagePreviews[0].url" style="width:100%;height:100%;object-fit:cover" />
                } @else if (existingImages.length > 0) {
                    <img [src]="getImageUrl(existingImages[0].imageUrl)" style="width:100%;height:100%;object-fit:cover" />
                } @else {
                  <i class="bi bi-door-open"></i>
                }
                <span class="badge-status {{ form.get('status')?.value?.toLowerCase() || 'available' }}">
                  {{ form.get('status')?.value || 'Available' }}
                </span>
              </div>
              <div style="padding:1rem">
                <div style="font-size:0.7rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em">
                  Room {{ form.get('roomNumber')?.value || '—' }}
                </div>
                <div style="font-weight:600;margin:.25rem 0">{{ form.get('roomType')?.value || 'Select Type' }}</div>
                <div style="font-family:var(--font-mono);color:var(--color-accent);font-size:1.1rem">
                  ₹{{ form.get('pricePerNight')?.value || '0' }}<span style="font-size:.7rem;color:var(--color-text-muted);font-family:var(--font-sans)"> / night</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.25rem; align-items: start; }
    @media (max-width: 900px) { .form-layout { grid-template-columns: 1fr; } .form-aside { order: -1; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
    .field-err { font-size: .75rem; color: var(--color-red); }
    .preview-card {
      background: var(--color-surface-2); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); overflow: hidden;
    }
    .preview-img {
      height: 100px; background: var(--color-bg);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; color: var(--color-text-subtle);
      position: relative;
    }
    .preview-img img { width:100%; height:100%; object-fit:cover; }
    .badge-status { position: absolute; top: .5rem; right: .5rem; }

    /* upload zone */
    .upload-zone {
      border: 2px dashed var(--color-border); border-radius: var(--radius-md);
      padding: 2rem; text-align: center; cursor: pointer;
      transition: border-color .2s, background .2s;
    }
    .upload-zone:hover { border-color: var(--color-accent); background: var(--color-surface-2); }

    /* image grid */
    .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: .75rem; }
    .image-thumb {
      position: relative; aspect-ratio: 1; border-radius: var(--radius-sm);
      overflow: hidden; border: 2px solid var(--color-border);
    }
    .image-thumb img { width:100%; height:100%; object-fit:cover; }
    .image-thumb.marked-delete { opacity: .4; border-color: var(--color-red); }
    .remove-btn {
      position: absolute; top: .25rem; right: .25rem;
      background: rgba(0,0,0,.6); color: #fff; border: none;
      border-radius: 50%; width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .75rem; padding: 0;
    }
    .primary-badge {
      position: absolute; bottom: .25rem; left: .25rem;
      background: var(--color-accent); color: #fff;
      font-size: .6rem; padding: .15rem .4rem; border-radius: 999px;
    }
  `]
})
export class RoomFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roomSvc = inject(RoomService);
  private roomTypeSvc = inject(RoomTypeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  roomTypes: RoomTypeOption[] = [];

  form = this.fb.group({
    roomNumber: ['', Validators.required],
    roomType: ['', Validators.required],
    pricePerNight: [null as number | null, [Validators.required, Validators.min(1)]],
    description: [''],
    status: ['Available']
  });

  amenities = ['TV', 'AC', 'WiFi', 'MiniBar', 'Parking', 'Room Service'];
  selectedAmenities: string[] = [];
  loading = false;
  isEdit = false;
  roomId = '';

  // ── image state ──
  newImageFiles: File[] = [];
  newImagePreviews: { name: string; url: string }[] = [];
  existingImages: { id: string; imageUrl: string; isPrimary: boolean }[] = [];
  deleteImageUrls: string[] = [];

  get f() { return this.form.controls; }

  ngOnInit() {
    this.roomTypeSvc.list().subscribe({
      next: res => { if (res.success) this.roomTypes = res.data; },
      error: () => {}
    });
    this.roomId = this.route.snapshot.params['id'];
    if (this.roomId) { this.isEdit = true; this.loadRoom(); }
  }

  loadRoom() {
    this.roomSvc.getById(this.roomId).subscribe({
      next: res => {
        if (res.success) {
          const r = res.data;
          this.form.patchValue({
            roomNumber: r.roomNumber, roomType: r.roomType,
            pricePerNight: r.pricePerNight, description: r.description, status: r.status
          });
          this.selectedAmenities = r.amenities || [];
          this.existingImages = r.images || [];   // <-- load existing images
        }
      }
    });
  }

  // ── image handlers ──
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowed.includes(file.type)) { this.toast.error(`${file.name} is not a supported image type`); continue; }
      if (file.size > 5 * 1024 * 1024) { this.toast.error(`${file.name} exceeds 5MB`); continue; }
      this.newImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => this.newImagePreviews.push({ name: file.name, url: e.target!.result as string });
      reader.readAsDataURL(file);
    }
  }

  removeNewImage(index: number) {
    this.newImageFiles.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
  }

  toggleDeleteImage(url: string) {
    const idx = this.deleteImageUrls.indexOf(url);
    if (idx > -1) this.deleteImageUrls.splice(idx, 1);
    else this.deleteImageUrls.push(url);
  }

  isMarkedForDelete(url: string) { return this.deleteImageUrls.includes(url); }

  // ── amenity handlers (unchanged) ──
  isAmenitySelected(a: string) { return this.selectedAmenities.includes(a); }
  toggleAmenity(a: string) {
    const idx = this.selectedAmenities.indexOf(a);
    if (idx > -1) this.selectedAmenities.splice(idx, 1);
    else this.selectedAmenities.push(a);
  }
  getAmenityIcon(a: string): string {
    const icons: Record<string, string> = { TV: 'bi-tv', AC: 'bi-thermometer-snow', WiFi: 'bi-wifi', MiniBar: 'bi-cup-straw', Parking: 'bi-p-square', 'Room Service': 'bi-bell' };
    return icons[a] || 'bi-check-circle';
  }
   getImageUrl(url: string): string {
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }
  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    // build FormData instead of plain JSON
    const fd = new FormData();
    fd.append('roomNumber', this.form.value.roomNumber!);
    fd.append('roomType', this.form.value.roomType!);
    fd.append('pricePerNight', String(this.form.value.pricePerNight!));
    fd.append('description', this.form.value.description || '');
    fd.append('status', this.form.value.status!);
    this.selectedAmenities.forEach(a => fd.append('amenities', a));

    if (this.isEdit) {
      // new image files
      this.newImageFiles.forEach(f => fd.append('newImages', f, f.name));
      // urls to delete
      this.deleteImageUrls.forEach(u => fd.append('deleteImageUrls', u));
    } else {
      // create: just append image files
      this.newImageFiles.forEach(f => fd.append('images', f, f.name));
    }

const req: Observable<any> = this.isEdit ? this.roomSvc.update(this.roomId, fd) : this.roomSvc.create(fd);
    req.subscribe({
      next: res => {
        if (res.success) {
          this.toast.success(this.isEdit ? 'Room updated!' : 'Room created!');
          this.router.navigate(['/rooms']);
        }
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to save room'); this.loading = false; }
    });
  }
}