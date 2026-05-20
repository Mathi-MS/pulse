# Pulse Analytics — SaaS Product Analytics Platform

Pulse Analytics is an Amplitude-like full-stack SaaS product analytics platform built using React, Express, and MongoDB. It provides multi-tenant organizations (Workspaces), project token management, chronological conversion analysis (Funnels), real-time continuous ingestion monitoring (WebSockets), and secure SDK integrations.

---

## ⚡ Core Features

- **Double-Tiered Multi-Tenancy**: Users manage isolated **Workspaces** that hold multiple custom **Projects**.
- **Public SDK Tracker Endpoint**: Collects client actions via `POST /api/events/track` with rate-limiting, user agent parsing (for browser and device telemetry), and geo tracking.
- **Client SDK Script serving**: Express serves a lightweight static script at `/tracker.js` supporting standard analytics commands:
  - `pulse("identify", userId)` — Associates future session items to a specific customer profile.
  - `pulse("track", eventName, properties)` — Logs custom interaction telemetry.
  - `pulse("page")` — Automatically records page paths, referrers, and browser titles.
- **Real-Time Dashboards**: Connected using **Socket.IO project rooms** to isolate streaming events exclusively to dashboards in the same workspace.
- **Chronological Funnels**: Dynamically aggregates user conversion steps step-by-step in order of occurrence to determine conversions and drops.
- **CSV Data Exporter**: Instantly downloads ledger rows to a standard spreadsheet document.

---

## 📁 Repository Structure

```
c:\Daily\
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Login, Register, Profile password hash schemas
│   │   │   ├── projects/     # Workspace and Projects keys management
│   │   │   ├── events/       # Rate-limited trackers & static SDK serving
│   │   │   └── analytics/    # Stats & sequential funnel aggregations
│   │   ├── middleware/       # JWT Protect and Express handlers
│   │   ├── sockets/          # Socket.io room joins & disconnects
│   │   └── app.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Responsive Sidebars & dropdown Switchers
│   │   ├── layouts/          # Dash layouts shell
│   │   ├── pages/            # Dashboard, Funnels, Realtime, Ledger
│   │   ├── services/         # Central Axios client
│   │   └── store/            # Zustand state structures
│   ├── package.json
│   └── tailwind.config.js
├── seed.js                   # 1,200+ chronological funnel event database seeder
├── docker-compose.yml        # Multi-service setup
└── README.md
```

---

## 🚀 Local Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally at `mongodb://127.0.0.1:27017/pulse_analytics` or via Docker)

---

### Step 1: Install Backend Dependencies & Start Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Copy environment settings:
   ```bash
   cp .env.example .env
   ```
4. Launch the Express server:
   ```bash
   npm start
   ```
   *The server is active at `http://localhost:5000`.*

---

### Step 2: Seed the Analytical Database
To populate the dashboard with realistic and highly detailed usage charts right out of the box, return to the workspace root and run the seeder:
1. Open a new terminal in `c:\Daily\`.
2. Install dependencies temporarily in the root to execute the seeder:
   ```bash
   npm install mongoose bcryptjs
   ```
3. Execute the seed script:
   ```bash
   node seed.js
   ```
   *This seeds over **1,200 sequential event records** matching a demo account:*
   - **Demo Login**: `demo@pulse.com`
   - **Password**: `Password123`

---

### Step 3: Install Frontend Dependencies & Start Client
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch Vite development compiler:
   ```bash
   npm run dev
   ```
   *Vite opens the dashboard at `http://localhost:5173`.*

---

## 🐳 Docker Deployment

To launch all three services (MongoDB database, Express API server, and Nginx frontend client bundle) in a connected bridge network with one command:
```bash
docker-compose up --build
```
- Frontend client: `http://localhost` (Port 80)
- Backend gateway: `http://localhost:5000`

---

## 📈 High-Volume Production Roadmap

While Mongoose and MongoDB are exceptional for developing initial MVPs, highly successful analytical pipelines capture millions of events daily. To scale, we recommend transitioning to this production-tier blueprint:

```
                  ┌──────────────────────────────┐
                  │          Client SDK          │
                  └──────────────┬───────────────┘
                                 │ HTTP POST
                  ┌──────────────▼───────────────┐
                  │      Express API Ingest      │
                  └──────────────┬───────────────┘
                                 │ Push
                  ┌──────────────▼───────────────┐
                  │       BullMQ / Redis         │ (Buffered Queue)
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │        Node Worker           │ (Bulk processor)
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │          ClickHouse          │ (Columnar Aggregations)
                  └──────────────────────────────┘
```

### 1. Ingestion Buffer: BullMQ & Redis
- **The Problem**: Directly inserting every single client API tracking request into MongoDB sequentially creates database blockages under traffic spikes.
- **The Solution**: 
  - The Express tracker endpoint receives the payload and pushes it instantly to a **BullMQ** queue backed by **Redis**. 
  - The HTTP request returns a `202 Accepted` immediately (averaging < 10ms response latency).
  - Background **Node.js Workers** pull events from the queue, batch them in groups of 1,000, and execute high-speed bulk inserts.

### 2. Analytics Aggregations: ClickHouse
- **The Problem**: Executing chronologically ordered sequential user checks (Funnels) and timeline counts across millions of records in MongoDB becomes extremely slow.
- **The Solution**: 
  - Transition the Event database storage layer to **ClickHouse** (an open-source columnar analytical database).
  - ClickHouse compresses analytical rows by up to 90% and queries millions of events in milliseconds using optimized vector calculations.
