package com.hbdt.entity.enums;

public enum RoleType {
    HEAD_ADMIN,   // Siêu quản trị viên – được seed/create/delete Admin
    ADMIN,         // Quản trị viên thường – không được seed/create/delete Admin
    BUSINESS_OWNER,
    EMPLOYEE
}
