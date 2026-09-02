package com.hbdt.customer.service;

import com.hbdt.common.dto.PageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.customer.dto.*;
import com.hbdt.entity.Customer;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final BusinessContextService businessContextService;

    public CustomerService(CustomerRepository customerRepository, BusinessContextService businessContextService) {
        this.customerRepository = customerRepository;
        this.businessContextService = businessContextService;
    }

    // ===== CRUD APIs (HBDT-47) =====

    /**
     * Tạo mới khách hàng đầy đủ.
     * - Validate tên, SĐT
     * - Check trùng phone trong cùng businessId
     * - Auto-generate customer code
     */
    @Transactional
    public CustomerResponse create(String actorUsername, CustomerCreateRequest request) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);

        // Validate trùng phone
        String phone = clean(request.phone());
        if (phone != null && customerRepository.existsByBusinessIdAndPhone(businessId, phone)) {
            throw new BadRequestException("Số điện thoại đã được sử dụng cho khách hàng khác");
        }

        String code = generateCode(businessId);
        Customer customer = customerRepository.save(Customer.builder()
                .businessId(businessId)
                .customerCode(code)
                .customerName(request.customerName().trim())
                .phone(phone)
                .email(clean(request.email()))
                .address(clean(request.address()))
                .note(clean(request.note()))
                .debtBalance(BigDecimal.ZERO)
                .status("ACTIVE")
                .build());

        return toResponse(customer);
    }

    /**
     * Lấy danh sách khách hàng — hỗ trợ Search, Filter status, Pagination.
     * Luôn scoped theo businessId.
     */
    @Transactional(readOnly = true)
    public PageResponse<CustomerListResponse> getList(String actorUsername, String keyword,
                                                       String status, int page, int size) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        String normalizedKeyword = clean(keyword);
        String normalizedStatus = clean(status);

        // Validate status nếu có
        if (normalizedStatus != null && !normalizedStatus.equals("ACTIVE") && !normalizedStatus.equals("INACTIVE")) {
            throw new BadRequestException("Trạng thái lọc phải là ACTIVE hoặc INACTIVE");
        }

        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<Customer> customerPage = customerRepository.findByBusinessIdWithFilters(
                businessId, normalizedKeyword, normalizedStatus, PageRequest.of(page, safeSize));

        Page<CustomerListResponse> responsePage = customerPage.map(this::toListResponse);
        return PageResponse.from(responsePage);
    }

    /**
     * Xem chi tiết khách hàng kèm số dư công nợ.
     */
    @Transactional(readOnly = true)
    public CustomerResponse getDetail(String actorUsername, Long customerId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        Customer customer = customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng", "id", customerId));
        return toResponse(customer);
    }

    /**
     * Cập nhật thông tin khách hàng (partial update).
     * - Check trùng phone (loại trừ chính nó)
     */
    @Transactional
    public CustomerResponse update(String actorUsername, Long customerId, CustomerUpdateRequest request) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        Customer customer = customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng", "id", customerId));

        // Cập nhật customerName nếu có
        if (request.customerName() != null) {
            customer.setCustomerName(request.customerName().trim());
        }

        // Cập nhật phone + validate trùng
        if (request.phone() != null) {
            String newPhone = clean(request.phone());
            if (newPhone != null && customerRepository.existsByBusinessIdAndPhoneAndIdNot(
                    businessId, newPhone, customerId)) {
                throw new BadRequestException("Số điện thoại đã được sử dụng cho khách hàng khác");
            }
            customer.setPhone(newPhone);
        }

        // Cập nhật email
        if (request.email() != null) {
            customer.setEmail(clean(request.email()));
        }

        // Cập nhật address
        if (request.address() != null) {
            customer.setAddress(clean(request.address()));
        }

        // Cập nhật note
        if (request.note() != null) {
            customer.setNote(clean(request.note()));
        }

        Customer saved = customerRepository.save(customer);
        return toResponse(saved);
    }

    /**
     * Đổi trạng thái khách hàng (ACTIVE ↔ INACTIVE).
     * Nếu debt_balance > 0, không cho phép vô hiệu hóa.
     */
    @Transactional
    public CustomerResponse changeStatus(String actorUsername, Long customerId, CustomerStatusRequest request) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        Customer customer = customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng", "id", customerId));

        String newStatus = request.status();

        // Guard: không cho INACTIVE nếu còn nợ
        if ("INACTIVE".equals(newStatus) && customer.getDebtBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException(
                    "Không thể vô hiệu hóa khách hàng đang có công nợ: " +
                    customer.getDebtBalance().toPlainString() + " VND");
        }

        // Guard: không đổi nếu trạng thái giống nhau
        if (newStatus.equals(customer.getStatus())) {
            throw new BadRequestException("Khách hàng đã ở trạng thái " + newStatus);
        }

        customer.setStatus(newStatus);
        Customer saved = customerRepository.save(customer);
        return toResponse(saved);
    }

    // ===== Existing APIs (preserved) =====

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

    // ===== Private helpers =====

    private String generateCode(Long businessId) {
        String code;
        do {
            code = "KH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (customerRepository.existsByBusinessIdAndCustomerCodeIgnoreCase(businessId, code));
        return code;
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCustomerName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getNote(),
                customer.getDebtBalance(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }

    private CustomerListResponse toListResponse(Customer customer) {
        return new CustomerListResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCustomerName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getDebtBalance(),
                customer.getStatus(),
                customer.getCreatedAt()
        );
    }

    private CustomerOptionResponse toOption(Customer customer) {
        return new CustomerOptionResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCustomerName(),
                customer.getPhone(),
                customer.getDebtBalance() != null ? customer.getDebtBalance() : BigDecimal.ZERO
        );
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

