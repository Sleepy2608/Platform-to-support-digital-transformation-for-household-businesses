-- Migration: Create or update subscriptions table to support Subscription Lifecycle
-- Feature: Task 1 - Subscription Lifecycle & Database
-- Run this on your household_business_platform database

USE `household_business_platform`;

DROP TABLE IF EXISTS `subscriptions`;

CREATE TABLE `subscriptions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Owner/User ID referencing users(id)',
  `package_id` BIGINT UNSIGNED NOT NULL COMMENT 'Package/Plan ID referencing subscription_plans(id)',
  `status` VARCHAR(20) NOT NULL COMMENT 'PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED',
  `billing_cycle` VARCHAR(20) NULL COMMENT 'MONTHLY, YEARLY',
  `start_date` DATE NOT NULL COMMENT 'Subscription start date',
  `end_date` DATE NULL COMMENT 'Subscription end date',
  `cancelled_at` DATETIME NULL COMMENT 'Time when subscription was cancelled',
  `cancellation_reason` VARCHAR(500) NULL COMMENT 'Reason for cancellation if cancelled',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscriptions_package` FOREIGN KEY (`package_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
