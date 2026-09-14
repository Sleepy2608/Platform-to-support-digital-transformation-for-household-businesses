package com.hbdt.revenue.analytics;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.product.service.BusinessContextService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class ProductSalesService {
    public enum Mode { BEST, SLOW, UNSOLD }
    private final ProductSalesRepository repository;
    private final BusinessContextService business;
    public ProductSalesService(ProductSalesRepository repository, BusinessContextService business) {
        this.repository = repository; this.business = business;
    }

    @Transactional(readOnly = true)
    public List<ProductSalesRow> rank(String username, LocalDate from, LocalDate to, Mode mode, int limit) {
        if (from == null || to == null || from.isAfter(to) || from.getYear() < 1000 || to.getYear() > 9998)
            throw new BadRequestException("Khoảng ngày không hợp lệ");
        if (limit < 1 || limit > 100) throw new BadRequestException("Số kết quả phải từ 1 đến 100");
        if (mode == null) throw new BadRequestException("Kiểu xếp hạng không hợp lệ");
        Long businessId = business.requireBusinessId(username);
        return repository.rank(businessId, from.atStartOfDay(), to.plusDays(1).atStartOfDay(), mode, limit);
    }
}
