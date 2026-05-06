import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Staff Management</h1>
        <button (click)="showForm = !showForm"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Staff
        </button>
      </div>

      <!-- Create Staff Form -->
      @if (showForm) {
        <div class="bg-white rounded-xl shadow p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">New Staff Member</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input [(ngModel)]="form.name" placeholder="Full Name"
              class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <input [(ngModel)]="form.email" placeholder="Email" type="email"
              class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <input [(ngModel)]="form.tempPassword" placeholder="Temp Password" type="password"
              class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div class="flex gap-3 mt-4">
            <button (click)="createStaff()"
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Create
            </button>
            <button (click)="showForm = false"
              class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          </div>
          @if (message()) {
            <p class="mt-3 text-sm" [class]="messageClass()">{{ message() }}</p>
          }
        </div>
      }

      <!-- Staff List -->
      <div class="bg-white rounded-xl shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
              <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
              <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Role</th>
              <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
              <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of staff(); track user.id) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-6 py-4 font-medium">{{ user.name }}</td>
                <td class="px-6 py-4 text-gray-600">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{{ user.role }}</span>
                </td>
                <td class="px-6 py-4">
                  <span [class]="user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    class="px-2 py-1 rounded text-xs">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button (click)="deleteStaff(user.id)"
                    class="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No staff members yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);

  staff    = signal<StaffUser[]>([]);
  message  = signal('');
  messageClass = signal('text-green-600');
  showForm = false;

  form = { name: '', email: '', tempPassword: '' };

  ngOnInit() { this.loadStaff(); }

  loadStaff() {
    this.http.get<ApiResponse<StaffUser[]>>(`${environment.apiUrl}/users`)
      .subscribe(res => { if (res.success) this.staff.set(res.data); });
  }

  createStaff() {
    if (!this.form.name || !this.form.email || !this.form.tempPassword) {
      this.messageClass.set('text-red-600');
      this.message.set('All fields are required');
      return;
    }
    this.http.post<ApiResponse<string>>(`${environment.apiUrl}/users`, this.form)
      .subscribe({
        next: res => {
          if (res.success) {
            this.messageClass.set('text-green-600');
            this.message.set('Staff created successfully');
            this.form = { name: '', email: '', tempPassword: '' };
            this.showForm = false;
            this.loadStaff();
          }
        },
        error: () => {
          this.messageClass.set('text-red-600');
          this.message.set('Failed to create staff');
        }
      });
  }

  deleteStaff(id: string) {
    if (!confirm('Remove this staff member?')) return;
    this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}/users/${id}`)
      .subscribe(res => { if (res.success) this.loadStaff(); });
  }
}