package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Transactional(readOnly = true)
public class UnitConversionService {

    private static final String ACTIVE = "ACTIVE";
    private static final int QUANTITY_SCALE = 3;

    private final ProductRepository productRepository;
    private final ProductUnitRepository productUnitRepository;
    private final BusinessContextService businessContextService;

    public UnitConversionService(
            ProductRepository productRepository,
            ProductUnitRepository productUnitRepository,
            BusinessContextService businessContextService
    ) {
        this.productRepository = productRepository;
        this.productUnitRepository = productUnitRepository;
        this.businessContextService = businessContextService;
    }

    public BigDecimal toBaseQuantity(
            String actorUsername,
            Long productId,
            Long unitId,
            BigDecimal quantity
    ) {
        Product product = findOwnedProduct(actorUsername, productId);
        validateQuantity(quantity);
        BigDecimal conversionRate = resolveConversionRate(product, unitId);
        return quantity.multiply(conversionRate).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal getConversionRate(
            String actorUsername,
            Long productId,
            Long unitId
    ) {
        Product product = findOwnedProduct(actorUsername, productId);
        return resolveConversionRate(product, unitId);
    }

    public BigDecimal convert(
            String actorUsername,
            Long productId,
            Long sourceUnitId,
            Long targetUnitId,
            BigDecimal quantity
    ) {
        Product product = findOwnedProduct(actorUsername, productId);
        validateQuantity(quantity);
        BigDecimal sourceRate = resolveConversionRate(product, sourceUnitId);
        BigDecimal targetRate = resolveConversionRate(product, targetUnitId);
        return quantity.multiply(sourceRate)
                .divide(targetRate, QUANTITY_SCALE, RoundingMode.HALF_UP);
    }

    private Product findOwnedProduct(String actorUsername, Long productId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private BigDecimal resolveConversionRate(Product product, Long unitId) {
        if (unitId == null) {
            throw new BadRequestException("Đơn vị tính không được để trống");
        }
        if (unitId.equals(product.getBaseUnitId())) {
            return BigDecimal.ONE;
        }
        ProductUnit productUnit = productUnitRepository
                .findByProductIdAndUnitIdAndStatus(product.getId(), unitId, ACTIVE)
                .orElseThrow(() -> new BadRequestException(
                        "Đơn vị tính không được cấu hình hoặc đã bị vô hiệu hóa"
                ));
        if (productUnit.getConversionRate() == null || productUnit.getConversionRate().signum() <= 0) {
            throw new BadRequestException("Tỷ lệ quy đổi không hợp lệ");
        }
        return productUnit.getConversionRate();
    }

    private void validateQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }
        if (quantity.stripTrailingZeros().scale() > QUANTITY_SCALE) {
            throw new BadRequestException("Số lượng chỉ được có tối đa 3 chữ số thập phân");
        }
    }
}
