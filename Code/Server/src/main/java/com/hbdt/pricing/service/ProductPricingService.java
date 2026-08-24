package com.hbdt.pricing.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductPrice;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.TaxActivityGroup;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.pricing.dto.ProductPriceRequest;
import com.hbdt.pricing.dto.ProductPriceResponse;
import com.hbdt.pricing.dto.ResolvePriceRequest;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import com.hbdt.pricing.dto.UpdateProductPriceRequest;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.ProductPriceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.repository.TaxActivityGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProductPricingService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";
    private static final int MONEY_SCALE = 2;
    private static final int QUANTITY_SCALE = 3;
    private static final BigDecimal MAX_ORDER_QUANTITY = new BigDecimal("999999999999999.999");
    private static final BigDecimal ONE_UNIT = new BigDecimal("1.000");

    private final ProductRepository productRepository;
    private final ProductUnitRepository productUnitRepository;
    private final ProductPriceRepository productPriceRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final BusinessContextService businessContextService;
    private final TaxActivityGroupRepository taxActivityGroupRepository;

    public ProductPricingService(
            ProductRepository productRepository,
            ProductUnitRepository productUnitRepository,
            ProductPriceRepository productPriceRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            BusinessContextService businessContextService,
            TaxActivityGroupRepository taxActivityGroupRepository
    ) {
        this.productRepository = productRepository;
        this.productUnitRepository = productUnitRepository;
        this.productPriceRepository = productPriceRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.businessContextService = businessContextService;
        this.taxActivityGroupRepository = taxActivityGroupRepository;
    }

    public List<ProductPriceResponse> getCurrentPrices(String actorUsername, Long productId) {
        findOwnedProduct(actorUsername, productId);
        List<ProductUnit> productUnits = activeProductUnits(productId);
        Set<Long> seenProductUnits = new HashSet<>();
        return productPriceRepository
                .findAllByProductUnitIdInAndStatusOrderByProductUnitIdAscEffectiveFromDesc(
                        productUnits.stream().map(ProductUnit::getId).toList(), ACTIVE
                )
                .stream()
                .filter(price -> seenProductUnits.add(price.getProductUnitId()))
                .map(price -> toResponse(price, productUnits))
                .toList();
    }

    public List<ProductPriceResponse> getHistory(String actorUsername, Long productId) {
        findOwnedProduct(actorUsername, productId);
        List<ProductUnit> productUnits = productUnitRepository.findAllByProductId(productId);
        if (productUnits.isEmpty()) {
            return List.of();
        }
        return productPriceRepository
                .findAllByProductUnitIdInOrderByCreatedAtDesc(
                        productUnits.stream().map(ProductUnit::getId).toList()
                )
                .stream()
                .map(price -> toResponse(price, productUnits))
                .toList();
    }

    @Transactional
    public ProductPriceResponse create(
            String actorUsername,
            Long productId,
            ProductPriceRequest request
    ) {
        findOwnedProduct(actorUsername, productId);
        ProductUnit productUnit = requireActiveProductUnit(productId, request.productUnitId());
        validatePrice(request.salePrice());
        if (!productPriceRepository
                .findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(productUnit.getId(), ACTIVE)
                .isEmpty()) {
            throw new BadRequestException("Đơn vị này đã có giá bán hiện hành");
        }

        ProductPrice saved = productPriceRepository.save(ProductPrice.builder()
                .productUnitId(productUnit.getId())
                .minimumQuantity(ONE_UNIT)
                .salePrice(normalizeMoney(request.salePrice()))
                .ruleName(normalizePriceName(request.ruleName()))
                .changedBy(requireActor(actorUsername).getId())
                .status(ACTIVE)
                .build());
        return toResponse(saved, List.of(productUnit));
    }

    @Transactional
    public ProductPriceResponse update(
            String actorUsername,
            Long productId,
            Long priceId,
            UpdateProductPriceRequest request
    ) {
        findOwnedProduct(actorUsername, productId);
        validatePrice(request.salePrice());
        ProductPrice current = requireOwnedPrice(productId, priceId);
        if (!ACTIVE.equals(current.getStatus())) {
            throw new BadRequestException("Mức giá này không còn hiệu lực");
        }
        Long actorId = requireActor(actorUsername).getId();
        ProductPrice replacement = replacePrice(
                current,
                normalizeMoney(request.salePrice()),
                normalizePriceName(request.ruleName()),
                actorId,
                LocalDateTime.now()
        );
        ProductUnit productUnit = productUnitRepository.findById(current.getProductUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính của sản phẩm"));
        return toResponse(replacement, List.of(productUnit));
    }

    @Transactional
    public void deactivate(String actorUsername, Long productId, Long priceId) {
        findOwnedProduct(actorUsername, productId);
        ProductPrice price = requireOwnedPrice(productId, priceId);
        if (INACTIVE.equals(price.getStatus())) {
            return;
        }
        closeCurrentPrices(price.getProductUnitId(), requireActor(actorUsername).getId(), LocalDateTime.now());
    }

    public ResolvedPriceResponse resolve(String actorUsername, ResolvePriceRequest request) {
        Product product = findOwnedProduct(actorUsername, request.productId());
        validateOrderQuantity(request.quantity());
        ProductUnit selectedUnit = productUnitRepository
                .findByProductIdAndUnitIdAndStatus(product.getId(), request.unitId(), ACTIVE)
                .orElseThrow(() -> new BadRequestException(
                        "Đơn vị tính không được cấu hình hoặc đã bị vô hiệu hóa"
                ));
        Unit unit = requireUnit(selectedUnit.getUnitId());
        validateUnitQuantity(request.quantity(), unit);
        BigDecimal rate = selectedUnit.getConversionRate();
        BigDecimal baseQuantity = request.quantity().multiply(rate)
                .setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);

        ProductPrice appliedPrice = findCurrentPrice(selectedUnit.getId());
        boolean convertedFromBase = false;
        BigDecimal unitPrice;
        if (appliedPrice != null) {
            unitPrice = appliedPrice.getSalePrice();
        } else {
            ProductUnit baseUnit = productUnitRepository
                    .findByProductIdAndUnitIdAndStatus(product.getId(), product.getBaseUnitId(), ACTIVE)
                    .orElseThrow(() -> new BadRequestException("Sản phẩm chưa có đơn vị chuẩn hợp lệ"));
            appliedPrice = findCurrentPrice(baseUnit.getId());
            if (appliedPrice == null) {
                throw new BadRequestException("Sản phẩm chưa được thiết lập giá bán phù hợp");
            }
            unitPrice = appliedPrice.getSalePrice().multiply(rate)
                    .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            convertedFromBase = !selectedUnit.getId().equals(baseUnit.getId());
        }

        BigDecimal lineTotal = request.quantity().multiply(unitPrice)
                .setScale(0, RoundingMode.HALF_UP);
        return new ResolvedPriceResponse(
                product.getId(), selectedUnit.getId(), selectedUnit.getUnitId(), unit.getUnitName(),
                request.quantity(), rate, baseQuantity, unitPrice, lineTotal,
                appliedPrice.getId(), appliedPrice.getRuleName(), convertedFromBase
        );
    }

    /**
     * Chụp giá hiện hành vào dòng đơn hàng. Sau khi dòng hàng được lưu, các lần
     * thay đổi giá catalog sau này không làm thay đổi unitPrice/lineTotal đã chụp.
     */
    public SalesOrderItem snapshotOrderItemPrice(String actorUsername, SalesOrderItem orderItem) {
        if (orderItem == null) {
            throw new BadRequestException("Dòng đơn hàng không được để trống");
        }
        Product product = findOwnedProduct(actorUsername, orderItem.getProductId());
        ResolvedPriceResponse resolved = resolve(actorUsername, new ResolvePriceRequest(
                orderItem.getProductId(), orderItem.getUnitId(), orderItem.getQuantity()
        ));
        Long taxGroupId = orderItem.getTaxActivityGroupId() != null
                ? orderItem.getTaxActivityGroupId()
                : product.getDefaultTaxActivityGroupId();
        if (taxGroupId == null) {
            throw new BadRequestException("Sản phẩm chưa được cấu hình nhóm hoạt động tính thuế");
        }
        TaxActivityGroup taxGroup = taxActivityGroupRepository.findByIdAndStatus(taxGroupId, ACTIVE)
                .filter(this::isEffectiveToday)
                .orElseThrow(() -> new BadRequestException(
                        "Nhóm hoạt động tính thuế không tồn tại hoặc chưa có hiệu lực"));
        orderItem.setConversionRate(resolved.conversionRate());
        orderItem.setBaseQuantity(resolved.baseQuantity());
        orderItem.setUnitPrice(resolved.unitPrice());
        orderItem.setLineTotal(resolved.lineTotal());
        orderItem.setProductPriceId(resolved.appliedPriceId());
        orderItem.setPricingRuleName(resolved.appliedRuleName());
        orderItem.setTaxActivityGroupId(taxGroup.getId());
        orderItem.setVatCalculationRate(taxGroup.getVatCalculationRate());
        orderItem.setPitCalculationRate(taxGroup.getPitCalculationRate());
        return orderItem;
    }

    private boolean isEffectiveToday(TaxActivityGroup group) {
        LocalDate today = LocalDate.now();
        return group.getEffectiveFrom() != null
                && !group.getEffectiveFrom().isAfter(today)
                && (group.getEffectiveTo() == null || !group.getEffectiveTo().isBefore(today));
    }

    @Transactional
    public void synchronizeForRateChange(
            String actorUsername,
            Long productId,
            Long productUnitId,
            BigDecimal oldRate,
            BigDecimal newRate
    ) {
        findOwnedProduct(actorUsername, productId);
        if (oldRate == null || oldRate.signum() <= 0 || newRate == null || newRate.signum() <= 0) {
            throw new BadRequestException("Tỷ lệ quy đổi không hợp lệ để đồng bộ giá");
        }
        Long actorId = requireActor(actorUsername).getId();
        LocalDateTime now = LocalDateTime.now();
        ProductPrice current = findCurrentPrice(productUnitId);
        if (current != null) {
            BigDecimal synchronizedPrice = current.getSalePrice()
                    .multiply(newRate)
                    .divide(oldRate, MONEY_SCALE, RoundingMode.HALF_UP);
            replacePrice(current, synchronizedPrice, current.getRuleName(), actorId, now);
        }
    }

    @Transactional
    public void deactivatePricesForUnit(
            String actorUsername,
            Long productId,
            Long productUnitId
    ) {
        findOwnedProduct(actorUsername, productId);
        Long actorId = requireActor(actorUsername).getId();
        LocalDateTime now = LocalDateTime.now();
        closeCurrentPrices(productUnitId, actorId, now);
    }

    private ProductPrice replacePrice(
            ProductPrice current,
            BigDecimal newPrice,
            String ruleName,
            Long actorId,
            LocalDateTime effectiveFrom
    ) {
        closeCurrentPrices(current.getProductUnitId(), actorId, effectiveFrom);
        return productPriceRepository.save(ProductPrice.builder()
                .productUnitId(current.getProductUnitId())
                .minimumQuantity(ONE_UNIT)
                .salePrice(newPrice)
                .ruleName(ruleName)
                .changedBy(actorId)
                .effectiveFrom(effectiveFrom)
                .status(ACTIVE)
                .build());
    }

    private ProductPrice findCurrentPrice(Long productUnitId) {
        return productPriceRepository
                .findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(productUnitId, ACTIVE)
                .stream()
                .findFirst()
                .orElse(null);
    }

    private void closeCurrentPrices(Long productUnitId, Long actorId, LocalDateTime effectiveTo) {
        for (ProductPrice activePrice : productPriceRepository
                .findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(productUnitId, ACTIVE)) {
            activePrice.setStatus(INACTIVE);
            activePrice.setEffectiveTo(effectiveTo);
            activePrice.setChangedBy(actorId);
            productPriceRepository.save(activePrice);
        }
    }

    private ProductPrice requireOwnedPrice(Long productId, Long priceId) {
        ProductPrice price = productPriceRepository.findById(priceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức giá"));
        productUnitRepository.findByIdAndProductId(price.getProductUnitId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức giá của sản phẩm"));
        return price;
    }

    private Product findOwnedProduct(String actorUsername, Long productId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private User requireActor(String actorUsername) {
        return userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }

    private ProductUnit requireActiveProductUnit(Long productId, Long productUnitId) {
        ProductUnit productUnit = productUnitRepository.findByIdAndProductId(productUnitId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính của sản phẩm"));
        if (!ACTIVE.equals(productUnit.getStatus())) {
            throw new BadRequestException("Đơn vị tính đã bị vô hiệu hóa");
        }
        return productUnit;
    }

    private List<ProductUnit> activeProductUnits(Long productId) {
        return productUnitRepository.findAllByProductIdAndStatusOrderByBaseUnitDesc(productId, ACTIVE);
    }

    private ProductPriceResponse toResponse(ProductPrice price, List<ProductUnit> productUnits) {
        ProductUnit productUnit = productUnits.stream()
                .filter(item -> item.getId().equals(price.getProductUnitId()))
                .findFirst()
                .orElseGet(() -> productUnitRepository.findById(price.getProductUnitId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính của sản phẩm")));
        Unit unit = requireUnit(productUnit.getUnitId());
        return new ProductPriceResponse(
                price.getId(), price.getProductUnitId(), productUnit.getUnitId(), unit.getUnitName(),
                price.getSalePrice(), price.getRuleName(), price.getStatus(),
                price.getEffectiveFrom(), price.getEffectiveTo(), price.getChangedBy()
        );
    }

    private Unit requireUnit(Long unitId) {
        return unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính"));
    }

    private String normalizePriceName(String ruleName) {
        if (ruleName != null && !ruleName.isBlank()) {
            return ruleName.trim();
        }
        return "Giá bán";
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.signum() < 0) {
            throw new BadRequestException("Đơn giá không được âm hoặc để trống");
        }
    }

    private void validateOrderQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("Số lượng đặt hàng phải lớn hơn 0");
        }
        if (quantity.stripTrailingZeros().scale() > QUANTITY_SCALE) {
            throw new BadRequestException("Số lượng đặt hàng chỉ được có tối đa 3 chữ số thập phân");
        }
        if (quantity.compareTo(MAX_ORDER_QUANTITY) > 0) {
            throw new BadRequestException("Số lượng đặt hàng không được vượt quá 15 chữ số");
        }
    }

    private void validateUnitQuantity(BigDecimal quantity, Unit unit) {
        String unitCode = unit.getUnitCode() == null ? "" : unit.getUnitCode().trim().toUpperCase();
        boolean allowsFraction = "KG".equals(unitCode) || "LIT".equals(unitCode);
        if (!allowsFraction && quantity.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException("Chỉ đơn vị kg và lít được phép nhập số lượng thập phân");
        }
    }
}
