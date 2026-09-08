import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, RoomTypeOption } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class RoomTypeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roomtypes`;

  list(): Observable<ApiResponse<RoomTypeOption[]>> {
    return this.http.get<ApiResponse<RoomTypeOption[]>>(this.base);
  }

  create(name: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.base, { name });
  }

  update(id: string, name: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${id}`, { name });
  }

  remove(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/${id}`);
  }
}
