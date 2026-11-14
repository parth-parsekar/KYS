# KYS – Know Your Subscription

A modern, privacy-focused subscription management and spending intelligence web application. Track all your recurring subscriptions, visualize monthly expenditure, set smart budget alerts, and never be surprised by an unexpected renewal.

---

## Features

- **Centralized Subscription Tracking**: Manage active, paused, cancelled, and expired subscriptions in one clean workspace.
- **Smart Service Catalog**: Pre-populated with popular services (Netflix, Spotify, Notion, GitHub, AWS, etc.) with automatic price suggestions and category tags.
- **Spending Analytics & Insights**: Interactive visual charts for 12-month historical spending trends, monthly commitments, and category breakdowns.
- **Budget & Threshold Alerts**: Set custom monthly spending budgets with automatic proactive threshold notifications.
- **Renewal Reminders**: Real-time renewal alerts via WebSockets so you can cancel or adjust services before you get billed.
- **Live Event Lifecycle & Broadcasts**: Administrators can create, update, and cancel platform announcements and events with instantaneous real-time WebSocket notifications sent to all active users.
- **Interactive Notification Bell & Dropdown**: Real-time unread notification count badge and interactive dropdown menu with one-click "mark all read" functionality.
- **Privacy First**: Zero banking credentials or credit card numbers required. Your personal records and workspace remain strictly isolated.

---

## Lab & Feature Verification Screenshots

All real-time WebSocket event notification and telemetry verification screenshots are available in the [`screenshots/`](./screenshots) directory:

1. **Admin Creating an Event & User Receiving Notification**: [`screenshots/1_admin_create_event_user_notification.png`](./screenshots/1_admin_create_event_user_notification.png)
2. **Admin Updating an Event & User Receiving Notification**: [`screenshots/2_admin_update_event_user_notification.png`](./screenshots/2_admin_update_event_user_notification.png)
3. **Admin Deleting an Event & User Receiving Notification**: [`screenshots/3_admin_delete_event_user_notification.png`](./screenshots/3_admin_delete_event_user_notification.png)
4. **Successful Client Connection & Disconnection Logs**: [`screenshots/4_client_connection_disconnection_logs.png`](./screenshots/4_client_connection_disconnection_logs.png)
5. **Notification Bell Displaying Notification Count**: [`screenshots/5_notification_bell_count.png`](./screenshots/5_notification_bell_count.png)
6. **Notification Dropdown Displaying Received Notifications**: [`screenshots/6_notification_dropdown.png`](./screenshots/6_notification_dropdown.png)

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

## Deployment

- **Frontend**: Ready for deployment on [Vercel](https://vercel.com/) with single-page application routing (`frontend/vercel.json`).
- **Backend**: Ready for deployment on [Render](https://render.com/) or any container/cloud platform (`render.yaml`).

---

## License

This project is licensed under the [MIT License](LICENSE).
