/**
 * Tải ảnh mã QR về thiết bị của người dùng
 */
export async function downloadQrImage(imageUrl: string, filename = 'ma-qr-thanh-toan.png'): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Không thể tải ảnh QR qua fetch');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.png') || filename.endsWith('.jpg') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return true;
  } catch {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch {
      return false;
    }
  }
}
