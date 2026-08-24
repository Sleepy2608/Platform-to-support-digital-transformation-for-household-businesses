/**
 * payment.ts
 * API helpers & TypeScript interfaces cho quản lý ghi nhận thanh toán & công nợ đơn hàng.
 */

import { apiClient } from '@/app/lib/apiClient';

// ─── Enums & Types ─────────────────────────────────────────────────────────────

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type DebtTransactionType = 'DEBT_INCREASE' | 'PAYMENT' | 'ADJUSTMENT' | 'VOID';
export type DebtTransactionStatus = 'ACTIVE' | 'VOIDED';

export interface CreatePaymentRequest {
  salesOrderId: number;
  customerId?: number;
  invoiceId?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  paymentDate?: string;
  note?: string;
}

export interface PaymentResponse {
  paymentId: number;
  transactionCode: string;
  salesOrderId: number;
  orderCode: string | null;
  customerId: number;
  customerName: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  note: string | null;
  transactionType: DebtTransactionType;
  status: DebtTransactionStatus;
  paidAmount: number | null;
  remainingAmount: number | null;
  paymentStatus: PaymentStatus | null;
  balanceAfter: number;
  paymentDate: string;
  createdByUsername: string | null;
  createdAt: string;
}

export interface OrderPaymentSummaryResponse {
  salesOrderId: number;
  orderCode: string;
  customerId: number | null;
  customerName: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  transactionCount: number;
}

export interface CustomerDebtSummaryResponse {
  customerId: number;
  customerCode: string;
  customerName: string;
  totalDebtIncreased: number;
  totalPaid: number;
  currentBalance: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Ghi nhận một khoản thanh toán mới cho đơn hàng.
 */
export async function createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
  return apiClient.post<PaymentResponse>('/api/payments', data);
}

/**
 * Lấy danh sách lịch sử các giao dịch thanh toán theo đơn hàng.
 */
export async function getOrderPayments(orderId: number): Promise<PaymentResponse[]> {
  return apiClient.get<PaymentResponse[]>(`/api/payments/orders/${orderId}`);
}

/**
 * Lấy tổng quan trạng thái thanh toán của một đơn hàng (tổng tiền, đã trả, còn nợ).
 */
export async function getOrderPaymentSummary(orderId: number): Promise<OrderPaymentSummaryResponse> {
  return apiClient.get<OrderPaymentSummaryResponse>(`/api/payments/orders/${orderId}/summary`);
}

/**
 * Tra cứu lịch sử thanh toán & công nợ theo khách hàng (có phân trang).
 */
export async function getCustomerPaymentHistory(
  customerId: number,
  page = 0,
  size = 20
): Promise<PageResponse<PaymentResponse>> {
  return apiClient.get<PageResponse<PaymentResponse>>(
    `/api/payments/customers/${customerId}/history?page=${page}&size=${size}`
  );
}

/**
 * Lấy tổng quan dư nợ công nợ hiện tại của khách hàng.
 */
export async function getCustomerDebtSummary(customerId: number): Promise<CustomerDebtSummaryResponse> {
  return apiClient.get<CustomerDebtSummaryResponse>(`/api/payments/customers/${customerId}/debt-summary`);
}
