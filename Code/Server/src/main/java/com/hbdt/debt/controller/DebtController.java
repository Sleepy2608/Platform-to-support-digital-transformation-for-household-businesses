package com.hbdt.debt.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.debt.service.DebtBookkeepingService;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.enums.DebtTransactionStatus;
import com.hbdt.entity.User;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST API tra cứu công nợ tự động — HBDT-66.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/debt/customers/{customerId}/balance — số dư công nợ thực tế (từ SSOT).</li>
 *   <li>GET /api/debt/customers/{customerId}/transactions — lịch sử giao dịch phân trang.</li>
 *   <li>GET /api/debt/orders/{orderId}/transactions — giao dịch theo đơn hàng.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/debt")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class DebtController {

    private final DebtBookkeepingService debtBookkeepingService;
    private final DebtTransactionRepository debtTransactionRepository;
    private final UserRepository userRepository;

    public DebtController(DebtBookkeepingService debtBookkeepingService,
                          DebtTransactionRepository debtTransactionRepository,
                          UserRepository userRepository) {
        this.debtBookkeepingService = debtBookkeepingService;
        this.debtTransactionRepository = debtTransactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Lấy số dư công nợ thực tế của khách hàng.
     *
     * <p>Tính từ SUM(DEBT_INCREASE) - SUM(PAYMENT) - SUM(VOID) trên tập ACTIVE
     * — đảm bảo không phụ thuộc ID, an toàn với concurrent writes.</p>
     */
    @GetMapping("/customers/{customerId}/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getCustomerBalance(
            Authentication authentication,
            @PathVariable Long customerId) {
        Long businessId = resolveBusinessId(authentication.getName());
        BigDecimal balance = debtBookkeepingService.calculateCustomerDebt(customerId, businessId);
        return ResponseEntity.ok(ApiResponse.success("Lấy số dư công nợ thành công", balance));
    }

    /**
     * Lấy lịch sử giao dịch công nợ của khách hàng (phân trang, chỉ ACTIVE).
     */
    @GetMapping("/customers/{customerId}/transactions")
    public ResponseEntity<ApiResponse<PageResponse<DebtTransaction>>> getCustomerTransactions(
            Authentication authentication,
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long businessId = resolveBusinessId(authentication.getName());
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        var txPage = debtTransactionRepository.findByCustomerIdAndBusinessIdAndStatus(
                customerId, businessId, DebtTransactionStatus.ACTIVE, pageable);
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy lịch sử giao dịch công nợ thành công",
                PageResponse.from(txPage)));
    }

    /**
     * Lấy tất cả giao dịch công nợ liên quan đến một đơn hàng (chỉ ACTIVE).
     */
    @GetMapping("/orders/{orderId}/transactions")
    public ResponseEntity<ApiResponse<List<DebtTransaction>>> getOrderTransactions(
            Authentication authentication,
            @PathVariable Long orderId) {
        Long businessId = resolveBusinessId(authentication.getName());
        List<DebtTransaction> transactions = debtTransactionRepository
                .findBySalesOrderIdAndBusinessIdAndStatus(orderId, businessId, DebtTransactionStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy giao dịch công nợ theo đơn hàng thành công",
                transactions));
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Long resolveBusinessId(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        if (user.getBusinessId() == null) {
            throw new IllegalArgumentException("Tài khoản chưa được liên kết với hộ kinh doanh");
        }
        return user.getBusinessId();
    }
}
