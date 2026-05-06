import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, Room, RoomFilter } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/rooms`;

  getAll(filter: RoomFilter): Observable<ApiResponse<PagedResult<Room>>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.roomType) params = params.set('roomType', filter.roomType);
    return this.http.get<ApiResponse<PagedResult<Room>>>(this.base, { params });
  }

  getById(id: string): Observable<ApiResponse<Room>> {
    return this.http.get<ApiResponse<Room>>(`${this.base}/${id}`);
  }

  // FormData instead of CreateRoomRequest — NO Content-Type header
  create(fd: FormData): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.base, fd);
  }

  update(id: string, fd: FormData): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.base}/${id}`, fd);
  }

  delete(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/${id}`);
  }
}