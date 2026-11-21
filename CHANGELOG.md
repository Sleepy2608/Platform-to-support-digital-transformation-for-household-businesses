# Changelog

All notable changes to the **HBDT Platform (Platform to Support Digital Transformation for Household Businesses)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Offline-first IndexedDB local sync for POS terminal during internet downtime.
- Multi-currency checkout adapter for cross-border e-commerce expansion.

---

## [1.0.0] - 2026-11-21

### Added
#### Core Business & Fast Sales POS
- **Fast Sales POS Terminal (`/employee/orders/new`)**: Rapid point-of-sale interface tailored for high-speed counter transactions, instant barcode/SKU search, responsive cart drawer, real-time total computation, and direct customer assignment.
- **Invoice Generation & Thermal/PDF Printing**: Export formatted invoices to PDF with statutory business metadata, tax codes, line items, and store branding.
- **Customer Debt & Bookkeeping Tracker (`/owner/customers`)**: End-to-end customer ledger tracking partial payments, store credit, debt increases, payment transactions, and historical balance forecasting.

#### Intelligent AI Ordering Microservice (FastAPI / Python 3.12)
- **Natural Language Order Parsing (`/api/v1/ai/parse-order`)**: AI assistant converting freeform Vietnamese text/chat messages into structured order drafts using B.ai (Qwen 3.8 Flash) with zero database mutation side effects.
- **Heuristic Regex Fallback Parser (`src/services/heuristic_parser.py`)**: Offline-resilient Vietnamese NLP parser supporting 30+ packaging units, word numbers (`hai`, `ba`, `nửa`), decimal quantities (`2,5`), customer mentions, and payment terms without external LLM dependencies.
- **Automated Bookkeeping AI Assistant (`/api/v1/ai/draft-bookkeeping`)**: Generates executive observations, ledger health summaries, and compliance alerts for business owners.

#### Statutory Accounting & Circular 88/2021/TT-BTC Engine
- **Statutory Ledgers**: Complete automated generation and export (CSV/Excel/PDF) for:
  - `S1-HKD`: Detailed Sales Revenue Ledger.
  - `S2-HKD`: Materials, Supplies, and Finished Goods Inventory Ledger.
  - `S4-HKD`: Statutory Tax and State Budget Obligations Ledger.
- **Vietnamese Tax Policy Engine 2026**: Multi-tier tax assessment computing VAT & PIT against cumulative revenue thresholds (500M, 3B, 50B VND) with configurable Tax Rule Versioning.
- **Ledger Review Workflow**: Owner/Manager approval lifecycle: review, inline edit, reject with comments, and audit sign-off.

#### Inventory & Warehouse Management
- **Multi-unit Conversion & Stock Import (`/owner/products/stock-import`)**: Support for primary and packaging conversion units (e.g., 1 Box = 24 Cans), purchase cost tracking, and supplier logging.
- **Real-time Inventory Balance & Low Stock Alerts**: Automatic stock deduction on sale, automatic stock restoration on cancellation, manual stock adjustment modals, and configurable minimum inventory thresholds.

#### Pluggable Payment & Webhook Architecture
- **Domestic Banking & VietQR Webhook Gateway**: Integration with SePay gateway for dynamic VietQR generation with embedded order codes, amount verification, and automated background reconciliation.
- **Pluggable Architecture**: Clear interface boundaries allowing extension with international gateways (Stripe, PayPal) or local Mock test gateways.

#### Backend Observability & API Documentation
- **Interactive OpenAPI 3.0 / Swagger UI (`/swagger-ui.html`, `/v3/api-docs`)**: Integrated Springdoc OpenAPI with discrete grouped API definitions (`public`, `owner`, `employee`, `manager`, `admin`) and JWT Bearer security schemes.
- **Spring Boot Actuator (`/actuator/health`, `/actuator/info`)**: Cloud-native healthcheck and runtime diagnostics, integrated with Docker Compose container orchestration.
- **Official Postman Collection (`docs/api/`)**: Comprehensive Postman Collection v2.1 and local environment with automated JWT extraction scripts for instant API exploration.

#### Frontend UX Resiliency & Progressive Web App (PWA)
- **App Router Error Boundary (`app/error.tsx`)**: Global React `'use client'` boundary intercepting runtime exceptions with component retry, page reload, and expandable diagnostics.
- **Custom 404 Page (`app/not-found.tsx`)**: Dark-Tech styled page with animated compass centerpiece, bilingual guidance, and quick navigation shortcuts.
- **App Router Suspense Loader (`app/loading.tsx`)**: Shimmering brand loading animation and skeleton wireframes for smooth route transitions.
- **PWA Web App Manifest (`app/manifest.ts`)**: Enables desktop and mobile browser installation as a standalone POS terminal with native task shortcuts.
- **Frontend Environment Template (`.env.example`)**: Clean configuration template for Next.js client developers.

#### DevOps & CI/CD Pipeline
- **GitHub Actions Multi-service Matrix Pipeline (`.github/workflows/ci.yml`)**: Continuous integration testing all 3 tiers in parallel (Spring Boot Maven test, Next.js build & TypeScript verification, Python compileall & unittest).
- **Docker Compose 4-Tier Stack (`docker-compose.yml`)**: Production-ready container orchestration for MySQL 8.0, Spring Boot 3.3.4, Next.js 16, and FastAPI AI Service with native healthchecks.

### Changed
- **Open-Source License Transition**: Formally transitioned repository license from GNU AGPLv3 to the permissive **MIT License** (`LICENSE`), broadening adoption and enterprise evaluation suitability.
- **Bilingual Documentation**: Published comprehensive English documentation ([`README.en.md`](README.en.md)) alongside Vietnamese documentation ([`README.md`](README.md)).

### Security
- **Strict Role-Based Access Control (RBAC)**: Enforced multi-tenant isolation across 4 discrete tiers: `ADMINISTRATOR`, `MANAGER`, `BUSINESS_OWNER`, and `EMPLOYEE`.
- **Zero-Exposure Credential Hygiene**: API keys, JWT signing secrets, and database credentials isolated into `.env` files; sanitized error payloads preventing provider credential leakage.
