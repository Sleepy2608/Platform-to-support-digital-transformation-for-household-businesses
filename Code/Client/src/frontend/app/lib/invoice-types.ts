export interface ServiceInvoiceResponse {
  id: number;
  invoiceCode: string;
  subscriptionId: number;
  planId: number;
  planName: string;
  duration: number;
  unitPrice: number; 
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string; 
  updatedAt: string; 
}
