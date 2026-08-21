package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryBalanceResponse;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class InventoryMovementService {

    private static final int QUANTITY_SCALE = 3;
    private static final int MONEY_SCALE = 2;

    private final BusinessContextService businessContextService;
    private final UnitConversionService unitConversionService;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryMovementService(
            BusinessContextService businessContextService,
            UnitConversionService unitConversionService,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            InventoryBalanceRepository balanceRepository,
            InventoryTransactionRepository transactionRepository
    ) {
        this.businessContextService = businessContextService;
        this.unitConversionService = unitConversionService;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.balanceRepository = balanceRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public InventoryBalanceResponse getBalance(String actorUsername, Long productId) {
        Context context = requireContext(actorUsername, productId);
        InventoryBalance balance = balanceRepository
                .findByBusinessIdAndProductId(context.businessId(), productId)
                .orElseGet(() -> emptyBalance(context.businessId(), productId));
        Unit baseUnit = requireActiveUnit(context.product().getBaseUnitId());
        return new InventoryBalanceResponse(
                productId,
                baseUnit.getId(),
                baseUnit.getUnitName(),
                balance.getQuantityOnHand(),
                balance.getAverageUnitCost(),
                balance.getInventoryValue()
        );
    }

    @Transactional
    public InventoryMovementResponse stockIn(String actorUsername, InventoryMovementRequest request) {
        if (request.getUnitCost() == null) {
            throw new BadRequestException("Đơn giá nhập không được để trống");
        }
        Context context = requireContext(actorUsername, request.getProductId());
        Conversion conversion = convertToBase(actorUsername, request, context.product());
        InventoryBalance balance = lockOrCreateBalance(context.businessId(), request.getProductId());

        BigDecimal transactionValue = request.getQuantity()
                .multiply(request.getUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal balanceAfter = balance.getQuantityOnHand().add(conversion.baseQuantity());
        BigDecimal inventoryValue = balance.getInventoryValue().add(transactionValue)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal averageCost = balanceAfter.signum() == 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE)
                : inventoryValue.divide(balanceAfter, MONEY_SCALE, RoundingMode.HALF_UP);

        updateBalance(balance, balanceAfter, averageCost, inventoryValue);
        InventoryTransaction transaction = saveTransaction(
                context, request, conversion, "STOCK_IN", "STOCK_IMPORT",
                conversion.baseQuantity(), balanceAfter, averageCost,
                transactionValue, inventoryValue
        );
        return toResponse(transaction, request, conversion, context.product(), balance);
    }

    @Transactional
    public InventoryMovementResponse stockOut(String actorUsername, InventoryMovementRequest request) {
        Context context = requireContext(actorUsername, request.getProductId());
        Conversion conversion = convertToBase(actorUsername, request, context.product());
        InventoryBalance balance = balanceRepository
                .findForUpdate(context.businessId(), request.getProductId())
                .orElseThrow(() -> new BadRequestException("Sản phẩm chưa có tồn kho"));
        if (balance.getQuantityOnHand().compareTo(conversion.baseQuantity()) < 0) {
            throw new BadRequestException("Số lượng xuất vượt quá số lượng tồn kho");
        }

        BigDecimal balanceAfter = balance.getQuantityOnHand().subtract(conversion.baseQuantity());
        BigDecimal transactionValue = conversion.baseQuantity()
                .multiply(balance.getAverageUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal inventoryValue = balanceAfter
                .multiply(balance.getAverageUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        updateBalance(balance, balanceAfter, balance.getAverageUnitCost(), inventoryValue);
        InventoryTransaction transaction = saveTransaction(
                context, request, conversion, "STOCK_OUT", "SALES_ORDER",
                conversion.baseQuantity().negate(), balanceAfter, balance.getAverageUnitCost(),
                transactionValue, inventoryValue
        );
        return toResponse(transaction, request, conversion, context.product(), balance);
    }

    private Context requireContext(String actorUsername, Long productId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        Product product = productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        return new Context(businessId, product, actor.getId());
    }

    private Conversion convertToBase(
            String actorUsername,
            InventoryMovementRequest request,
            Product product
    ) {
        Unit enteredUnit = requireActiveUnit(request.getUnitId());
        Unit baseUnit = requireActiveUnit(product.getBaseUnitId());
        BigDecimal rate = unitConversionService.getConversionRate(
                actorUsername, product.getId(), request.getUnitId()
        );
        BigDecimal baseQuantity = unitConversionService.toBaseQuantity(
                actorUsername, product.getId(), request.getUnitId(), request.getQuantity()
        );
        return new Conversion(rate, baseQuantity, enteredUnit, baseUnit);
    }

    private Unit requireActiveUnit(Long unitId) {
        return unitRepository.findByIdAndStatus(unitId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính"));
    }

    private InventoryBalance lockOrCreateBalance(Long businessId, Long productId) {
        return balanceRepository.findForUpdate(businessId, productId)
                .orElseGet(() -> balanceRepository.save(emptyBalance(businessId, productId)));
    }

    private InventoryBalance emptyBalance(Long businessId, Long productId) {
        return InventoryBalance.builder()
                .businessId(businessId)
                .productId(productId)
                .quantityOnHand(BigDecimal.ZERO.setScale(QUANTITY_SCALE))
                .averageUnitCost(BigDecimal.ZERO.setScale(MONEY_SCALE))
                .inventoryValue(BigDecimal.ZERO.setScale(MONEY_SCALE))
                .build();
    }

    private void updateBalance(
            InventoryBalance balance,
            BigDecimal quantity,
            BigDecimal averageCost,
            BigDecimal inventoryValue
    ) {
        balance.setQuantityOnHand(quantity.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP));
        balance.setAverageUnitCost(averageCost.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        balance.setInventoryValue(inventoryValue.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        balanceRepository.save(balance);
    }

    private InventoryTransaction saveTransaction(
            Context context,
            InventoryMovementRequest request,
            Conversion conversion,
            String transactionType,
            String referenceType,
            BigDecimal quantityChange,
            BigDecimal balanceAfter,
            BigDecimal unitCost,
            BigDecimal transactionValue,
            BigDecimal balanceValue
    ) {
        return transactionRepository.save(InventoryTransaction.builder()
                .businessId(context.businessId())
                .productId(context.product().getId())
                .unitId(request.getUnitId())
                .enteredQuantity(request.getQuantity())
                .conversionRate(conversion.rate())
                .createdBy(context.actorId())
                .transactionType(transactionType)
                .referenceType(referenceType)
                .referenceId(request.getReferenceId())
                .quantityChange(quantityChange)
                .balanceAfter(balanceAfter)
                .unitCost(unitCost)
                .transactionValue(transactionValue)
                .balanceValue(balanceValue)
                .costStatus("COSTED")
                .costedAt(LocalDateTime.now())
                .note(request.getNote())
                .build());
    }

    private InventoryMovementResponse toResponse(
            InventoryTransaction transaction,
            InventoryMovementRequest request,
            Conversion conversion,
            Product product,
            InventoryBalance balance
    ) {
        return new InventoryMovementResponse(
                transaction.getId(),
                product.getId(),
                conversion.enteredUnit().getId(),
                conversion.enteredUnit().getUnitName(),
                request.getQuantity(),
                conversion.rate(),
                conversion.baseUnit().getId(),
                conversion.baseUnit().getUnitName(),
                conversion.baseQuantity(),
                balance.getQuantityOnHand(),
                balance.getAverageUnitCost(),
                balance.getInventoryValue(),
                transaction.getTransactionType()
        );
    }

    private record Context(Long businessId, Product product, Long actorId) {
    }

    private record Conversion(
            BigDecimal rate,
            BigDecimal baseQuantity,
            Unit enteredUnit,
            Unit baseUnit
    ) {
    }
}
