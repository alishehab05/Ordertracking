# RouteLy Logistics

A polished Vite + React + TypeScript logistics dashboard for Lebanese delivery operations.

## Run locally

```bash
# 3: hna b3mel install l-deps w b7el l-app local 3ashan n3mell testing w dev
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173`; JSON Server serves `db.json` at port 3001. Copy `.env.example` to `.env` to override the API URL.

## Features
- Responsive dashboard with order KPIs, charts, live map fallback, and dark mode
- Orders search, create/edit/delete CRUD, and detailed tracking
- Smooth tracking simulation with interval progress updates
- Customer add/edit/delete CRUD
- Typed Axios service layer with localStorage fallback when API is unavailable
