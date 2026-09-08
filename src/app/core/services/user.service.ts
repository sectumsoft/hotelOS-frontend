import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, StaffMember } from '../../shared/models';

export interface CreateStaffPayload {
  name: string;
  email: string;
  tempPassword: string;
  modules: string[];
}

export interface UpdateStaffPayload {
  name: string;
  modules: string[];
  isActive: boolean;
  newPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  list(): Observable<ApiResponse<StaffMember[]>> {
    return this.http.get<ApiResponse<StaffMember[]>>(this.base);
  }

  create(payload: CreateStaffPayload): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.base, payload);
  }

  update(id: string, payload: UpdateStaffPayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.base}/${id}`);
  }
}
