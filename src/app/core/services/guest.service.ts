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
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/guests`;

  getAll(search?: string, pageNumber = 1, pageSize = 20): Observable<ApiResponse<PagedResult<Guest>>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PagedResult<Guest>>>(this.base, { params });
  }
}