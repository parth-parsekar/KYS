# KYS – Know Your Subscription Manager

> **"Know what you're subscribed to, understand where your money goes, and never be surprised by your next renewal."**

KYS is a centralized subscription management and spending intelligence web platform built strictly according to **KYS PRD v2.0** and the accompanying **wireframe mockups (Screens 01–23)**.

---

## 🌟 Key Features & Requirements Implementation

### 1. Authentication & Role-Based Access Control (RBAC) – P0
- **JWT-based Authentication**: Secure user registration, login, and session validation.
- **Secure Password Hashing**: Utilizes `bcryptjs` with salt rounds.
- **Roles**:
  - `user`: Standard subscriber with private workspace, managing personal subscriptions and budgets.
  - `admin`: Platform administrator with access to aggregate platform usage metrics (`/admin`), strictly isolated from personal spending records.
- **Data Isolation & Privacy**: Users can only access their own subscription records. Bank account numbers and card details are never stored or collected.

### 2. Service Catalog & Subscription CRUD – P0
- **Preset Catalog**: Pre-populated catalog with Netflix, Spotify, AWS, GitHub Copilot, Notion, Dropbox, Adobe, Slack, Zoom, iCloud, YouTube, Linear, etc.
- **Smart Autofill**: Auto-populates suggested pricing, category, logo, and frequency with clear disclaimers that prices are suggestions.
- **Custom Subscriptions**: Full support for custom subscriptions not in the catalog.
- **Full Lifecycle Management**:
  - `Active`: Included in monthly and annual spending totals, with renewal alerts enabled.
  - `Paused`: Excluded from spending totals; renewal alerts paused; prompts for next renewal date upon resuming.
  - `Cancelled`: Excluded from spending totals; marks tracking record as cancelled with reminders to cancel directly with provider.
  - `Expired`: Excluded from totals; alert updates required to reactivate.
- **Monthly Equivalent Formula**:
  - `Yearly` ÷ 12
  - `Quarterly` ÷ 3
  - `Weekly` × 52 ÷ 12
  - `Monthly` = amount

### 3. Spending Analytics & Visualizations – P1
- **MongoDB Aggregation Pipelines**:
  - Monthly active recurring expenditure.
  - Annualized subscription expenditure (`monthlySpending * 12`).
  - Category-wise spending distribution.
  - Upcoming renewal expenditure in next 7 days.
  - Monthly budget utilization.
  - 12-month historical expenditure trends.
- **Visualizations with Recharts**:
  - Monthly spending 12-month line chart.
  - Category distribution donut chart with active center metric.
  - Monthly expenditure bar chart with latest month highlight.
  - Budget utilization progress indicator.

### 4. Monthly Budget Management – P1
- Set monthly limits in preferred currency.
- Configurable threshold alerts (e.g. 80%).
- Real-time spend tracking and remaining budget calculations.
- Automatic threshold crossing detection with persistent alerts.

### 5. Renewal Notifications & Real-Time Socket.IO – P1
- **Background Scheduler**: Checks upcoming renewal dates every 6 hours and on demand.
- **3-Day Renewal Alerts**: Identifies active subscriptions due within 3 days.
- **Duplicate Prevention**: Guaranteed uniqueness via `renewalCycleIdentifier` index (`${subId}_${cycleDate}`).
- **Real-time Delivery**: Instant push alerts to connected clients via Socket.IO; persistent offline alerts saved in MongoDB and delivered upon reconnect.

### 6. Admin Dashboard – P2
- Strictly aggregate reporting: Total users, Active subscriptions, New users (last 30 days), Subscriptions per user, 6-month platform trend chart, Platform summary, Category distribution table.
- **Data Export**: Export aggregate platform report as JSON.
- **Zero Privacy Leakage**: No user-private records or payment credentials exposed to admin endpoints.

### 7. Empty & Recovery States
- Implements all 9 empty, validation, and recovery states depicted in **Wireframe Screen 12**:
  1. *No subscriptions yet*
  2. *No catalog matches*
  3. *No billing history*
  4. *Could not save subscription*
  5. *Reconnecting to notifications*
  6. *Your session has expired*
  7. *Admin access required*
  8. *Check subscription details*
  9. *Unable to sign in*

---

## 📐 Wireframe Screen Mapping

| Screen | Wireframe ID | View / Feature | URL Route |
|---|---|---|---|
| 01 | Desktop Dashboard | Dashboard with Stat Cards, 12M Bar Chart, Budget Card, Renewals Table, Category list | `/` |
| 02 | Desktop Subscriptions | 3-Column Card Grid, Filter Toolbar, Status Tabs (All, Active, Paused, Cancelled, Expired) | `/subscriptions` |
| 03 | Desktop Add Subscription | 2-Column Quick-Add Catalog + Custom Entry Form with suggested price disclaimers | `/add` |
| 04 | Desktop Analytics | 12-Month Line Chart, Monthly Bar Chart, Category Donut Chart, Budget Tracking | `/analytics` |
| 05 | Desktop Notifications | Unread/Read Filter Tabs, Today vs. Earlier sections, Settings Card, Socket Status Card | `/notifications` |
| 06 | Desktop Admin Dashboard | Platform KPIs, 6-Month Active Subs Chart, Platform Summary, Category Distribution | `/admin` |
| 07 | Desktop Sign In | Value propositions (01, 02, 03) on left, Sign-in card with quick demo logins on right | `/login` |
| 08 | Desktop Create Account | Value propositions on left, Registration form with currency & timezone on right | `/register` |
| 09 | Desktop Subscription Details | Service overview, Metadata table, Billing history with manual record modal, Edit form | `/subscriptions/:id` |
| 10 | Desktop Lifecycle Modals | Interactive dialogs for Pause, Resume (date picker), Cancel, and Delete | In-app modals |
| 11 | Desktop Preferences & Budget | Account preferences card (name, currency, timezone) + Monthly spending budget card | `/preferences` |
| 12 | Desktop Empty & Recovery States | 3x3 Grid showcasing all 9 system empty/error/recovery states | `/empty-states` |
| 13–22 | Mobile Responsive Views | Full mobile responsive parity for Dashboard, Subscriptions, Add, Analytics, Notifications, Admin, Auth | Same routes |
| 23 | Mobile Navigation Drawer | Sliding mobile navigation menu with personal workspace info, quick links, and admin variant | Mobile menu toggle |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/KYS.git
cd KYS

# Install dependencies for both backend and frontend
npm run install:all
```

### Running Locally
You can run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

> **Zero-Configuration Embedded Database**: If no `MONGODB_URI` environment variable is supplied, the backend automatically boots an in-memory MongoDB instance with pre-seeded demo records matching the wireframes!
> To connect to **MongoDB Atlas**, simply set `MONGODB_URI` in `backend/.env`.

---

## 🔑 Demo Accounts

The application automatically seeds standard test credentials:

| Role | Name | Email | Password | Pre-seeded Dataset |
|---|---|---|---|---|
| **User** | Alex Morgan | `alex@example.com` | `password123` | 15 subscriptions ($248/mo active total matching Screen 01 & 02), 5 notifications, billing history |
| **Admin** | Morgan Lee | `admin@kys.app` | `admin123` | Authorized admin role with full access to Platform Admin Dashboard |

---

## 🧪 Automated Testing

KYS includes integration and unit tests covering all P0/P1/P2 PRD acceptance criteria:
```bash
npm run test:backend
```

Tests verify:
1. User registration & JWT authentication
2. Service catalog querying & category filtering
3. Subscription CRUD operations & monthly equivalent calculation
4. Privacy & ownership isolation (Users cannot access other users' records)
5. Spending analytics and aggregation pipelines
6. RBAC security enforcement on Admin Dashboard

---

## 🐳 Docker & Production Deployment

### Docker Multi-Stage Build
```bash
# Build image
docker build -t kys-app .

# Run container
docker run -p 5000:5000 -e NODE_ENV=production kys-app
```

### Hosting Environments
- **Frontend**: Pre-configured for **Vercel** (`frontend/vercel.json` with API rewrite support).
- **Backend**: Pre-configured for **Render** (`render.yaml` with zero-downtime health checking).
- **Database**: Tested with **MongoDB Atlas** M0 free cluster.
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request.

---

## 📄 License
MIT License. Built for digital consumers, students, and developers.
