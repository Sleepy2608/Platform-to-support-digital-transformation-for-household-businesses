package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.subscription.dto.ServiceInvoiceResponse;
import com.hbdt.subscription.service.ISubscriptionService;
import com.hbdt.subscription.service.ServiceInvoicePdfService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/invoices")
@PreAuthorize("hasRole('MANAGER')")
public class ServiceInvoiceController {

    private final ISubscriptionService subscriptionService;
    private final ServiceInvoicePdfService pdfService;

    public ServiceInvoiceController(ISubscriptionService subscriptionService, ServiceInvoicePdfService pdfService) {
        this.subscriptionService = subscriptionService;
        this.pdfService = pdfService;
    }

    /** GET /api/manager/invoices - Manager xem toàn bộ lịch sử hóa đơn dịch vụ. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceInvoiceResponse>>> getManagerInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ServiceInvoiceResponse> invoices = subscriptionService.getManagerInvoiceHistory(status, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hóa đơn thành công", invoices));
    }

    /** GET /api/manager/invoices/{id} - Manager xem chi tiết hóa đơn. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceInvoiceResponse>> getInvoiceDetail(@PathVariable Long id) {
        ServiceInvoiceResponse invoice = subscriptionService.getManagerInvoiceDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết hóa đơn thành công", invoice));
    }

    /** GET /api/manager/invoices/{id}/download - Manager tải PDF hóa đơn. */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long id) {
        ServiceInvoiceResponse invoice = subscriptionService.getManagerInvoiceDetail(id);
        byte[] pdfBytes = pdfService.generateInvoicePdf(invoice);
        String filename = "invoice-" + invoice.getInvoiceCode() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }
}
