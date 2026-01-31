# Hype Me Up

A React + Node.js application with Supabase authentication.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Auth & DB:** Supabase

## Project Structure

```
hype_me_up/
├── client/          # React frontend
├── server/          # Node.js backend
└── docs/            # Documentation
```

## Setup

### 1. Configure Environment Variables

**Frontend (`client/.env`):**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (`server/.env`):**
```
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd server
npm install
```

### 3. Run the Application

**Start the backend:**
```bash
cd server
npm run dev
```

**Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
```

### 4. Open the App

Visit `http://localhost:5173` in your browser.

## Features

- User signup with email/password
- User login with email/password
- Protected welcome page
- Session persistence
- Sign out functionality

## API Endpoints

| Method | Endpoint   | Description           | Auth Required |
|--------|------------|-----------------------|---------------|
| GET    | `/health`  | Health check          | No            |
| GET    | `/api/me`  | Get current user info | Yes           |
