# Platform to Support Digital Transformation for Household Businesses

English: Platform to Support Digital Transformation for Household Businesses  
Vietnamese: Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

---

# 1. Context

In Vietnam, household businesses play a vital role in the local economy, particularly in traditional industries such as:

- Building materials
- Construction supplies
- Hardware retail

Most of these businesses belong to Group 1 or Group 2 according to Decision 3389/QĐ-BTC (2025) issued by the Ministry of Finance.

Despite their importance, the majority of household businesses still rely on manual workflows, including:

- Recording sales using notebooks
- Managing inventory with Excel files
- Tracking customer debts manually
- Receiving orders through phone calls or Zalo

Most household businesses also have limited financial resources and cannot afford to hire professional accountants.

## Current Challenges

Although digital transformation is becoming increasingly important, existing POS and business management systems are mainly designed for:

- Restaurants
- Fashion retailers
- Supermarkets
- Large enterprises

These systems fail to address the unique characteristics of household businesses, such as:

- Multi-channel orders (walk-in customers and phone/Zalo orders)
- Long-term customer debt management
- Low digital literacy of business owners

Furthermore, many household businesses only own a single smartphone and lack hardware such as:

- Computers
- Barcode scanners
- Receipt printers
- POS terminals
- Cash drawers

As a result, existing POS systems are often too expensive and impractical.

Current manual operations cause numerous issues:

- Incorrect calculations
- Slow order processing
- Poor inventory tracking
- Inaccurate debt management
- No real-time business insights
- Low operational efficiency
- Financial risks
- Difficulty expanding the business

## Proposed Solution

Develop a web and/or mobile platform specifically designed for household businesses.

The platform integrates an AI-powered assistant capable of understanding natural language (text or voice) to:

- Automatically generate draft orders
- Auto-fill order information
- Assist bookkeeping
- Reduce manual work
- Minimize human errors
- Provide real-time business insights

---

# 2. Proposed Solution

Build a web and/or mobile application supporting the following roles.

# 2.1 Employee

Employees can:

- Login to the system
- Create at-counter orders quickly
- Search products
- Select product quantity
- Assign customer information
- Print sales orders
- Record customer debt
- Receive real-time notifications
- Review AI-generated draft orders
- Confirm or edit draft orders before processing

# 2.2 Owner

Owners inherit all Employee permissions and can additionally:

- Manage product catalog
- Manage inventory
- Manage customers
- View reports and analytics
- Manage employee accounts

# 2.3 Administrator

Administrators can:

- Manage owner accounts
- Manage subscription pricing
- Monitor platform analytics
- Manage system configurations
- Update accounting report templates
- Manage AI configuration
- Broadcast system announcements

# 2.4 System

The system automatically:

- Converts natural language into draft orders
- Performs bookkeeping
- Generates accounting reports
- Updates report templates according to government regulations

---

# 3. Functional Requirements

# 3.1 Employee Functions

## Login

Employees can log into the platform using their assigned account.

## Create At-Counter Orders

Employees can quickly create sales orders by:

- Searching products
- Selecting quantities
- Assigning customers (optional)
- Adding products into cart

The interface supports:

- Keyboard shortcuts
- Instant product filtering
- Fast checkout

## Record Customer Debt

If customers purchase on credit:

- Record debt directly during checkout
- Automatically update outstanding balance
- Save transaction history

## Print Sales Orders

After confirming an order:

- Generate printable invoices
- Use predefined bill templates
- Store invoices in the database

## Receive Real-Time AI Notifications

Whenever the AI assistant generates a draft order from:

- Voice commands
- Text messages

Employees immediately receive notifications.

## Review AI Draft Orders

Employees can:

- Review generated orders
- Edit information
- Approve
- Reject drafts

# 3.2 Owner Functions

Owners include every Employee capability plus the following.

## Manage Product Catalog

Owners can:

- Create products
- Update products
- Disable products
- Upload images
- Set categories
- Configure pricing
- Configure multiple units of measurement

Examples:

- Cement (bag)
- Cement (ton)

## Manage Inventory

Owners can:

- Record stock imports
- View inventory levels
- Track inventory history
- Monitor stock changes

Inventory is automatically deducted after successful order confirmation.

## Manage Customers

Owners can:

- Add customers
- Update customer information
- View purchase history
- Track outstanding debts
- Review payment logs

## Reports & Analytics

Interactive dashboards display:

- Daily revenue
- Weekly revenue
- Monthly revenue
- Best-selling products
- Low-stock alerts
- Outstanding debts

Visualization includes:

- Charts
- Summary cards
- Business KPIs

## Employee Management

Owners can:

- Create employee accounts
- Reset passwords
- Deactivate accounts
- Review audit logs

# 3.3 System Functions

## Natural Language Order Creation

The AI assistant understands commands such as:

> "Get 5 cement bags for Mr. Ba and put it on his tab."

The system automatically generates a draft order including:

- Customer
- Products
- Quantity
- Payment type
- Outstanding debt

## Automatic Bookkeeping

The platform automatically records:

- Sales
- Inventory imports
- Customer debts

Based on recorded transactions, it automatically generates accounting books required by Circular 88/2021/TT-BTC, including:

- Detailed Revenue Ledger
- Outstanding Debt Report
- Business Operations Report

Benefits:

- Eliminate manual Excel bookkeeping
- Ensure legal compliance
- Reduce accounting errors
- Save business owners significant time

The platform continuously updates report templates whenever government regulations change.

# 3.4 Administrator Functions

## Owner Account Management

Administrators can:

- Search owners
- Filter owners
- Activate accounts
- Deactivate accounts
- View detailed profiles

## Subscription Pricing Management

Administrators can configure pricing plans such as:

- Basic
- Pro
- Monthly subscriptions
- Annual subscriptions

## Platform Analytics

Administrators can monitor:

- Active users
- New subscriptions
- Platform revenue
- Business growth
- Customer feedback

## System & AI Configuration

Administrators manage:

- Global settings
- AI configuration
- Accounting templates
- System announcements

---

# 4. Non-Functional Requirements

## 4.1 Security & Privacy

- Protect household business data
- Secure customer information
- Role-based access control
- Employee, Owner, and Admin permissions
- Authentication and authorization

## 4.2 Performance & Scalability

- Response time under 2000 ms for core operations
- Support large product catalogs
- Support concurrent users
- Scalable architecture

## 4.3 Reliability & AI Accuracy

- AI-generated draft orders can be:
  - Reviewed
  - Edited
  - Rejected

- Manual operation remains available if AI services become unavailable.

## 4.4 Usability & Accessibility

The platform should provide:

- Responsive Web UI
- Mobile-friendly interface
- Vietnamese language support
- Unicode compatibility
- Simple workflows suitable for users with low digital literacy
- Real-time notifications

## 4.5 Compliance & Reporting

The platform automatically generates accounting reports compliant with:

Circular 88/2021/TT-BTC

Business owners may:

- Review reports
- Edit reports
- Reject reports

The platform guarantees continuous updates whenever tax authorities release new accounting report templates.

---

# 5. Deliverables

The project follows the complete software development lifecycle using UML 2.0.

Documentation includes:

- User Requirement
- Software Requirement Specification (SRS)
- Architecture Design
- Detailed Design
- System Implementation
- Testing Document
- Installation Guide
- Source Code
- Deployable Software Package