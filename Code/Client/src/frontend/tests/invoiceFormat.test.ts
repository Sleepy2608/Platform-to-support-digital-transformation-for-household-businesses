import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  capitalizeVietnameseWords,
  formatBusinessAddress,
} from '../app/lib/invoice-format.ts';
import type { BusinessProfileResponse } from '../app/lib/business-profile.ts';

describe('capitalizeVietnameseWords', () => {
  test('viết hoa chữ cái đầu và giữ nguyên dấu tiếng Việt', () => {
    assert.equal(capitalizeVietnameseWords('trần bá giao'), 'Trần Bá Giao');
    assert.equal(capitalizeVietnameseWords('nguyễn văn cừ'), 'Nguyễn Văn Cừ');
    assert.equal(capitalizeVietnameseWords('hà nội'), 'Hà Nội');
  });

  test('giữ nguyên số nhà và số hẻm phân tách bởi dấu gạch chéo', () => {
    assert.equal(capitalizeVietnameseWords('14/6 trần bá giao'), '14/6 Trần Bá Giao');
    assert.equal(capitalizeVietnameseWords('100/2a lý thường kiệt'), '100/2a Lý Thường Kiệt');
  });

  test('xử lý chuỗi rỗng an toàn', () => {
    assert.equal(capitalizeVietnameseWords(''), '');
  });
});

describe('formatBusinessAddress', () => {
  test('ghép các thành phần địa chỉ đầy đủ có viết hoa chuẩn', () => {
    const profile: BusinessProfileResponse = {
      businessId: 1,
      businessName: 'Cửa hàng Minh Khang',
      ownerFullName: 'Trần Minh Khang',
      taxCode: '0315678999',
      phoneNumber: '0901234567',
      email: 'minhkhang@example.com',
      detailAddress: '14/6 trần bá giao',
      wardName: 'phường 5',
      districtName: 'quận gò vấp',
      provinceName: 'thành phố hồ chí minh',
      onboardingCompleted: true,
      hasEverSubscribed: true,
    };

    const formatted = formatBusinessAddress(profile);
    assert.equal(
      formatted,
      '14/6 Trần Bá Giao, Phường 5, Quận Gò Vấp, Thành Phố Hồ Chí Minh',
    );
  });

  test('bỏ qua các thành phần null hoặc rỗng', () => {
    const profile: BusinessProfileResponse = {
      businessId: 2,
      businessName: 'Tạp hóa Bình Dân',
      ownerFullName: 'Lê Văn B',
      taxCode: null,
      phoneNumber: '0912345678',
      email: null,
      detailAddress: '25 lê lợi',
      wardName: '',
      districtName: 'quận 1',
      provinceName: 'tp hồ chí minh',
      onboardingCompleted: true,
      hasEverSubscribed: true,
    };

    const formatted = formatBusinessAddress(profile);
    assert.equal(formatted, '25 Lê Lợi, Quận 1, Tp Hồ Chí Minh');
  });

  test('trả về chuỗi rỗng khi profile là null', () => {
    assert.equal(formatBusinessAddress(null), '');
  });
});
