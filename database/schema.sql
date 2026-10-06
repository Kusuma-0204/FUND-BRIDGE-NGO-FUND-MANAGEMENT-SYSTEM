-- =============================================================================
-- FUND BRIDGE: NGO Fund Management System
-- Database Schema: MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `fund_bridge` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fund_bridge`;

-- -----------------------------------------------------------------------------
-- Table: roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Donor Member',
  `phone` VARCHAR(30) NULL,
  `bio` TEXT NULL,
  `avatar` VARCHAR(10) NULL,
  `kyc_verified` TINYINT(1) DEFAULT 1,
  `status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `member_since` VARCHAR(10) DEFAULT '2026',
  `audits_approved` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: donations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `donations` (
  `id` VARCHAR(64) PRIMARY KEY,
  `donor_id` VARCHAR(64) NULL,
  `donor_name` VARCHAR(120) NOT NULL,
  `donor_email` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General Fund',
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'UPI / QR Code',
  `payment_reference` VARCHAR(100) NULL,
  `tax_exemption_80g` TINYINT(1) DEFAULT 1,
  `is_anonymous` TINYINT(1) DEFAULT 0,
  `status` ENUM('Completed', 'Pending', 'Failed') NOT NULL DEFAULT 'Completed',
  `donation_date` VARCHAR(30) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_donations_donor` (`donor_id`),
  INDEX `idx_donations_date` (`donation_date`),
  INDEX `idx_donations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: expenses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `vendor` VARCHAR(150) NOT NULL,
  `expense_date` VARCHAR(30) NOT NULL,
  `submitted_by` VARCHAR(64) NULL,
  `audited_by` VARCHAR(120) NOT NULL DEFAULT 'Internal Audit Desk',
  `status` ENUM('Verified & Paid', 'Pending Audit', 'Rejected') NOT NULL DEFAULT 'Verified & Paid',
  `receipt_url` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_expenses_category` (`category`),
  INDEX `idx_expenses_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `requests` (
  `id` VARCHAR(64) PRIMARY KEY,
  `requester_id` VARCHAR(64) NULL,
  `tracking_code` VARCHAR(50) NOT NULL UNIQUE,
  `applicant_name` VARCHAR(120) NOT NULL,
  `organization` VARCHAR(150) NULL,
  `category` VARCHAR(100) NOT NULL,
  `urgency` ENUM('Normal', 'Urgent', 'Emergency') NOT NULL DEFAULT 'Normal',
  `amount` DECIMAL(12, 2) NOT NULL,
  `purpose` TEXT NOT NULL,
  `status` ENUM('Pending Review', 'Field Verified', 'Approved & Disbursed', 'Rejected') NOT NULL DEFAULT 'Pending Review',
  `reviewed_by` VARCHAR(120) NULL,
  `audit_remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_requests_tracking` (`tracking_code`),
  INDEX `idx_requests_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: messages (Contact Inquiries)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `sender_name` VARCHAR(120) NOT NULL,
  `sender_email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_messages_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: password_reset_otps
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `attempts` INT DEFAULT 0,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otps_email` (`email`),
  INDEX `idx_otps_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: password_reset_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tokens_email` (`email`),
  INDEX `idx_tokens_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: system_settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `ngo_name` VARCHAR(150) NOT NULL DEFAULT 'Fund Bridge NGO Global Foundation',
  `reg_number` VARCHAR(100) NOT NULL DEFAULT 'NGO-2018-NY-98442',
  `tax_80g` VARCHAR(100) NOT NULL DEFAULT '80G-EXEMPT-2026-B94',
  `currency` VARCHAR(10) NOT NULL DEFAULT '₹',
  `upi_id` VARCHAR(100) NOT NULL DEFAULT '9391514815@pthdfc',
  `enable_upi` TINYINT(1) DEFAULT 1,
  `enable_card` TINYINT(1) DEFAULT 1,
  `auto_80g` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
