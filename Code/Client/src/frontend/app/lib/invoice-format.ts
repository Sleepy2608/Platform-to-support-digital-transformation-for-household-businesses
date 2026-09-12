/**
 * invoice-format.ts
 * Helper định dạng hiển thị dùng chung cho hóa đơn bán hàng (preview trên UI + file PDF).
 *
 * Lưu ý: chỉ định dạng hiển thị, KHÔNG thay đổi dữ liệu gốc lấy từ API.
 */

import { BusinessProfileResponse } from '@/app/lib/business-profile';

// Ký tự bắt đầu một từ: bắt đầu chuỗi hoặc sau khoảng trắng / gạch nối / dấu gạch chéo.
const WORD_START = /(^|[\s\-/])([a-zA-ZÀ-ỹ])/g;

/**
 * Viết hoa chữ cái đầu của từng từ (tên đường, tên riêng) và giữ nguyên dấu tiếng Việt
 * vốn có trong dữ liệu. Các phần như số nhà / số hẻm ("14/6") được giữ nguyên.
 *
 * Ví dụ: "14/6 trần bá giao" -> "14/6 Trần Bá Giao"
 */
export function capitalizeVietnameseWords(value: string): string {
  if (!value) return '';
  return value.replace(
    WORD_START,
    (_match, separator: string, character: string) => `${separator}${character.toUpperCase()}`,
  );
}

/**
 * Ghép địa chỉ của hộ kinh doanh (từ business profile) thành chuỗi hiển thị
 * đã được viết hoa đúng. Trả về chuỗi rỗng nếu chưa có dữ liệu.
 */
export function formatBusinessAddress(profile: BusinessProfileResponse | null): string {
  if (!profile) return '';
  return [profile.detailAddress, profile.wardName, profile.districtName, profile.provinceName]
    .filter((part) => Boolean(part && part.trim()))
    .map((part) => capitalizeVietnameseWords(part.trim()))
    .join(', ');
}
