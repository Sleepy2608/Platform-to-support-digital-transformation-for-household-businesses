package com.hbdt.ai.service;

import com.hbdt.ai.dto.AiExtraction;
import com.hbdt.ai.dto.AiParseOrderRequest;
import com.hbdt.ai.dto.AiParseOrderResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.service.CustomerService;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.ProductService;
import com.hbdt.product.service.ProductUnitService;
import com.hbdt.pricing.dto.ResolvePriceRequest;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import com.hbdt.pricing.service.ProductPricingService;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AiService {
    private final AiExtractionClient extractionClient;
    private final BusinessContextService businessContext;
    private final ProductService productService;
    private final ProductUnitService unitService;
    private final ProductPricingService pricingService;
    private final CustomerService customerService;

    public AiService(AiExtractionClient extractionClient, BusinessContextService businessContext,
                     ProductService productService, ProductUnitService unitService,
                     ProductPricingService pricingService, CustomerService customerService) {
        this.extractionClient = extractionClient;
        this.businessContext = businessContext;
        this.productService = productService;
        this.unitService = unitService;
        this.pricingService = pricingService;
        this.customerService = customerService;
    }

    public AiParseOrderResponse parseOrder(String actor, AiParseOrderRequest request) {
        // Validate ownership before the paid API call. Never accept a tenant ID from the model/client.
        businessContext.requireBusinessId(actor);
        AiExtraction parsed = extractionClient.extract(request.text().trim());
        validateExtraction(parsed);
        List<String> issues = new ArrayList<>();
        parsed.ambiguities().stream()
                .filter(issue -> !isBackendValidatedItemFieldIssue(issue))
                .forEach(issues::add);
        if (!"CREATE_ORDER".equals(parsed.intent()) || parsed.items().isEmpty()) {
            issues.add("Chưa nhận được yêu cầu tạo đơn. Hãy nhập sản phẩm, số lượng và đơn vị tính.");
            return new AiParseOrderResponse("bai", false, parsed.customerName(), null,
                    parsed.paymentType(), List.of(), issues, "Chưa tạo bản đề xuất đơn hàng.");
        }
        if ("UNKNOWN".equals(parsed.paymentType())) {
            issues.add("Chưa rõ cách thanh toán. Hãy nói rõ tiền mặt, chuyển khoản hoặc ghi nợ.");
        }
        CustomerOptionResponse customer = resolveCustomer(actor, parsed.customerName(), issues);
        if ("DEBT".equals(parsed.paymentType()) && customer == null) {
            issues.add("Ghi nợ cần xác định một khách hàng đã đăng ký.");
        }
        List<AiParseOrderResponse.Item> items = new ArrayList<>();
        Map<Long, BigDecimal> requestedStock = new HashMap<>();
        for (AiExtraction.Item item : parsed.items()) {
            AiParseOrderResponse.Item resolved = resolveItem(actor, item);
            items.add(resolved);
            issues.addAll(resolved.issues());
            if (resolved.price() != null) {
                requestedStock.merge(resolved.product().id(), resolved.price().baseQuantity(), BigDecimal::add);
            }
        }
        for (AiParseOrderResponse.Item item : items) {
            if (item.price() == null) continue;
            BigDecimal stock = item.product().quantityOnHand();
            if (stock == null || requestedStock.get(item.product().id()).compareTo(stock) > 0) {
                issues.add("Không đủ tồn kho cho tổng số lượng sản phẩm " + item.product().productName() + ".");
            }
        }
        List<String> uniqueIssues = issues.stream().distinct().toList();
        return new AiParseOrderResponse("bai", uniqueIssues.isEmpty(), parsed.customerName(), customer,
                parsed.paymentType(), items, uniqueIssues,
                "Bản đề xuất chưa lưu. Kiểm tra thông tin và xác nhận tại giỏ hàng.");
    }

    private AiParseOrderResponse.Item resolveItem(String actor, AiExtraction.Item item) {
        List<String> issues = new ArrayList<>();
        if (item.quantity() == null) issues.add("Thiếu số lượng cho " + item.productName() + ".");
        var candidates = productService.search(actor, item.productName(), "ACTIVE", null,
                0, 20, "createdAt", "desc");
        ProductResponse product = null;
        // A truncated result must not be treated as a unique match.
        if (candidates.totalElements() <= candidates.content().size()) {
            var exact = candidates.content().stream().filter(p ->
                    normalize(p.productName()).equals(normalize(item.productName()))
                    || normalize(p.productCode()).equals(normalize(item.productName()))).toList();
            if (exact.size() == 1) product = exact.getFirst();
            else if (candidates.totalElements() == 1) product = candidates.content().getFirst();
        }
        if (product == null) {
            String message = candidates.totalElements() == 0
                    ? "Không tìm thấy sản phẩm " + item.productName() + " trong cửa hàng."
                    : "Có nhiều sản phẩm phù hợp với " + item.productName() + ". Hãy nói rõ tên hoặc mã: "
                        + String.join(", ", candidates.content().stream().limit(5)
                            .map(p -> p.productName() + " (" + p.productCode() + ")").toList());
            issues.add(message);
            return new AiParseOrderResponse.Item(item.productName(), item.quantity(), item.unit(),
                    null, List.of(), null, issues);
        }
        List<ProductUnitResponse> units = unitService.getProductUnits(actor, product.id());
        var matchedUnits = item.unit() == null
                ? units.stream().filter(unit -> Boolean.TRUE.equals(unit.getBaseUnit())).toList()
                : units.stream()
                    .filter(u -> normalizeUnit(u.getUnitName()).equals(normalizeUnit(item.unit()))
                            || normalizeUnit(u.getUnitCode()).equals(normalizeUnit(item.unit())))
                    .toList();
        ResolvedPriceResponse price = null;
        if (matchedUnits.size() != 1) {
            if (item.unit() == null) {
                issues.add("Sản phẩm " + product.productName() + " chưa có một đơn vị cơ sở hợp lệ.");
            } else {
                issues.add("Đơn vị '" + item.unit() + "' chưa khớp với " + product.productName() + ".");
            }
        } else if (item.quantity() != null) {
            try {
                price = pricingService.resolve(actor, new ResolvePriceRequest(
                        product.id(), matchedUnits.getFirst().getUnitId(), item.quantity()));
            } catch (BadRequestException error) {
                issues.add(product.productName() + ": " + error.getMessage());
            }
        }
        return new AiParseOrderResponse.Item(item.productName(), item.quantity(), item.unit(),
                product, units, price, issues);
    }

    private CustomerOptionResponse resolveCustomer(String actor, String name, List<String> issues) {
        if (name == null || name.isBlank()) return null;
        // Remove only an address prefix, never parts inside a real name.
        String query = name.trim().replaceFirst("(?iu)^(anh|chị|ông|bà|bác|chú|cô|em)\\s+", "");
        List<CustomerOptionResponse> candidates = customerService.searchOptions(actor, query, 50);
        if (candidates.size() < 50) {
            var exact = candidates.stream().filter(c ->
                    normalize(c.customerName()).equals(normalize(name))
                    || normalize(c.customerName()).equals(normalize(query))).toList();
            if (exact.size() == 1) return exact.getFirst();
            if (candidates.size() == 1) return candidates.getFirst();
        }
        issues.add(candidates.isEmpty()
                ? "Không tìm thấy khách hàng " + name + ". Hãy đăng ký hoặc nhập tên đầy đủ."
                : "Có nhiều khách hàng phù hợp với " + name + ". Hãy nhập tên đầy đủ.");
        return null;
    }

    private void validateExtraction(AiExtraction parsed) {
        if (parsed == null || parsed.items() == null || parsed.ambiguities() == null
                || parsed.items().size() > 20 || parsed.ambiguities().size() > 20
                || !List.of("CREATE_ORDER", "OTHER").contains(parsed.intent() == null ? "" : parsed.intent())
                || !List.of("CASH", "TRANSFER", "DEBT", "UNKNOWN").contains(
                        parsed.paymentType() == null ? "" : parsed.paymentType())) {
            throw new AiUnavailableException("Kết quả AI không đúng cấu trúc yêu cầu.");
        }
        for (AiExtraction.Item item : parsed.items()) {
            if (item == null || item.productName() == null || item.productName().isBlank()
                    || item.productName().length() > 255 || (item.quantity() != null
                    && (item.quantity().signum() <= 0 || item.quantity().stripTrailingZeros().scale() > 3
                    || item.quantity().compareTo(new BigDecimal("999999999999999.999")) > 0))) {
                throw new AiUnavailableException("AI trả về sản phẩm hoặc số lượng không hợp lệ.");
            }
        }
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    private String normalizeUnit(String unit) {
        return switch (normalize(unit)) {
            case "kilogam", "ki lo gam", "can" -> "kg";
            case "l", "lit" -> "lit";
            default -> normalize(unit);
        };
    }

    private boolean isBackendValidatedItemFieldIssue(String issue) {
        String normalized = normalize(issue);
        boolean missingOrUnclear = normalized.contains("thieu")
                || normalized.contains("chua ro")
                || normalized.contains("khong ro")
                || normalized.contains("khong xac dinh");
        return missingOrUnclear
                && (normalized.contains("don vi") || normalized.contains("so luong"));
    }

    public boolean isConfigured() {
        return extractionClient.isConfigured();
    }
}
