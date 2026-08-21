package com.hbdt.repository;

import com.hbdt.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductPriceRepository extends JpaRepository<ProductPrice, Long> {

    List<ProductPrice> findAllByProductUnitIdInAndStatusOrderByProductUnitIdAscEffectiveFromDesc(
            Collection<Long> productUnitIds,
            String status
    );

    List<ProductPrice> findAllByProductUnitIdInOrderByCreatedAtDesc(Collection<Long> productUnitIds);

    List<ProductPrice> findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(
            Long productUnitId,
            String status
    );

    Optional<ProductPrice> findByIdAndProductUnitId(Long id, Long productUnitId);

}
