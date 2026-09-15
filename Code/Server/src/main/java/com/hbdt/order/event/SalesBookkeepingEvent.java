package com.hbdt.order.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Event published after a sales order is successfully recorded in bookkeeping.
 * Used by ReportAggregationService to automatically refresh or create financial reports.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SalesBookkeepingEvent {
    private Long businessId;
    private Long orderId;
}
