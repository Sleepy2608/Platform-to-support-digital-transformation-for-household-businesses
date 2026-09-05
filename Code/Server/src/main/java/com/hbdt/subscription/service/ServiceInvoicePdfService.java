package com.hbdt.subscription.service;

import com.hbdt.subscription.dto.ServiceInvoiceResponse;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class ServiceInvoicePdfService {

    /**
     * Vietnamese text requires a Unicode-capable font. Helvetica (the OpenPDF
     * built-in default) cannot render Vietnamese diacritics, so we load a real
     * TTF font from common Windows locations. If none is found, generation
     * fails loudly instead of silently producing broken characters.
     */
    private static final List<String> FONT_CANDIDATES = List.of(
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/tahoma.ttf"
    );

    public byte[] generateInvoicePdf(ServiceInvoiceResponse invoice) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);

            document.open();

            String regularPath = resolveFontPath();
            String boldPath = resolveBoldFontPath();

            BaseFont regularBase = BaseFont.createFont(regularPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            BaseFont boldBase = BaseFont.createFont(boldPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            Font titleFont = new Font(boldBase, 18, Font.BOLD);
            Font headerFont = new Font(boldBase, 12, Font.BOLD);
            Font normalFont = new Font(regularBase, 12, Font.NORMAL);

            Paragraph title = new Paragraph("HÓA ĐƠN DỊCH VỤ", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

            document.add(new Paragraph("Mã hóa đơn: " + invoice.getInvoiceCode(), normalFont));
            document.add(new Paragraph("Ngày tạo: " + invoice.getCreatedAt().format(dateFormatter), normalFont));
            document.add(new Paragraph("Trạng thái: " + invoice.getStatus(), normalFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            addTableCell(table, "Tên gói", headerFont);
            addTableCell(table, invoice.getPlanName(), normalFont);

            addTableCell(table, "Thời hạn", headerFont);
            addTableCell(table, invoice.getDuration() + " tháng", normalFont);

            addTableCell(table, "Đơn giá", headerFont);
            addTableCell(table, currencyFormat.format(invoice.getUnitPrice()), normalFont);

            addTableCell(table, "Tổng tiền", headerFont);
            addTableCell(table, currencyFormat.format(invoice.getTotalAmount()), normalFont);

            document.add(table);

            Paragraph footer = new Paragraph("Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!", normalFont);
            footer.setAlignment(Paragraph.ALIGN_CENTER);
            footer.setSpacingBefore(30);
            document.add(footer);

            document.close();

            return baos.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    private String resolveFontPath() {
        for (String candidate : FONT_CANDIDATES) {
            if (new File(candidate).exists()) {
                return candidate;
            }
        }
        throw new IllegalStateException(
                "Không tìm thấy font Unicode (Arial/Segeo UI/Tahoma) để tạo PDF tiếng Việt.");
    }

    private String resolveBoldFontPath() {
        String bold = "C:/Windows/Fonts/arialbd.ttf";
        if (new File(bold).exists()) {
            return bold;
        }
        // Fall back to the regular font if no dedicated bold variant exists.
        return resolveFontPath();
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        table.addCell(cell);
    }
}
