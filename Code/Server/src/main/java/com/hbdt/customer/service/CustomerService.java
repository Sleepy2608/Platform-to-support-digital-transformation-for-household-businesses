package com.hbdt.customer.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.dto.CustomerPurchaseHistoryPageResponse;
import com.hbdt.customer.dto.CustomerPurchaseHistoryResponse;
import com.hbdt.customer.dto.CustomerPurchaseSummaryResponse;
import com.hbdt.customer.dto.QuickCreateCustomerRequest;
import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.PaymentStatus;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.SalesOrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BusinessContextService businessContextService;
    private final SalesOrderRepository salesOrderRepository;
    private final DebtTransactionRepository debtTransactionRepository;

    public CustomerService(CustomerRepository customerRepository, 
                           BusinessContextService businessContextService,
                           SalesOrderRepository salesOrderRepository,
                           DebtTransactionRepository debtTransactionRepository) {
        this.customerRepository = customerRepository;
        this.businessContextService = businessContextService;
        this.salesOrderRepository = salesOrderRepository;
        this.debtTransactionRepository = debtTransactionRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerOptionResponse> searchOptions(String actorUsername, String keyword, int limit) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        String normalized = keyword == null || keyword.isBlank() ? null : keyword.trim();
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return customerRepository.searchActive(businessId, normalized, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toOption)
                .toList();
    }

    @Transactional
    public CustomerOptionResponse quickCreate(String actorUsername, QuickCreateCustomerRequest request) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        String code = generateCode(businessId);
        Customer customer = customerRepository.save(Customer.builder()
                .businessId(businessId)
                .customerCode(code)
                .customerName(request.customerName().trim())
                .phone(clean(request.phone()))
                .status("ACTIVE")
                .build());
        return toOption(customer);
    }

    @Transactional(readOnly = true)
    public CustomerPurchaseHistoryPageResponse getPurchaseHistory(
            String actorUsername, Long customerId, String keyword,
            LocalDateTime startDate, LocalDateTime endDate,
            String paymentStatusStr, int page, int size) {
        
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        
        // Verify customer
        customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
                
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        
        String normalizedKeyword = clean(keyword);
        PaymentStatus paymentStatus = paymentStatusStr != null && !paymentStatusStr.isBlank() 
                ? PaymentStatus.valueOf(paymentStatusStr) : null;
                
        Page<CustomerPurchaseHistoryResponse> result = salesOrderRepository.searchCustomerPurchaseHistory(
                businessId, customerId, normalizedKeyword, startDate, endDate, paymentStatus,
                PageRequest.of(safePage, safeSize)
        ).map(this::toHistoryResponse);
        
        return CustomerPurchaseHistoryPageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public CustomerPurchaseSummaryResponse getPurchaseSummary(String actorUsername, Long customerId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        
        // Verify customer
        customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
                
        BigDecimal totalPurchased = salesOrderRepository.sumTotalAmountByCustomer(businessId, customerId);
        if (totalPurchased == null) {
            totalPurchased = BigDecimal.ZERO;
        }
        
        BigDecimal totalDebt = debtTransactionRepository.findFirstByBusinessIdAndCustomerIdOrderByIdDesc(businessId, customerId)
                .map(DebtTransaction::getBalanceAfter)
                .orElse(BigDecimal.ZERO)
                .setScale(0, RoundingMode.HALF_UP);
                
        return new CustomerPurchaseSummaryResponse(totalPurchased.setScale(0, RoundingMode.HALF_UP), totalDebt);
    }

    private String generateCode(Long businessId) {
        String code;
        do {
            code = "KH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (customerRepository.existsByBusinessIdAndCustomerCodeIgnoreCase(businessId, code));
        return code;
    }

    private CustomerOptionResponse toOption(Customer customer) {
        return new CustomerOptionResponse(
                customer.getId(), customer.getCustomerCode(), customer.getCustomerName(), customer.getPhone());
    }
    
    private CustomerPurchaseHistoryResponse toHistoryResponse(SalesOrder order) {
        return new CustomerPurchaseHistoryResponse(
                order.getId(),
                order.getOrderCode(),
                order.getCreatedAt(),
                order.getTotalAmount(),
                order.getPaidAmount(),
                order.getDebtAmount(),
                order.getPaymentStatus().name()
        );
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
