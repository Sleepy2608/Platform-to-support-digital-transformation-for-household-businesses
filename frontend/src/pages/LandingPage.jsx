import Button from '../shared/components/Button.jsx'

/**
 * Trang gioi thieu cong khai (SCRUM-08). Noi dung day du (bang gia Thuong/VIP,
 * tinh nang) se duoc bo sung trong Sprint 1 theo phan cong cua thanh vien D.
 */
export default function LandingPage() {
  return (
    <div className="page landing-page">
      <h1>AgriTrade</h1>
      <p>Nen tang quan ly ban hang vat lieu xay dung cho ho kinh doanh.</p>
      <div className="landing-actions">
        <Button href="/register">Dang ky dung thu</Button>
        <Button href="/login" variant="secondary">Dang nhap</Button>
      </div>
    </div>
  )
}
