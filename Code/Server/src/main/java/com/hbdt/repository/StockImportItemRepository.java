package com.hbdt.repository;

import com.hbdt.entity.StockImportItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockImportItemRepository extends JpaRepository<StockImportItem, Long> {

    List<StockImportItem> findAllByStockImportId(Long stockImportId);

    void deleteAllByStockImportId(Long stockImportId);
}
