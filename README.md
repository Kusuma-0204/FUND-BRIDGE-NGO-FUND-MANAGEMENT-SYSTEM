# FUND BRIDGE – NGO Fund Management System

Fund Bridge is a transparent, secure, full-stack fund management platform engineered for Non-Governmental Organizations (NGOs), donors, volunteers, and beneficiary communities. The application tracks every single donation from collection to on-ground disbursement, maintains an immutable audit trail, issues instant 80G tax receipts, and provides role-based portal access with a 3-step OTP password reset flow delivered directly to the user's email.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Interface                       │
│  - Public Portal: Cause Discovery, Donations & Tracking    │
│  - NGO Portal: Financial Ledgers, Approvals & Audits       │
│  - Interactive Charts: Inflow vs Outflow & Cause Breakdown │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API (JSON / Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js Server                        │
│  - Security: Helmet, CORS, Express Rate-Limiters            │
│  - RBAC: Administrator, Donor, Volunteer, Beneficiary       │
│  - Nodemailer Engine: SMTP + Ethereal Preview Fallback      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Data Persistence                       │
│  - MySQL Database Driver (Pooled Connections)               │
│  - Auto-Fallback In-Memory DataStore with Seed Records      │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Role-Based Access Control (RBAC)

The system enforces strict permission boundaries across four distinct user roles:

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Administrator** | Full system control: verify & pay expenses, update NGO registration & 80G settings, manage users, audit logs, and view full financial reports. |
| **Donor Member** | Access personal donation history, download official 80G tax exemption receipts, inspect public treasury audits, and update profile details. |
| **Volunteer Staff** | Field operations: inspect grant applications, submit vendor expense receipts, view allocated project budgets, and perform preliminary audits. |
| **Beneficiary Partner** | Apply for institutional or medical aid grants, track status via tracking reference codes, and view communication updates. |

---

## 🔐 Authentication & Password Reset Flow

The password reset workflow adheres to the user request: **reset emails and verification OTPs are delivered directly to the user's email address**, never to an administrator.

1. **Step 1: Request Reset Code (`POST /api/auth/forgot-password`)**
   - User inputs their registered email address.
   - The system verifies the user exists, generates a secure cryptographically random 6-digit OTP and expiration timestamp (15 minutes).
   - An email is dispatched to the user containing the OTP verification code and direct recovery instructions.
2. **Step 2: Verify Code (`POST /api/auth/verify-otp`)**
   - The user inputs the 6-digit code.
   - The system verifies the OTP matches and has not expired.
   - Upon verification, an authenticated `resetToken` is issued.
3. **Step 3: Update Password (`POST /api/auth/reset-password`)**
   - The user supplies their new password (hashed with `bcrypt`).
   - All active sessions are updated, security audit logs record the password change, and the user can immediately log in.

---

## 🚀 Preconfigured Demo Accounts

For demonstration, the following accounts are pre-seeded in the database (`database/seed.sql` & `database/db.ts`):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `aadminngo@gmail.com` | `password123` |
| **University Donor** | `o220786@rguktong.ac.in` | `password123` |
| **Donor Member** | `donor.aarav@example.com` | `password123` |
| **Volunteer Staff** | `volunteer.elena@example.org` | `password123` |
| **Beneficiary Partner**| `partner.clinic@example.org` | `password123` |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new account with role selection.
- `POST /api/auth/login`: Authenticate email and password, returns JWT token.
- `POST /api/auth/forgot-password`: Generate and email 6-digit OTP code to user.
- `POST /api/auth/verify-otp`: Validate 6-digit OTP and issue short-lived reset token.
- `POST /api/auth/reset-password`: Update password using verified reset token.
- `PUT /api/auth/change-password`: Update password for authenticated user session.
- `POST /api/auth/logout`: Revoke active token session.

### Financials & Treasury (`/api/dashboard`, `/api/donations`, `/api/expenses`)
- `GET /api/dashboard/stats`: Returns total raised, total disbursed, balance, donor counts, monthly chart points, and cause distributions.
- `GET /api/donations`: List verified donations with filtering by category and date.
- `POST /api/donations`: Process donation, update treasury ledger, and generate 80G tax receipt.
- `GET /api/donations/:id`: Retrieve single donation transaction with tax certificate details.
- `GET /api/expenses`: Query expense claims and disbursement ledger.
- `POST /api/expenses`: Log expense claim with title, vendor, category, and receipt attachment.
- `PUT /api/expenses/:id`: Audit and disburse expense (*Admin & Volunteer restricted*).
- `DELETE /api/expenses/:id`: Void claim (*Admin only*).

### Grant Requests & Tracking (`/api/requests`)
- `GET /api/requests`: List aid applications.
- `GET /api/requests/track/:code`: Public endpoint to track grant review and disbursement progress.
- `POST /api/requests`: Submit new application for relief or institutional grants.
- `PUT /api/requests/:id`: Update review status, add auditor notes, and approve disbursement (*Admin only*).

### Communication & Administration (`/api/messages`, `/api/users`, `/api/notifications`, `/api/settings`)
- `POST /api/messages`: Submit public inquiries or support requests.
- `GET /api/messages`: List inquiries (*Admin & Staff*).
- `GET /api/users/profile`: Retrieve profile information for logged-in user.
- `PUT /api/users/profile`: Update name, phone, or biography.
- `GET /api/notifications`: Retrieve in-app alerts and notifications.
- `PUT /api/notifications/:id/read`: Mark notification as read.
- `GET /api/audit-logs`: Review system activity and security audit trail (*Admin only*).
- `GET /api/settings`: Retrieve NGO registration details, tax identifiers, and payment configurations.
- `PUT /api/settings`: Update NGO details (*Admin only*).
- `POST /api/settings/reset-demo-data`: Reset all database records back to the default seed state.

---

## 🛠️ Exporting & Running Locally

### 1. Prerequisites
- **Node.js 18+** and **npm** installed.
- *(Optional)* **MySQL 8.0+**. If MySQL is not running, the server automatically activates its integrated in-memory data store pre-seeded with all accounts and transactions.

### 2. Install Dependencies
Open a terminal in the exported project folder and run:
```bash
npm install
```

### 3. Environment Configuration (`.env`)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your local settings:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fund_bridge
JWT_SECRET=fund_bridge_super_secret_jwt_key_2026_change_in_prod

# Live Email Delivery (Gmail App Password or SMTP Server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_digit_gmail_app_password
MAIL_FROM=Fund Bridge Support <noreply@ngofunds.org>
```

### 4. (Optional) Initialize MySQL Database
If you want to use a local MySQL server instead of the built-in store, run:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p fund_bridge < database/seed.sql
```

### 5. Start the Full-Stack Application
```bash
# Development mode (Frontend + Express API on port 3000)
npm run dev
```
Then open **`http://localhost:3000`** in your browser.

### 6. Production Build & Start
```bash
# Build frontend assets and bundle backend server
npm run build

# Start production server
npm start
```
