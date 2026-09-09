import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../../shared/models';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalStays: number;
  hasIdProof?: boolean;
  createdAt: string;
}

export interface GuestCompanion {
  name: string;
  phone?: string;
  idProofType?: string;
  idProofNumber?: string;
  idProofUrl?: string;
}

export interface GuestBookingRow {
  bookingNumber: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: string;
  totalAmount: number;
  balanceAmount: number;
  companions: GuestCompanion[];
}

export interface GuestDetail {
  guest: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
    totalStays: number;
    createdAt: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofUrl?: string;
  };
  stats: {
    totalBookings: number;
    totalNights: number;
    totalSpent: number;
    outstanding: number;
    lastStay?: string;
  };
  bookings: GuestBookingRow[];
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/guests`;

  /** Base host for static uploads (strips the trailing /api). */
  readonly fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  getAll(search?: string, pageNumber = 1, pageSize = 20): Observable<ApiResponse<PagedResult<Guest>>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PagedResult<Guest>>>(this.base, { params });
  }

  getById(id: string): Observable<ApiResponse<GuestDetail>> {
    return this.http.get<ApiResponse<GuestDetail>>(`${this.base}/${id}`);
  }

  /** Absolute URL for an uploaded ID proof, or '' if none. */
  fileUrl(path?: string): string {
    if (!path) return '';
    return /^https?:\/\//.test(path) ? path : `${this.fileBase}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
