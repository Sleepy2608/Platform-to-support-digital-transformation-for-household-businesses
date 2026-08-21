package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.ProductUnitRequest;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.dto.UpdateProductUnitRequest;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ProductUnitService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";

    private final ProductRepository productRepository;
    private final ProductUnitRepository productUnitRepository;
    private final BusinessContextService businessContextService;
    private final UnitRepository unitRepository;
    private final ProductPricingService productPricingService;

    public ProductUnitService(
            ProductRepository productRepository,
            ProductUnitRepository productUnitRepository,
            BusinessContextService businessContextService,
            UnitRepository unitRepository,
            ProductPricingService productPricingService
    ) {
        this.productRepository = productRepository;
        this.productUnitRepository = productUnitRepository;
        this.businessContextService = businessContextService;
        this.unitRepository = unitRepository;
        this.productPricingService = productPricingService;
    }

    private ProductUnitResponse toResponse(ProductUnit productUnit) {
        Unit unit = unitRepository.findById(productUnit.getUnitId()).orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn vị tính"
                ));

        return new ProductUnitResponse(
                productUnit.getId(),
                productUnit.getProductId(),
                productUnit.getUnitId(),
                unit.getUnitName(),
                unit.getUnitCode(),
                productUnit.getConversionRate(),
                productUnit.getBaseUnit(),
                productUnit.getStatus()
        );
    }

    public List<ProductUnitResponse> getProductUnits(
            String actorUsername,
            Long productId
    ) {
        findOwnedProduct(actorUsername, productId);

        return productUnitRepository
                .findAllByProductIdAndStatusOrderByBaseUnitDesc(productId, ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    private Product findOwnedProduct(
            String actorUsername,
            Long productId
    ) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);

        return productRepository.findByIdAndBusinessId(productId, businessId).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm"
                )
        );
    }

    @Transactional
    public ProductUnitResponse addUnit(
            String actorUsername,
            Long productId,
            ProductUnitRequest request
    ) {
        Product product = findOwnedProduct(actorUsername, productId);
        unitRepository.findByIdAndStatus(request.getUnitId(), ACTIVE)
                .orElseThrow(() -> new BadRequestException(
                        "Đơn vị tính không tồn tại hoặc đã bị vô hiệu hóa"
                ));
        if (product.getBaseUnitId().equals(request.getUnitId())) {
            throw new BadRequestException("Đơn vị này đã là đơn vị chuẩn của sản phẩm");
        }

        validateConversionRate(request.getConversionRate());
        Optional<ProductUnit> existingUnit = productUnitRepository
                .findByProductIdAndUnitId(productId, request.getUnitId());
        if (existingUnit.isPresent()) {
            ProductUnit productUnit = existingUnit.get();
            if (ACTIVE.equals(productUnit.getStatus())) {
                throw new BadRequestException("Đơn vị tính đã được cấu hình cho sản phẩm");
            }
            if (INACTIVE.equals(productUnit.getStatus())) {
                productUnit.setStatus(ACTIVE);
                productUnit.setConversionRate(request.getConversionRate());
                productUnit.setBaseUnit(false);
                return toResponse(productUnitRepository.save(productUnit));
            }
            throw new BadRequestException("Trạng thái đơn vị tính không hợp lệ");
        }

        ProductUnit productUnit = ProductUnit.builder()
                .productId(productId)
                .unitId(request.getUnitId())
                .conversionRate(request.getConversionRate())
                .baseUnit(false)
                .status(ACTIVE)
                .build();
        return toResponse(productUnitRepository.save(productUnit));
    }

    @Transactional
    public ProductUnitResponse updateRate(
            String actorUsername,
            Long productId,
            Long productUnitId,
            UpdateProductUnitRequest request
    ) {
        findOwnedProduct(actorUsername, productId);
        validateConversionRate(request.getConversionRate());

        ProductUnit productUnit = findProductUnit(productId, productUnitId);
        if (!ACTIVE.equals(productUnit.getStatus())) {
            throw new BadRequestException("Đơn vị tính đã bị vô hiệu hóa");
        }
        if (Boolean.TRUE.equals(productUnit.getBaseUnit())) {
            throw new BadRequestException("Không thể thay đổi tỷ lệ của đơn vị chuẩn");
        }

        BigDecimal oldRate = productUnit.getConversionRate();
        productUnit.setConversionRate(request.getConversionRate());
        ProductUnit saved = productUnitRepository.save(productUnit);
        productPricingService.synchronizeForRateChange(
                actorUsername, productId, productUnitId, oldRate, request.getConversionRate()
        );
        return toResponse(saved);
    }

    @Transactional
    public void deactivate(
            String actorUsername,
            Long productId,
            Long productUnitId
    ) {
        findOwnedProduct(actorUsername, productId);
        ProductUnit productUnit = findProductUnit(productId, productUnitId);
        if (Boolean.TRUE.equals(productUnit.getBaseUnit())) {
            throw new BadRequestException("Không thể vô hiệu hóa đơn vị chuẩn");
        }
        if (INACTIVE.equals(productUnit.getStatus())) {
            return;
        }
        productUnit.setStatus(INACTIVE);
        productUnitRepository.save(productUnit);
        productPricingService.deactivatePricesForUnit(actorUsername, productId, productUnitId);
    }

    private ProductUnit findProductUnit(Long productId, Long productUnitId) {
        return productUnitRepository.findByIdAndProductId(productUnitId, productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn vị tính của sản phẩm"
                ));
    }

    private void validateConversionRate(BigDecimal conversionRate) {
        if (conversionRate == null || conversionRate.signum() <= 0) {
            throw new BadRequestException("Tỷ lệ quy đổi phải lớn hơn 0");
        }
    }
}
