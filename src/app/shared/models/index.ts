export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  plan: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
  tenant: Tenant;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  avatar?: string;
}

export type RoomType = 'Standard' | 'Deluxe' | 'Suite';
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface RoomImage {
  id: string;
  roomId: string;
  imageUrl: string;
  isPrimary: boolean;
}


export interface Room {
  id: string;
  tenantId: string;
  roomNumber: string;
  roomType: RoomType;
  pricePerNight: number;
  description?: string;
  status: RoomStatus;
  amenities: string[];
  images: RoomImage[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomImage {
  id: string;
  roomId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface CreateRoomRequest {
  roomNumber: string;
  roomType: RoomType;
  pricePerNight: number;
  description?: string;
  status: RoomStatus;
  amenities: string[];
}

export interface RoomFilter {
  search?: string;
  status?: RoomStatus;
  roomType?: RoomType;
  pageNumber: number;
  pageSize: number;
}

export interface BulkRoomRow {
  row: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number | null;
  description?: string;
  status?: string;
  amenities?: string[];
}

export interface BulkImportError {
  row: number;
  roomNumber: string;
  reason: string;
}

export interface BulkImportResult {
  added: number;
  skipped: BulkImportError[];
}

export interface Guest {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  idProofUrl?: string;
  totalStays: number;
  createdAt: string;
}

export type BookingStatus = 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';

export interface Booking {
  id: string;
  bookingNumber: string;
  tenantId: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  guestAddress?: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  numberOfGuests: number;
  totalAmount: number;
  advancePaid: boolean;
  advanceAmount?: number;
  balanceAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  guestName: string;
  guestPhone: string;
  guestAddress?: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  advancePaid: boolean;
  advanceAmount?: number;
}

export interface CheckInRequest {
  bookingId: string;
  amountReceived: number;
}

export interface BookingFilter {
  search?: string;
  status?: BookingStatus;
  checkInFrom?: string;
  checkInTo?: string;
  pageNumber: number;
  pageSize: number;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  todayBookings: number;
  revenueToday: number;
  occupancyRate: number;
  revenueChange: number;
  bookingChange: number;
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
}

export interface OccupancyDataPoint {
  date: string;
  rate: number;
}

export interface BookingSourceData {
  source: string;
  count: number;
  percentage: number;
}

export interface ReportFilter {
  dateFrom: string;
  dateTo: string;
  roomType?: RoomType;
  status?: BookingStatus;
  pageNumber: number;
  pageSize: number;
}

export interface ReportRow {
  bookingNumber: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  status: BookingStatus;
}
export interface BillItem {
  description: string;
  category: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  bookingId: string;
  bookingNumber: string;
  generatedAt: string;
  guestName: string;
  guestPhone: string;
  guestAddress?: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  items: BillItem[];
}

export interface GenerateBillRequest {
  extraServices: { description: string; amount: number; quantity: number }[];
  discountAmount: number;
  taxPercent: number;
  notes?: string;
}
