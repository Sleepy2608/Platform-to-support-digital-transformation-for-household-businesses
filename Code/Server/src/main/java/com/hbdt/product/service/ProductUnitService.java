package com.hbdt.product.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.ProductUnitRequest;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.dto.UpdateProductUnitRequest;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductUnitService {

    private final ProductRepository productRepository;
    private final ProductUnitRepository productUnitRepository;
    private final BusinessContextService businessContextService;
    private final UnitRepository unitRepository;

    public ProductUnitService(
            ProductRepository productRepository,
            ProductUnitRepository productUnitRepository,
            BusinessContextService businessContextService,
            UnitRepository unitRepository
    ) {
        this.productRepository = productRepository;
        this.productUnitRepository = productUnitRepository;
        this.businessContextService = businessContextService;
        this.unitRepository = unitRepository;
    }

    private ProductUnitResponse toResponse(ProductUnit productUnit) {
        Unit unit = unitRepository.findById(productUnit.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException(
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
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm"
                ));

        return productUnitRepository.findAllByProductIdAndStatus(productId, "ACTIVE")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductUnitResponse addUnit(
            String actorUsername,
            Long productId,
            ProductUnitRequest request
    ) {
        throw new UnsupportedOperationException("Chưa cài đặt");
    }

    @Transactional
    public ProductUnitResponse updateRate(
            String actorUsername,
            Long productId,
            Long productUnitId,
            UpdateProductUnitRequest request
    ) {
        throw new UnsupportedOperationException("Chưa cài đặt");
    }

    @Transactional
    public void deactivate(
            String actorUsername,
            Long productId,
            Long productUnitId
    ) {
        throw new UnsupportedOperationException("Chưa cài đặt");
    }
}
