import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';

export interface SearchHit {
  type: 'room' | 'booking' | 'guest';
  label: string;
  sub: string;
  link: string;
}

export interface SearchResult {
  rooms: SearchHit[];
  bookings: SearchHit[];
  guests: SearchHit[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);

  query(q: string): Observable<ApiResponse<SearchResult>> {
    return this.http.get<ApiResponse<SearchResult>>(`${environment.apiUrl}/search`, {
      params: new HttpParams().set('q', q)
    });
  }
}
