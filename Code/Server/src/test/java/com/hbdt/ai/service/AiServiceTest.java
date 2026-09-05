package com.hbdt.ai.service;

import com.hbdt.ai.dto.AiExtraction;
import com.hbdt.ai.dto.AiParseOrderRequest;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.service.CustomerService;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.ProductService;
import com.hbdt.product.service.ProductUnitService;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import com.hbdt.pricing.service.ProductPricingService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {
    @Mock AiExtractionClient client;
    @Mock BusinessContextService business;
    @Mock ProductService products;
    @Mock ProductUnitService units;
    @Mock ProductPricingService prices;
    @Mock CustomerService customers;
    AiService service;
    private final AiParseOrderRequest request = new AiParseOrderRequest("Lấy 5 bao xi măng cho anh Ba, ghi nợ");

    @BeforeEach
    void setUp() {
        service = new AiService(client, business, products, units, prices, customers);
    }

    @Test
    void usesAuthenticatedBusinessAndDatabasePricesForProposal() {
        when(client.extract(anyString())).thenReturn(extraction("DEBT", "anh Ba", 5));
        catalog(100);
        when(customers.searchOptions("owner", "Ba", 50))
                .thenReturn(List.of(new CustomerOptionResponse(7L, "KH7", "Ba", null)));
        var result = service.parseOrder("owner", request);
        assertTrue(result.readyToApply());
        assertEquals(7L, result.customer().id());
        assertEquals(new BigDecimal("85000"), result.items().getFirst().price().unitPrice());
        assertEquals(10L, result.items().getFirst().product().id());
        var inOrder = inOrder(business, client, products);
        inOrder.verify(business).requireBusinessId("owner");
        inOrder.verify(client).extract(request.text());
        inOrder.verify(products).search("owner", "xi măng", "ACTIVE", null, 0, 20, "createdAt", "desc");
    }

    @Test
    void rejectsMissingBusinessBeforeBillableRequest() {
        when(business.requireBusinessId("outsider")).thenThrow(new IllegalStateException("No business"));
        assertThrows(IllegalStateException.class, () -> service.parseOrder("outsider", request));
        verifyNoInteractions(client, products, units, prices, customers);
    }

    @Test
    void neverChoosesFirstOfMultipleProducts() {
        when(client.extract(anyString())).thenReturn(extraction("CASH", null, 5));
        when(products.search(anyString(), anyString(), anyString(), isNull(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(page(List.of(product(10L, "Xi măng Hà Tiên", 100), product(11L, "Xi măng Nghi Sơn", 100))));
        var result = service.parseOrder("owner", request);
        assertFalse(result.readyToApply());
        assertNull(result.items().getFirst().product());
        verifyNoInteractions(units, prices);
    }

    @Test
    void debtCannotUseAmbiguousCustomer() {
        when(client.extract(anyString())).thenReturn(extraction("DEBT", "anh Ba", 5));
        catalog(100);
        when(customers.searchOptions("owner", "Ba", 50)).thenReturn(List.of(
                new CustomerOptionResponse(7L, "KH7", "Ba", null),
                new CustomerOptionResponse(8L, "KH8", "Ba", null)));
        var result = service.parseOrder("owner", request);
        assertFalse(result.readyToApply());
        assertNull(result.customer());
    }

    @Test
    void doesNotConvertTaToTanOrFallBackToBaseUnit() {
        when(client.extract(anyString())).thenReturn(new AiExtraction("CREATE_ORDER", null, "CASH",
                List.of(new AiExtraction.Item("xi măng", BigDecimal.ONE, "tạ")), List.of()));
        when(products.search(anyString(), anyString(), anyString(), isNull(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(page(List.of(product(10L, "Xi măng", 100))));
        when(units.getProductUnits("owner", 10L)).thenReturn(List.of(
                new ProductUnitResponse(2L, 10L, 3L, "Tấn", "TAN", BigDecimal.ONE, true, "ACTIVE")));
        var result = service.parseOrder("owner", request);
        assertFalse(result.readyToApply());
        assertNull(result.items().getFirst().price());
        verifyNoInteractions(prices);
    }

    @Test
    void combinedLinesCannotExceedAvailableStock() {
        var item = new AiExtraction.Item("xi măng", new BigDecimal("5"), "bao");
        when(client.extract(anyString())).thenReturn(new AiExtraction("CREATE_ORDER", null, "CASH",
                List.of(item, item), List.of()));
        catalog(8);
        var result = service.parseOrder("owner", request);
        assertFalse(result.readyToApply());
        assertTrue(result.ambiguities().stream().anyMatch(s -> s.contains("tồn kho")));
    }

    @Test
    void legalQuestionDoesNotCreateOrderOrSearchBusinessData() {
        when(client.extract(anyString())).thenReturn(new AiExtraction("OTHER", null, "UNKNOWN", List.of(), List.of()));
        var result = service.parseOrder("owner", new AiParseOrderRequest("Hộ kinh doanh cần lập sổ nào?"));
        assertFalse(result.readyToApply());
        assertTrue(result.items().isEmpty());
        verifyNoInteractions(products, units, prices, customers);
    }

    private AiExtraction extraction(String payment, String customer, int quantity) {
        return new AiExtraction("CREATE_ORDER", customer, payment,
                List.of(new AiExtraction.Item("xi măng", BigDecimal.valueOf(quantity), "bao")), List.of());
    }

    private void catalog(int stock) {
        when(products.search(anyString(), anyString(), anyString(), isNull(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(page(List.of(product(10L, "Xi măng", stock))));
        when(units.getProductUnits("owner", 10L)).thenReturn(List.of(
                new ProductUnitResponse(2L, 10L, 3L, "Bao", "BAO", BigDecimal.ONE, true, "ACTIVE")));
        when(prices.resolve(eq("owner"), any())).thenReturn(new ResolvedPriceResponse(
                10L, 2L, 3L, "Bao", new BigDecimal("5"), BigDecimal.ONE, new BigDecimal("5"),
                new BigDecimal("85000"), new BigDecimal("425000"), 9L, "Giá hiện hành", false));
    }

    private ProductResponse product(Long id, String name, int stock) {
        return new ProductResponse(id, "SP" + id, name, null, null, 3L, "Bao", BigDecimal.ONE,
                1L, "Nhóm thuế", null, List.of(), null, "ACTIVE", BigDecimal.valueOf(stock), null, null);
    }

    private PageResponse<ProductResponse> page(List<ProductResponse> values) {
        return new PageResponse<>(values, 0, 20, values.size(), 1, true, true);
    }
}
