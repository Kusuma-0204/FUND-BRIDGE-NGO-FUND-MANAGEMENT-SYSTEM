-- =============================================================================
-- FUND BRIDGE: Database Seed Data
-- Default passwords for seed accounts: "password123"
-- (bcrypt hash: $2a$10$7zB3c.7/W/a3E2n0wFzGDuF8XU9zZf7Z3l21u2yH3O4J5K6L7M8N9)
-- =============================================================================

USE `fund_bridge`;

-- -----------------------------------------------------------------------------
-- Seed: Roles
-- -----------------------------------------------------------------------------
INSERT INTO `roles` (`name`, `description`) VALUES
('Administrator', 'Full system access, audits, user and ledger governance'),
('Donor Member', 'Tax-exempt contributions, receipts and donation ledger'),
('Volunteer Staff', 'Field assessments, relief camp audits and verification'),
('Beneficiary Partner', 'Community grant applications and status tracking')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- -----------------------------------------------------------------------------
-- Seed: Users (Default password: password123)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `phone`, `bio`, `avatar`, `kyc_verified`, `status`, `member_since`, `audits_approved`) VALUES
('user-admin', 'Dr. Sarah Jenkins', 'aadminngo@gmail.com', '$2a$10$qR69V7aN.4PZ2Gk0s3H2Q.QZkJ0W4p4dFk7J5uH3l2A1B4c7D0eF2', 'Administrator', '+1 (555) 019-2834', 'Certified Public Accountant & Non-Profit Governance Director with 14 years field experience.', 'SJ', 1, 'active', '2021', 42),
('user-donor-1', 'Aarav Sharma', 'donor.aarav@example.com', '$2a$10$qR69V7aN.4PZ2Gk0s3H2Q.QZkJ0W4p4dFk7J5uH3l2A1B4c7D0eF2', 'Donor Member', '+1 (555) 728-1920', 'Angel philanthropist & clean water access supporter.', 'AS', 1, 'active', '2023', 12),
('user-volunteer-1', 'Elena Rostova', 'volunteer.elena@example.org', '$2a$10$qR69V7aN.4PZ2Gk0s3H2Q.QZkJ0W4p4dFk7J5uH3l2A1B4c7D0eF2', 'Volunteer Staff', '+1 (555) 349-2018', 'Emergency disaster response coordinator & medic.', 'ER', 1, 'active', '2024', 28),
('user-beneficiary-1', 'Sister Mary Teresa Clinic', 'partner.clinic@example.org', '$2a$10$qR69V7aN.4PZ2Gk0s3H2Q.QZkJ0W4p4dFk7J5uH3l2A1B4c7D0eF2', 'Beneficiary Partner', '+1 (555) 441-2911', 'Rural pediatric healthcare dispensary.', 'SM', 1, 'active', '2025', 4)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- -----------------------------------------------------------------------------
-- Seed: System Settings
-- -----------------------------------------------------------------------------
INSERT INTO `system_settings` (`id`, `ngo_name`, `reg_number`, `tax_80g`, `currency`, `upi_id`, `enable_upi`, `enable_card`, `auto_80g`)
VALUES (1, 'Fund Bridge NGO Global Foundation', 'NGO-2018-NY-98442', '80G-EXEMPT-2026-B94', '₹', '9391514815@pthdfc', 1, 1, 1)
ON DUPLICATE KEY UPDATE `ngo_name` = VALUES(`ngo_name`);

-- -----------------------------------------------------------------------------
-- Seed: Donations
-- -----------------------------------------------------------------------------
INSERT INTO `donations` (`id`, `donor_id`, `donor_name`, `donor_email`, `amount`, `category`, `payment_method`, `payment_reference`, `tax_exemption_80g`, `is_anonymous`, `status`, `donation_date`, `notes`) VALUES
('DON-2026-001', 'user-donor-1', 'Aarav Sharma', 'donor.aarav@example.com', 500.00, 'Healthcare Camps', 'UPI / QR Code', 'UPI-TXN-984210', 1, 0, 'Completed', '2026-09-12', 'Pediatric clinic supplies fund'),
('DON-2026-002', NULL, 'Global Health Trust', 'donations@ghtrust.org', 2500.00, 'Disaster Relief', 'Bank Wire', 'WIRE-B94102-US', 1, 0, 'Completed', '2026-09-13', 'Flood relief shelters'),
('DON-2026-003', NULL, 'Miriam Al-Mansoor', 'miriam.m@example.com', 250.00, 'Child Education', 'Card / Stripe', 'STRIPE-CH-38910', 1, 0, 'Completed', '2026-09-14', 'Textbook and digital learning sponsorship'),
('DON-2026-004', NULL, 'Anonymous Well-Wisher', 'anon@securemail.org', 1000.00, 'Food & Nutrition', 'UPI / QR Code', 'UPI-TXN-881920', 1, 1, 'Completed', '2026-09-15', 'Community dry kitchen rations'),
('DON-2026-005', 'user-donor-1', 'Aarav Sharma', 'donor.aarav@example.com', 100.00, 'General Fund', 'UPI / QR Code', 'UPI-TXN-772109', 1, 0, 'Completed', '2026-09-16', 'Monthly recurrent contribution')
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- -----------------------------------------------------------------------------
-- Seed: Expenses
-- -----------------------------------------------------------------------------
INSERT INTO `expenses` (`id`, `title`, `category`, `amount`, `vendor`, `expense_date`, `submitted_by`, `audited_by`, `status`, `notes`) VALUES
('EXP-2026-001', 'Emergency Insulin & Vaccine Cold Storage Units', 'Healthcare Camps', 1450.00, 'Apex Med Logistics Ltd', '2026-09-10', 'user-volunteer-1', 'Dr. Sarah Jenkins', 'Verified & Paid', 'Dispatched to Greenfield Mobile Clinic'),
('EXP-2026-002', '500 Sets High-School STEM Workbooks & Geometry Kits', 'Child Education', 880.00, 'Scholastic Direct Press', '2026-09-11', 'user-admin', 'Internal Audit Desk', 'Verified & Paid', 'Delivered to district school zones'),
('EXP-2026-003', '100 Waterproof All-Weather Relief Family Tents', 'Disaster Relief', 3200.00, 'ShelterCraft Industries', '2026-09-13', 'user-volunteer-1', 'Dr. Sarah Jenkins', 'Verified & Paid', 'Cyclone aftermath emergency shelter'),
('EXP-2026-004', 'Clean Drinking Water RO Filtration Modules (5 units)', 'Clean Water', 1750.00, 'AquaPure Engineering', '2026-09-15', 'user-volunteer-1', 'Dr. Sarah Jenkins', 'Verified & Paid', 'Village community bore-wells')
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- -----------------------------------------------------------------------------
-- Seed: Requests
-- -----------------------------------------------------------------------------
INSERT INTO `requests` (`id`, `requester_id`, `tracking_code`, `applicant_name`, `organization`, `category`, `urgency`, `amount`, `purpose`, `status`, `reviewed_by`, `audit_remarks`) VALUES
('REQ-2026-8941', 'user-beneficiary-1', 'REQ-2026-8941', 'Sister Mary Teresa', 'St. Jude Rural Dispensary', 'Healthcare', 'Emergency', 2400.00, 'Immediate replenishment of asthma respirators and anti-venom vials for monsoon season in remote tribal hamlets.', 'Approved & Disbursed', 'Dr. Sarah Jenkins', 'Field verified by volunteer Elena. Invoice paid via Bank Wire on Sept 14.'),
('REQ-2026-9022', NULL, 'REQ-2026-9022', 'Principal Rajesh Kothari', 'Adarsh Primary School', 'Education', 'Normal', 1200.00, 'Setup of solar-powered digital tablets for 60 primary students lacking electricity.', 'Field Verified', 'Elena Rostova', 'Audit in progress; supplier quotation received and validated.'),
('REQ-2026-9104', NULL, 'REQ-2026-9104', 'Maria Gonzalez', 'Hope Community Food Bank', 'Food & Nutrition', 'Urgent', 1850.00, 'Procurement of staple rice, lentils, and clean cooking oil for 300 displaced migrant laborer households.', 'Pending Review', NULL, 'Awaiting document upload.')
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- -----------------------------------------------------------------------------
-- Seed: Notifications
-- -----------------------------------------------------------------------------
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`) VALUES
('notif-1', NULL, 'Mobile Clinic Deployed', 'Free pediatric health camp active in Greenfield sector.', 'success', 0),
('notif-2', NULL, 'Aid Disbursed: $2,400', 'Emergency medication fund for St. Jude Dispensary delivered.', 'info', 0),
('notif-3', 'user-admin', 'Audit Report Verified', 'Q2 2026 100% transparent financial audit published.', 'warning', 0);

-- -----------------------------------------------------------------------------
-- Seed: Messages
-- -----------------------------------------------------------------------------
INSERT INTO `messages` (`id`, `sender_name`, `sender_email`, `subject`, `message`, `is_read`) VALUES
('msg-1', 'Arthur Pendelton', 'arthur.p@crestview.org', 'Corporate CSR Matching Inquiry', 'Our corporate foundation matches employee gifts up to $50,000 per year. We would like to initiate an institutional partnership for child digital literacy programs in 2026-2027.', 0),
('msg-2', 'Siddharth Rao', 'siddharth@greencities.in', 'Volunteer Doctor Network', 'I am an emergency room surgeon willing to offer pro bono consultation hours at your upcoming mobile camps. Please send the volunteer roster.', 0);
