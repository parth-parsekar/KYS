# KYS – Know Your Subscription

A modern, privacy-focused subscription management and spending intelligence web application. Track all your recurring subscriptions, visualize monthly expenditure, set smart budget alerts, and never be surprised by an unexpected renewal.

---

## Features

- **Centralized Subscription Tracking**: Manage active, paused, cancelled, and expired subscriptions in one clean workspace.
- **Smart Service Catalog**: Pre-populated with popular services (Netflix, Spotify, Notion, GitHub, AWS, etc.) with automatic price suggestions and category tags.
- **Spending Analytics & Insights**: Interactive visual charts for 12-month historical spending trends, monthly commitments, and category breakdowns.
- **Budget & Threshold Alerts**: Set custom monthly spending budgets with automatic proactive threshold notifications.
- **Renewal Reminders**: Real-time renewal alerts via WebSockets so you can cancel or adjust services before you get billed.
- **Privacy First**: Zero banking credentials or credit card numbers required. Your personal records and workspace remain strictly isolated.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Vite, Socket.IO Client
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.IO, JWT, Bcrypt
- **Security**: Helmet, Express Rate Limiter, strict CORS, ReDoS regex sanitization, RBAC

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/parth-parsekar/KYS.git
   cd KYS
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5005
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

   - **Web App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5005/api`

---

## Deployment

- **Frontend**: Ready for deployment on [Vercel](https://vercel.com/) with single-page application routing (`frontend/vercel.json`).
- **Backend**: Ready for deployment on [Render](https://render.com/) or any container/cloud platform (`render.yaml`).

---

## License

This project is licensed under the [MIT License](LICENSE).
