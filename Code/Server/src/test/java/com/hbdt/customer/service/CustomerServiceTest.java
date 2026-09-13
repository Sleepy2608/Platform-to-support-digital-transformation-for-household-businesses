package com.hbdt.customer.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.dto.CustomerResponse;
import com.hbdt.customer.dto.QuickCreateCustomerRequest;
import com.hbdt.debt.service.DebtBookkeepingService;
import com.hbdt.entity.Customer;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.SalesOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private BusinessContextService businessContextService;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private DebtBookkeepingService debtBookkeepingService;

    private CustomerService service;

    @BeforeEach
    void setUp() {
        service = new CustomerService(
                customerRepository,
                businessContextService,
                salesOrderRepository,
                debtBookkeepingService
        );
    }

    @Test
    void quickCreatePersistsCustomerForCurrentBusiness() {
        when(businessContextService.requireBusinessId("employee")).thenReturn(12L);
        when(customerRepository.existsByBusinessIdAndPhone(12L, "0912345678")).thenReturn(false);
        when(customerRepository.existsByBusinessIdAndCustomerCodeIgnoreCase(any(), any())).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            customer.setId(44L);
            return customer;
        });

        CustomerOptionResponse response = service.quickCreate(
                "employee",
                new QuickCreateCustomerRequest("  Nguyễn Văn An  ", " 0912345678 ")
        );

        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        Customer savedCustomer = customerCaptor.getValue();
        assertThat(savedCustomer.getBusinessId()).isEqualTo(12L);
        assertThat(savedCustomer.getCustomerName()).isEqualTo("Nguyễn Văn An");
        assertThat(savedCustomer.getPhone()).isEqualTo("0912345678");
        assertThat(savedCustomer.getDebtBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(savedCustomer.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.id()).isEqualTo(44L);
        assertThat(response.customerName()).isEqualTo("Nguyễn Văn An");
    }

    @Test
    void quickCreateRejectsDuplicatePhoneBeforeSaving() {
        when(businessContextService.requireBusinessId("employee")).thenReturn(12L);
        when(customerRepository.existsByBusinessIdAndPhone(12L, "0912345678")).thenReturn(true);

        assertThatThrownBy(() -> service.quickCreate(
                "employee",
                new QuickCreateCustomerRequest("Nguyễn Văn An", "0912345678")
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Số điện thoại đã được sử dụng cho khách hàng khác");

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void getDetailUsesLedgerBalanceForExistingCustomer() {
        Customer customer = Customer.builder()
                .id(44L)
                .businessId(12L)
                .customerCode("KH-001")
                .customerName("Nguyễn Văn An")
                .debtBalance(BigDecimal.ZERO)
                .status("ACTIVE")
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(12L);
        when(customerRepository.findByIdAndBusinessId(44L, 12L)).thenReturn(Optional.of(customer));
        when(debtBookkeepingService.calculateCustomerDebt(44L, 12L))
                .thenReturn(new BigDecimal("275000"));

        CustomerResponse response = service.getDetail("owner", 44L);

        assertThat(response.debtBalance()).isEqualByComparingTo("275000");
    }
}
