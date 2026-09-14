export interface FastSalesProduct {
  id: number;
  productCode: string;
  productName: string;
  categoryId?: number;
  categoryName?: string;
  unitName: string;
  salePrice: number;
  quantityOnHand: number;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FastSalesCartItem {
  productId: number;
  productCode: string;
  productName: string;
  unitName: string;
  unitPrice: number;
  quantity: number;
  quantityOnHand: number;
  imageUrl?: string;
}

export interface FastSalesCustomer {
  id: number;
  customerCode: string;
  customerName: string;
  phone?: string;
  debtBalance: number;
  creditLimit: number;
}

export interface FastSalesCategory {
  id: number;
  name: string;
}
