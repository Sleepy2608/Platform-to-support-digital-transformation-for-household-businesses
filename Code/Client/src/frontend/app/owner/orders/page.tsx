import { redirect } from 'next/navigation';

export default function OrdersPage() {
  redirect('/owner/orders/history');
}
