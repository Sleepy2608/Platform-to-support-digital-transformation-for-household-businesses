/**
 * business-profile.ts
 * API helpers cho Business Profile Onboarding (SCRUM-19).
 */

import { apiClient } from '@/app/lib/apiClient';

const BASE_URL = 'http://localhost:8080';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BusinessType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'COOPERATIVE' | 'SMALL_ENTERPRISE';
export type BusinessProfileStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export interface ProvinceDto {
  code: string;
  name: string;
  nameWithType: string;
  divisionType: string;
}

export interface DistrictDto {
  code: string;
  name: string;
  nameWithType: string;
  divisionType: string;
  provinceCode: string;
}

export interface WardDto {
  code: string;
  name: string;
  nameWithType: string;
  divisionType: string;
  districtCode: string;
}

export interface BusinessProfileRequest {
  businessInfo: {
    businessName: string;
    taxCode: string;
    businessType: BusinessType;
    provinceCode: string;
    districtCode: string;
    wardCode: string;
    detailAddress: string;
  };
  representative: {
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  store: {
    storeName: string;
    logoUrl?: string;
    coverImageUrl?: string;
  };
}

export interface BusinessProfileResponse {
  id: number;
  ownerId: number;
  businessName: string;
  taxCode: string;
  businessType: BusinessType;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailAddress: string;
  status: BusinessProfileStatus;
  representative: {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
  } | null;
  store: {
    id: number;
    storeName: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  nextStep: string;
}

// ─── Reference APIs (Public — không cần token) ────────────────────────────────

export async function fetchProvinces(): Promise<ProvinceDto[]> {
  const res = await fetch(`${BASE_URL}/api/reference/provinces`);
  const json = await res.json();
  return json.data as ProvinceDto[];
}

export async function fetchDistricts(provinceCode: string): Promise<DistrictDto[]> {
  const res = await fetch(`${BASE_URL}/api/reference/districts?provinceCode=${provinceCode}`);
  const json = await res.json();
  return json.data as DistrictDto[];
}

export async function fetchWards(districtCode: string): Promise<WardDto[]> {
  const res = await fetch(`${BASE_URL}/api/reference/wards?districtCode=${districtCode}`);
  const json = await res.json();
  return json.data as WardDto[];
}

// ─── Business Profile APIs (Protected — cần token) ────────────────────────────

export async function getBusinessProfile(): Promise<BusinessProfileResponse> {
  return apiClient.get<BusinessProfileResponse>('/api/owner/business-profile');
}

export async function saveBusinessProfile(
  data: BusinessProfileRequest
): Promise<BusinessProfileResponse> {
  return apiClient.post<BusinessProfileResponse>('/api/owner/business-profile', data);
}

export async function uploadStoreLogo(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.upload<string>('/api/owner/business-profile/store/logo', fd);
}

export async function uploadStoreCoverImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.upload<string>('/api/owner/business-profile/store/cover-image', fd);
}
