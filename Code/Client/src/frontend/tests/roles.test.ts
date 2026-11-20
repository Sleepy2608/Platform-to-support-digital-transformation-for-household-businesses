import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  isAdmin,
  isManager,
  isAnyAdmin,
  isOwner,
  isEmployee,
  getLoginRedirectPath,
  canAccessPortal,
  type AppRole,
} from '../app/lib/roles.ts';

describe('roles RBAC helper functions', () => {
  test('kiểm tra role ADMIN chính xác', () => {
    assert.equal(isAdmin(['ADMIN']), true);
    assert.equal(isAdmin(['BUSINESS_OWNER']), false);
    assert.equal(isAdmin([]), false);
  });

  test('kiểm tra role MANAGER chính xác', () => {
    assert.equal(isManager(['MANAGER']), true);
    assert.equal(isManager(['EMPLOYEE']), false);
  });

  test('kiểm tra isAnyAdmin (ADMIN hoặc MANAGER)', () => {
    assert.equal(isAnyAdmin(['ADMIN']), true);
    assert.equal(isAnyAdmin(['MANAGER']), true);
    assert.equal(isAnyAdmin(['BUSINESS_OWNER', 'EMPLOYEE']), false);
    assert.equal(isAnyAdmin([]), false);
  });

  test('kiểm tra role BUSINESS_OWNER chính xác', () => {
    assert.equal(isOwner(['BUSINESS_OWNER']), true);
    assert.equal(isOwner(['EMPLOYEE']), false);
  });

  test('kiểm tra role EMPLOYEE chính xác', () => {
    assert.equal(isEmployee(['EMPLOYEE']), true);
    assert.equal(isEmployee(['BUSINESS_OWNER']), false);
  });
});

describe('getLoginRedirectPath', () => {
  test('ADMIN chuyển hướng đến /admin', () => {
    assert.equal(getLoginRedirectPath(['ADMIN']), '/admin');
    assert.equal(getLoginRedirectPath(['ADMIN', 'EMPLOYEE']), '/admin');
  });

  test('MANAGER chuyển hướng đến /manager', () => {
    assert.equal(getLoginRedirectPath(['MANAGER']), '/manager');
  });

  test('BUSINESS_OWNER có businessId chuyển hướng đến /owner/account', () => {
    assert.equal(getLoginRedirectPath(['BUSINESS_OWNER'], 123), '/owner/account');
  });

  test('BUSINESS_OWNER chưa có businessId chuyển hướng onboarding', () => {
    assert.equal(getLoginRedirectPath(['BUSINESS_OWNER'], null), '/onboarding/business-profile');
    assert.equal(getLoginRedirectPath(['BUSINESS_OWNER']), '/onboarding/business-profile');
  });

  test('EMPLOYEE chuyển hướng đến /employee/orders/new', () => {
    assert.equal(getLoginRedirectPath(['EMPLOYEE']), '/employee/orders/new');
  });

  test('Không có role hợp lệ chuyển về /login', () => {
    assert.equal(getLoginRedirectPath([]), '/login');
  });
});

describe('canAccessPortal', () => {
  test('Portal admin chỉ cho phép ADMIN', () => {
    assert.equal(canAccessPortal('admin', ['ADMIN']), true);
    assert.equal(canAccessPortal('admin', ['MANAGER']), false);
    assert.equal(canAccessPortal('admin', ['BUSINESS_OWNER']), false);
  });

  test('Portal manager chỉ cho phép MANAGER', () => {
    assert.equal(canAccessPortal('manager', ['MANAGER']), true);
    assert.equal(canAccessPortal('manager', ['ADMIN']), false);
  });

  test('Portal owner chỉ cho phép BUSINESS_OWNER', () => {
    assert.equal(canAccessPortal('owner', ['BUSINESS_OWNER']), true);
    assert.equal(canAccessPortal('owner', ['EMPLOYEE']), false);
  });

  test('Portal employee chỉ cho phép EMPLOYEE', () => {
    assert.equal(canAccessPortal('employee', ['EMPLOYEE']), true);
    assert.equal(canAccessPortal('employee', ['BUSINESS_OWNER']), false);
  });
});

