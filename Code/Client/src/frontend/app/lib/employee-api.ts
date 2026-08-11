/**
 * employee-api.ts
 * API helpers cho Employee (tự quản lý hồ sơ) và Owner (quản lý nhân viên).
 * Sử dụng apiClient (tự động refresh token + parse ApiResponse).
 */
import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'DEACTIVATED';
  businessId: number | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  nationalId: string | null;
  joinDate: string | null;
  position: string | null;
  terminationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreatePayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  position?: string;
  joinDate?: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  address?: string;
}

export interface EmployeeUpdatePayload {
  fullName?: string;
  position?: string;
  status?: string;
  terminationDate?: string;
}

// ─── Owner: Employee Account Management ───────────────────────────────────────

export async function fetchEmployees(search?: string): Promise<Employee[]> {
  const q = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiClient.get<Employee[]>(`/api/owner/employees${q}`);
}

export async function fetchEmployee(id: number): Promise<Employee> {
  return apiClient.get<Employee>(`/api/owner/employees/${id}`);
}

export async function createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
  return apiClient.post<Employee>('/api/owner/employees', payload);
}

export async function updateEmployee(id: number, payload: EmployeeUpdatePayload): Promise<Employee> {
  return apiClient.put<Employee>(`/api/owner/employees/${id}`, payload);
}

export async function deleteEmployee(id: number): Promise<void> {
  return apiClient.delete<void>(`/api/owner/employees/${id}`);
}

export async function resetEmployeePassword(id: number, newPassword: string, confirmPassword: string): Promise<void> {
  return apiClient.post<void>(`/api/owner/employees/${id}/reset-password`, { newPassword, confirmPassword });
}

export async function lockEmployee(id: number): Promise<void> {
  return apiClient.post<void>(`/api/owner/employees/${id}/lock`);
}

export async function unlockEmployee(id: number): Promise<void> {
  return apiClient.post<void>(`/api/owner/employees/${id}/unlock`);
}

// ─── Employee: Profile Management (tự sửa) ───────────────────────────────────

export async function fetchMyProfile(): Promise<Employee> {
  return apiClient.get<Employee>('/api/employee/profile');
}

export async function updateMyProfile(payload: { email?: string; phone?: string }): Promise<Employee> {
  return apiClient.put<Employee>('/api/employee/profile', payload);
}

export async function uploadMyAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.upload<string>('/api/employee/profile/avatar', formData);
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  return apiClient.put<void>('/api/employee/password', payload);
}
