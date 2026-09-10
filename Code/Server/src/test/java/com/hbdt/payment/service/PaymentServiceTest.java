package com.hbdt.payment.service;

import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.PaymentStatus;
import com.hbdt.payment.dto.CreatePaymentRequest;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private DebtTransactionRepository debtTransactionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(
                salesOrderRepository, debtTransactionRepository, customerRepository, userRepository);
    }

    @Test
    void createPaymentSynchronizesCustomerDebtBalance() {
        User user = User.builder().id(7L).businessId(5L).username("owner").build();
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).customerName("Nguyễn Văn An")
                .debtBalance(new BigDecimal("250000")).status("ACTIVE").build();
        SalesOrder order = SalesOrder.builder()
                .id(100L).businessId(5L).customerId(22L).orderCode("SO-001")
                .status("CONFIRMED").totalAmount(new BigDecimal("300000"))
                .paidAmount(new BigDecimal("50000")).debtAmount(new BigDecimal("250000"))
                .paymentStatus(PaymentStatus.PARTIALLY_PAID).build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(22L, 5L, "DEBT_INCREASE"))
                .thenReturn(new BigDecimal("300000"));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(22L, 5L, "PAYMENT"))
                .thenReturn(new BigDecimal("50000"));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(22L, 5L, "VOID"))
                .thenReturn(BigDecimal.ZERO);
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createPayment("owner", new CreatePaymentRequest(
                100L, 22L, null, new BigDecimal("75000"), "CASH", null, null, null));

        assertThat(customer.getDebtBalance()).isEqualByComparingTo("175000");
        assertThat(order.getDebtAmount()).isEqualByComparingTo("175000");
        assertThat(order.getPaidAmount()).isEqualByComparingTo("125000");
    }
}
