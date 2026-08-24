'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '@/app/lib/apiClient';

interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
  phone?: string;
}

export interface CartUnit {
  id: number;
  unitId: number;
  unitName: string;
  unitCode: string;
  conversionRate: number;
  baseUnit: boolean;
}

export interface CartResolvedPrice {
  productId: number;
  productUnitId: number;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartItem {
  key: number;
  productId: number;
  productCode: string;
  productName: string;
  imageUrl?: string;
  baseUnitName?: string;
  quantityOnHand?: number;
  unitId: number;
  quantity: string;
  units: CartUnit[];
  resolving: boolean;
  resolved?: CartResolvedPrice;
  error?: string;
  stockWarning?: string;
}

export interface CheckoutData {
  orderCode: string;
  source: 'POS' | 'ONLINE';
  paidAmount: number;
  note: string;
  customerId?: number;
}

interface OrderCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onChangeUnit: (key: number, unitId: number) => void;
  onChangeQuantity: (key: number, quantity: string) => void;
  onRemoveItem: (key: number) => void;
  onClearCart: () => void;
  onCheckout: (data: CheckoutData) => Promise<{ orderCode: string }>;
}

export function OrderCartDrawer({
  isOpen,
  onClose,
  items,
  onChangeUnit,
  onChangeQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: OrderCartDrawerProps) {
  const [orderCode, setOrderCode] = useState('');
  const [source, setSource] = useState<'POS' | 'ONLINE'>('POS');
  const [paidAmount, setPaidAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const customerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerSearchRequest = useRef(0);

  useEffect(() => () => {
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
  }, []);

  const totalAmount = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + Number(item.resolved?.lineTotal || 0), 0)),
    [items],
  );
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + parseQuantity(item.quantity), 0),
    [items],
  );
  const parsedPaid = paidAmount.trim() === '' ? totalAmount : Number(paidAmount);
  const paid = Number.isFinite(parsedPaid) ? Math.round(parsedPaid) : Number.NaN;
  const debtAmount = Math.max(0, Math.round(totalAmount - (Number.isFinite(paid) ? paid : 0)));
  const hasInvalidItem = items.some((item) => !item.resolved || item.resolving || Boolean(item.error));
  const selectedCustomer = customers.find((customer) => String(customer.id) === customerId);

  const searchCustomers = async (keyword = customerKeyword) => {
    const requestId = ++customerSearchRequest.current;
    setCustomerLoading(true);
    try {
      const params = new URLSearchParams({ keyword: keyword.trim(), limit: '50' });
      const results = await apiClient.get<CustomerOption[]>(`/api/customers/options?${params}`);
      if (requestId !== customerSearchRequest.current) return;
      setCustomers(results);
    } catch (error) {
      if (requestId === customerSearchRequest.current) {
        setCheckoutError(error instanceof Error ? error.message : 'Không thể tải khách hàng');
      }
    } finally {
      if (requestId === customerSearchRequest.current) setCustomerLoading(false);
    }
  };

  const quickCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      setCheckoutError('Vui lòng nhập tên khách hàng mới');
      return;
    }
    setCustomerLoading(true);
    setCheckoutError('');
    try {
      const created = await apiClient.post<CustomerOption>('/api/customers/quick', {
        customerName: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      });
      setCustomers((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setCustomerId(String(created.id));
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Không thể tạo khách hàng');
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setCheckoutError('');
    if (!orderCode.trim()) {
      setCheckoutError('Vui lòng nhập mã đơn hàng');
      return;
    }
    if (items.length === 0 || hasInvalidItem) {
      setCheckoutError('Có sản phẩm chưa được thiết lập giá hoặc đang chờ tính giá');
      return;
    }
    if (!Number.isFinite(paid) || paid < 0 || paid > totalAmount) {
      setCheckoutError('Số tiền khách trả phải từ 0 đến tổng tiền đơn hàng');
      return;
    }
    if (debtAmount > 0 && !customerId) {
      setCheckoutError('Đơn còn nợ bắt buộc phải chọn khách hàng');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onCheckout({
        orderCode: orderCode.trim(),
        source,
        paidAmount: paid,
        note: note.trim(),
        customerId: customerId ? Number(customerId) : undefined,
      });
      setSuccessMessage(`Đã tạo đơn ${result.orderCode} thành công`);
      setOrderCode('');
      setPaidAmount('');
      setNote('');
      setCustomerId('');
      onClearCart();
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Không thể tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end overflow-hidden">
          <motion.button
            type="button"
            aria-label="Đóng giỏ hàng"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-950">Đơn hàng mới</h2>
                  <p className="text-xs text-slate-500">
                    {formatQuantity(totalQuantity)} sản phẩm · {items.length} dòng
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
              {successMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" /> {successMessage}
                </div>
              )}
              {checkoutError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{checkoutError}</div>
              )}

              {items.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <ShoppingBag className="mb-3 h-12 w-12 stroke-1 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Chưa có sản phẩm trong đơn</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">Đóng giỏ hàng và chọn sản phẩm để bắt đầu tạo đơn.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sản phẩm đã chọn</span>
                    <button type="button" onClick={onClearCart} className="text-xs font-bold text-red-600 hover:underline">Xóa tất cả</button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const selectedUnit = item.units.find((unit) => unit.unitId === item.unitId);
                      const stockInSelectedUnit = selectedUnit && selectedUnit.conversionRate > 0
                        ? Number(item.quantityOnHand || 0) / Number(selectedUnit.conversionRate)
                        : Number(item.quantityOnHand || 0);
                      const allowsFraction = allowsFractionalQuantity(selectedUnit?.unitCode);
                      const stockLimit = allowsFraction
                        ? roundDown3(stockInSelectedUnit)
                        : Math.floor(stockInSelectedUnit);
                      const reachedStockLimit = parseQuantity(item.quantity) >= stockLimit;
                      return (
                        <article key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">SP</div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-black text-slate-900">{item.productName}</h3>
                                  <p className="text-xs font-mono text-slate-400">{item.productCode}</p>
                                </div>
                                <button type="button" onClick={() => onRemoveItem(item.key)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Xóa sản phẩm">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px]">
                                <label>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Đơn vị</span>
                                  <select value={item.unitId} onChange={(event) => onChangeUnit(item.key, Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-slate-500">
                                    {item.units.map((unit) => <option key={unit.id} value={unit.unitId}>{unit.unitName}</option>)}
                                  </select>
                                </label>

                                <label>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Số lượng</span>
                                  <div className="flex rounded-lg border border-slate-200 bg-white">
                                    <button type="button" onClick={() => onChangeQuantity(item.key, steppedQuantity(item.quantity, -1, allowsFraction))} className="px-2 text-slate-500 hover:bg-slate-100" aria-label="Giảm số lượng"><Minus className="h-3.5 w-3.5" /></button>
                                    <input value={item.quantity} onChange={(event) => onChangeQuantity(item.key, event.target.value)} inputMode={allowsFraction ? 'decimal' : 'numeric'} type="text" pattern={allowsFraction ? '\\d+(?:[.,]\\d{0,3})?' : '\\d+'} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-center text-xs font-bold outline-none" />
                                    <button type="button" disabled={reachedStockLimit} onClick={() => onChangeQuantity(item.key, steppedQuantity(item.quantity, 1, allowsFraction))} className="px-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Tăng số lượng"><Plus className="h-3.5 w-3.5" /></button>
                                  </div>
                                </label>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="font-bold text-slate-700">
                                    {item.resolving ? 'Đang tính giá...' : item.resolved ? `${formatVnd(item.resolved.unitPrice)} / ${item.resolved.unitName}` : 'Chưa có giá'}
                                  </span>
                                  <span className="ml-2 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                    Tồn: {formatQuantity(stockInSelectedUnit)} {selectedUnit?.unitName || item.baseUnitName || ''}
                                  </span>
                                </div>
                                <strong className="text-sm text-emerald-700">= {formatVnd(item.resolved?.lineTotal || 0)}</strong>
                              </div>
                              {item.error && <p className="mt-2 text-xs font-semibold text-red-600">{item.error}</p>}
                              {item.stockWarning && <p className="mt-2 text-xs font-semibold text-amber-700">{item.stockWarning}</p>}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {items.length > 0 && (
              <form onSubmit={handleCheckout} className="space-y-4 border-t border-slate-200 bg-slate-50/90 px-5 py-5 sm:px-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Mã đơn hàng</span>
                    <input required maxLength={50} value={orderCode} onChange={(event) => setOrderCode(event.target.value)} placeholder="Ví dụ: DH-001" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-500" />
                  </label>
                  <div className="sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Khách hàng {debtAmount > 0 ? '(bắt buộc vì đơn còn nợ)' : '(không bắt buộc)'}</span>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input value={customerKeyword} onFocus={() => { if (!customers.length) void searchCustomers(''); }} onChange={(event) => { const value = event.target.value; setCustomerKeyword(value); if (selectedCustomer && normalizeSearchText(value) !== normalizeSearchText(selectedCustomer.customerName)) setCustomerId(''); if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current); customerSearchTimer.current = setTimeout(() => void searchCustomers(value), 250); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current); void searchCustomers(); } }} placeholder="Gõ tên, mã hoặc số điện thoại..." className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-500" />
                      <button type="button" disabled={customerLoading} onClick={() => void searchCustomers()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-50">Tìm</button>
                    </div>
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                      <button type="button" onClick={() => { setCustomerId(''); setCustomerKeyword(''); }} className={`block w-full border-b border-slate-100 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 ${!customerId ? 'bg-slate-50 font-bold text-slate-700' : 'text-slate-500'}`}>Khách lẻ / chưa chọn khách hàng</button>
                      {customerLoading && <p className="px-3.5 py-3 text-sm font-semibold text-slate-400">Đang tìm khách hàng...</p>}
                      {!customerLoading && customers.map((customer) => <button type="button" key={customer.id} onClick={() => { if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current); setCustomerId(String(customer.id)); setCustomerKeyword(customer.customerName); }} className={`block w-full border-b border-slate-100 px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-emerald-50 ${String(customer.id) === customerId ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-slate-700'}`}><span className="font-mono text-xs text-slate-500">{customer.customerCode}</span> — {customer.customerName}{customer.phone ? ` — ${customer.phone}` : ''}</button>)}
                      {!customerLoading && customerKeyword.trim() && customers.length === 0 && <p className="px-3.5 py-3 text-sm text-slate-400">Không tìm thấy khách hàng phù hợp</p>}
                    </div>
                    {selectedCustomer && <p className="mt-1.5 text-xs font-bold text-emerald-700">Đã chọn khách hàng: {selectedCustomer.customerName}</p>}
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                      <input maxLength={150} value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} placeholder="Tên khách hàng mới" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none" />
                      <input maxLength={20} value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} placeholder="Số điện thoại" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none" />
                      <button type="button" disabled={customerLoading} onClick={() => void quickCreateCustomer()} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 disabled:opacity-50">Tạo khách</button>
                    </div>
                  </div>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Nguồn đơn</span>
                    <select value={source} onChange={(event) => setSource(event.target.value as 'POS' | 'ONLINE')} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-500">
                      <option value="POS">Bán tại quầy</option>
                      <option value="ONLINE">Đơn trực tuyến</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Khách đã trả</span>
                    <div className="relative">
                      <input value={formatMoneyInput(paidAmount)} onChange={(event) => setPaidAmount(event.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric" type="text" pattern="[\d.]*" placeholder={`Mặc định: ${formatVnd(totalAmount)}`} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-semibold outline-none focus:border-slate-500" />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-slate-400">₫</span>
                    </div>
                    {paidAmount && <span className="mt-1 block text-xs font-semibold text-slate-500">{formatMoneyInput(paidAmount)} ₫</span>}
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Ghi chú</span>
                    <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú giao hàng..." className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-500" />
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex justify-between text-xs text-slate-500"><span>Số lượng sản phẩm</span><strong>{formatQuantity(totalQuantity)} món</strong></div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Còn nợ</span><strong>{formatVnd(debtAmount)}</strong></div>
                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3"><span className="font-bold text-slate-800">Tổng thanh toán</span><strong className="text-xl font-black text-emerald-700">{formatVnd(totalAmount)}</strong></div>
                </div>

                <button type="submit" disabled={submitting || hasInvalidItem} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  <ShoppingBag className="h-4 w-4" />
                  {submitting ? 'Đang tạo đơn...' : `Xác nhận tạo đơn (${formatVnd(totalAmount)})`}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 1000) / 1000 : 0;
}

function steppedQuantity(value: string, direction: -1 | 1, allowsFraction: boolean) {
  const current = parseQuantity(value) || 1;
  if (!allowsFraction) return String(Math.max(1, Math.round(current) + direction));
  return String(Math.max(0.001, Math.round((current + direction) * 1000) / 1000));
}

function roundDown3(value: number) {
  return Math.floor(Math.max(0, value) * 1000 + Number.EPSILON) / 1000;
}

function allowsFractionalQuantity(unitCode?: string) {
  const code = (unitCode || '').trim().toUpperCase();
  return code === 'KG' || code === 'LIT';
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function formatMoneyInput(value: string) {
  if (!value) return '';
  return value.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}
