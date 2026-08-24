package com.hbdt.customer.service;

import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.dto.QuickCreateCustomerRequest;
import com.hbdt.entity.Customer;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CustomerRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
