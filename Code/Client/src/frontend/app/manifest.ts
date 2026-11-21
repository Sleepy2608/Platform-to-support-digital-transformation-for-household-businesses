import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HBDT POS - Bán Hàng Nhanh & Chuyển Đổi Số Hộ Kinh Doanh',
    short_name: 'HBDT POS',
    description:
      'Nền tảng hỗ trợ chuyển đổi số toàn diện cho hộ kinh doanh: Bán hàng nhanh POS, Quản lý kho, Sổ sách kế toán Thông tư 88/2021/TT-BTC & Trợ lý AI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'any',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['business', 'finance', 'productivity', 'utilities'],
    shortcuts: [
      {
        name: 'Tạo đơn nhanh POS',
        short_name: 'Bán hàng',
        description: 'Mở giao diện bán hàng tại quầy Fast Sales POS',
        url: '/employee/orders/new',
        icons: [{ src: '/icon.png', sizes: '512x512' }],
      },
      {
        name: 'Quản lý kho hàng',
        short_name: 'Kho hàng',
        description: 'Tra cứu tồn kho và cảnh báo hàng sắp hết',
        url: '/owner/products',
        icons: [{ src: '/icon.png', sizes: '512x512' }],
      },
      {
        name: 'Sổ sách kế toán TT88',
        short_name: 'Sổ TT88',
        description: 'Xem sổ doanh thu S1-HKD, S2-HKD và nghĩa vụ thuế S4-HKD',
        url: '/owner/reports',
        icons: [{ src: '/icon.png', sizes: '512x512' }],
      },
    ],
  };
}
