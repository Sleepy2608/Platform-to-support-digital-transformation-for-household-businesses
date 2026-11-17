import type { Metadata } from "next";
import "./globals.css";
import AuthSync from "./components/AuthSync";

export const metadata: Metadata = {
  title: {
    default: "HBDT.DIGITAL - Nền Tảng Chuyển Đổi Số Hộ Kinh Doanh",
    template: "%s | HBDT.DIGITAL",
  },
  description: "Nền tảng hỗ trợ chuyển đổi số toàn diện cho hộ kinh doanh cá thể: Bán hàng nhanh POS, Quản lý kho, Hóa đơn điện tử và Sổ sách kế toán Thông tư 88/2021/TT-BTC tích hợp Trợ lý AI.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
