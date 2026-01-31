# Hype Me Up - Project Plan

## Overview

A React + Node.js application with Supabase integration for authentication and database. Users can sign up with their name, log in, and view a personalized welcome page.

## Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Frontend   | React + Vite + TypeScript      |
| Styling    | CSS                            |
| Backend    | Node.js + Express + TypeScript |
| Auth & DB  | Supabase                       |

---

## Project Structure

```
hype_me_up/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Welcome.tsx
│   │   │   ├── Auth.css
│   │   │   └── Welcome.css
│   │   ├── context/           # Auth context for state management
│   │   │   └── AuthContext.tsx
│   │   ├── lib/               # Supabase client setup
│   │   │   └── supabase.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── PLAN.md                # This file
│
└── README.md
```

---

## Phase 1: Project Setup ✅ COMPLETED

### 1.1 Initialize Frontend (React + Vite + TypeScript)
- [x] Create Vite project with React-TS template
- [x] Install dependencies: `@supabase/supabase-js`, `react-router-dom`
- [x] Set up folder structure (components, pages, context, lib)
- [x] Configure environment variables for Supabase URL and anon key

### 1.2 Initialize Backend (Node.js + Express + TypeScript)
- [x] Initialize Node project with TypeScript
- [x] Install dependencies: `express`, `cors`, `dotenv`, `@supabase/supabase-js`
- [x] Install dev dependencies: `typescript`, `tsx`, `@types/express`, `@types/cors`
- [x] Set up Express server with basic health check route
- [x] Configure environment variables for Supabase (URL + service role key)

### 1.3 Supabase Setup
- [x] Create Supabase project (user provides credentials)
- [x] Enable Email/Password auth in Supabase dashboard

---

## Phase 2: Authentication Implementation ✅ COMPLETED

### 2.1 Frontend Auth
- [x] Create Supabase client in `lib/supabase.ts`
- [x] Create `AuthContext` to manage user session state
- [x] Build `Login` page with email/password form
- [x] Build `Signup` page with first name, last name, email, password fields
- [x] Implement auth functions: `signUp`, `signIn`, `signOut`
- [x] Store user first/last name in Supabase user_metadata
- [x] Add protected route wrapper component

### 2.2 Backend Auth Middleware
- [x] Create auth middleware to verify Supabase JWT tokens
- [x] Extract user info including first/last name from token
- [x] Create protected API route example (`/api/me`)
- [x] Set up CORS to allow frontend requests

---

## Phase 3: Pages & Routing ✅ COMPLETED

### 3.1 Page Components
- [x] **Login Page** (`/login`)
  - Email input
  - Password input
  - Login button
  - Link to Signup page
  - Error handling display

- [x] **Signup Page** (`/signup`)
  - First name input
  - Last name input
  - Email input
  - Password input
  - Confirm password input
  - Signup button
  - Link to Login page
  - Validation & error handling

- [x] **Welcome Page** (`/`)
  - Display user's full name (personalized greeting)
  - Display user's email
  - Welcome message
  - Logout button
  - Protected route (redirects to login if not authenticated)

### 3.2 Routing Setup
- [x] Configure React Router
- [x] Set up public routes (Login, Signup) with redirect if authenticated
- [x] Set up protected routes (Welcome)
- [x] Implement redirect logic for authenticated/unauthenticated users

---

## Phase 4: Styling ✅ COMPLETED

- [x] Create global CSS (colors, fonts, spacing)
- [x] Style auth forms (centered card layout with gradient background)
- [x] Style buttons, inputs, and error messages
- [x] Modern purple gradient aesthetic
- [x] Loading states

---

## Phase 5: Testing & Polish

- [ ] Test signup flow (new user registration)
- [ ] Test login flow (existing user)
- [ ] Test logout functionality
- [ ] Test protected route redirects
- [ ] Handle edge cases (invalid credentials, network errors)

---

## Phase 6: LiveKit Voice Agent Integration 🚧 IN PROGRESS

### Overview

Integrate LiveKit Voice Agent into the Welcome page, allowing authenticated users to have voice conversations with an AI assistant.

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Node.js API    │────▶│  LiveKit Server │
│   (Frontend)    │     │  (Token Server) │     │  (Self-hosted)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │              ┌─────────────────┐              │
        └─────────────▶│  LiveKit Agent  │◀─────────────┘
                       │  (Already exists)│
                       └─────────────────┘
```

### 6.1 Frontend Dependencies
- [x] Install `@livekit/components-react` - React components for LiveKit
- [x] Install `livekit-client` - Core LiveKit client SDK

### 6.2 Backend Token Server
- [x] Install `livekit-server-sdk` in server/
- [x] Add LiveKit environment variables (API key, secret, URL)
- [x] Create `/api/livekit/token` endpoint to generate room access tokens
- [x] Endpoint should:
  - Accept room name and participant identity
  - Use authenticated user's info from Supabase session
  - Return JWT token for LiveKit room connection

### 6.3 Welcome Page Redesign

**Layout Structure:**
```
┌────────────────────────────────────────────────────┐
│  Header                                            │
│  ┌──────────────┐                    ┌──────────┐  │
│  │ HypeMeUp Logo│                    │  Logout  │  │
│  └──────────────┘                    └──────────┘  │
├────────────────────────────────────────────────────┤
│  Main Content                                      │
│                                                    │
│           Welcome, {First Name}!                   │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │         Voice Agent Container                │  │
│  │                                              │  │
│  │    ┌─────────────────────────────────┐       │  │
│  │    │     Bar Audio Visualizer        │       │  │
│  │    │     ████ ██████ ████ ██ ████    │       │  │
│  │    └─────────────────────────────────┘       │  │
│  │                                              │  │
│  │    Agent State: Listening / Speaking         │  │
│  │                                              │  │
│  │    ┌────────────┐  ┌────────────────┐        │  │
│  │    │  🎤 Mute   │  │  Disconnect    │        │  │
│  │    └────────────┘  └────────────────┘        │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 6.4 LiveKit React Components to Use

Based on [LiveKit React Components Docs](https://docs.livekit.io/reference/components/react/):

| Component/Hook | Purpose |
|----------------|---------|
| `LiveKitRoom` | Main wrapper component for room connection |
| `useVoiceAssistant` | Hook to get agent state, audio track |
| `BarVisualizer` or `AudioVisualizer` | Visual feedback for agent audio |
| `TrackToggle` | Mute/unmute microphone button |
| `DisconnectButton` | Leave the room |
| `RoomAudioRenderer` | Renders agent's audio output |
| `useConnectionState` | Monitor connection status |

### 6.5 Component Implementation Plan

#### Step 1: Create LiveKit Components
- [x] `components/VoiceAgent/VoiceAgentContainer.tsx` - Main wrapper
- [x] `components/VoiceAgent/AgentVisualizer.tsx` - Bar visualizer
- [x] `components/VoiceAgent/AgentControls.tsx` - Mute/Disconnect buttons
- [x] `components/VoiceAgent/VoiceAgent.css` - Styling

#### Step 2: Update Welcome Page
- [x] Add header with logo and logout button
- [x] Add personalized greeting
- [x] Integrate VoiceAgentContainer

#### Step 3: Connection Flow
1. User lands on Welcome page (authenticated)
2. Frontend requests token from `/api/livekit/token`
3. `LiveKitRoom` connects to LiveKit server using token
4. Agent joins the room (already running separately)
5. User can speak and hear agent responses
6. Audio visualizer shows agent speaking state

### 6.6 Environment Variables (Updated)

**Frontend (`client/.env`):**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=ws://your-livekit-server:7880
```

**Backend (`server/.env`):**
```
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
LIVEKIT_URL=http://your-livekit-server:7880
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 6.7 API Endpoints (Updated)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api/me` | Get current user info | Yes |
| POST | `/api/livekit/token` | Generate LiveKit room token | Yes |

### 6.8 Implementation Order

1. **Backend first:** Add LiveKit token endpoint ✅
2. **Frontend dependencies:** Install LiveKit packages ✅
3. **Components:** Build VoiceAgent components ✅
4. **Welcome page:** Redesign with header and voice agent ✅
5. **Styling:** Match existing purple gradient theme ✅
6. **Testing:** Test full voice flow (pending agent connection)

---

## Phase 7: LiveKit Agent Integration & Connection 🚧 IN PROGRESS

### Overview

Connect the Python voice agent to the frontend application. This phase covers agent configuration, room connection strategy, and ensuring proper communication between the frontend and agent.

**Recommended Architecture (Based on LiveKit Best Practices):**

```
┌─────────────────┐                    ┌─────────────────┐
│   React App     │                    │  LiveKit Server │
│   (Frontend)    │◀─── WebRTC ────────▶│  (Self-hosted)  │
└─────────────────┘                    └─────────────────┘
        │                                       │
        │ 1. Request Token                     │
        ├───────────────────────────────────────┤
        │ 2. Connect to Room                   │
        │    Room: "user-{userId}"              │
        └───────────────────────────────────────┘
                                              │
                                              │ 3. Auto Dispatch
                                              ▼
                                    ┌─────────────────┐
                                    │  Python Agent   │
                                    │  (Standalone)   │
                                    │  Auto-joins room│
                                    └─────────────────┘
```

### 7.1 Recommended Approach: Automatic Dispatch

**Why Automatic Dispatch?**
- ✅ Simplest setup - no manual dispatch logic needed
- ✅ Scalable - handles multiple concurrent rooms automatically
- ✅ Low latency - dispatch time typically under 150ms
- ✅ Production-ready - used by LiveKit's own services

**How It Works:**
1. Frontend connects to a room (e.g., `user-{userId}`)
2. Agent server detects new participant in room
3. Agent automatically dispatches and joins the same room
4. Agent and user communicate via WebRTC audio streams

### 7.2 Room Naming Strategy

**Recommended: User-Based Rooms**

Each authenticated user gets their own room name based on their user ID:
- Format: `user-{userId}` (e.g., `user-abc123def456`)
- Benefits:
  - Privacy: Each user has isolated room
  - Simplicity: Easy to track and debug
  - Scalability: Can support multiple concurrent users

**Alternative: Session-Based Rooms**
- Format: `session-{userId}-{timestamp}` or `session-{uuid}`
- Use if you need multiple concurrent sessions per user

**Implementation:**
- Frontend generates room name when user visits Welcome page
- Backend token endpoint uses this room name
- Agent automatically joins when frontend connects

### 7.3 Agent Configuration Requirements

#### 7.3.1 Agent Entrypoint Function

Your `voice_agent.py` should have an entrypoint function decorated with `@server.rtc_session()`:

```python
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    server,
    voice_assistant,
)
from livekit import rtc

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    # Agent automatically joins the room that the frontend connected to
    # No need to specify room name - automatic dispatch handles it
    
    # Set up your agent configuration
    assistant = voice_assistant.VoiceAssistant(
        vad=voice_assistant.VAD.load(),  # Voice Activity Detection
        stt=...,  # Speech-to-Text model
        llm=...,  # Language Model
        tts=...,  # Text-to-Speech model
    )
    
    # Connect to room (auto_subscribe handles audio)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Start the voice assistant
    assistant.start(ctx.room)
    
    # Wait for completion
    await assistant.aclose()
```

#### 7.3.2 Agent Server Configuration

**Required Environment Variables for Agent:**

```bash
# LiveKit Server Connection
LIVEKIT_URL=ws://your-livekit-server:7880
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Optional: Agent Configuration
LIVEKIT_AGENT_NAME=voice-assistant  # Only set if using explicit dispatch
```

**Important Notes:**
- ❌ **DO NOT** set `agent_name` in `@server.rtc_session()` if using automatic dispatch
- ✅ Leave `agent_name` unset for automatic dispatch (default behavior)
- ✅ Agent will automatically join any room when a participant connects

#### 7.3.3 Starting the Agent

**Recommended: Run as Standalone Service**

```bash
# From your agent directory
python voice_agent.py start

# Or using livekit-agents CLI
livekit-agents start voice_agent.py
```

The agent will:
- Connect to LiveKit server
- Wait for room connections
- Automatically dispatch to new rooms
- Handle multiple concurrent sessions

### 7.4 Frontend Room Name Generation

**Update `VoiceAgentContainer.tsx`:**

Currently uses `default-room`. Update to use user-specific rooms:

```typescript
// Generate unique room name per user
const roomName = `user-${user?.id || 'anonymous'}`
```

**Benefits:**
- Each user gets isolated room
- Agent automatically joins when user connects
- Easy to track user sessions

### 7.5 Connection Flow (Detailed)

**Step-by-Step Flow:**

1. **User Authentication**
   - User logs in via Supabase
   - Session token stored in frontend

2. **User Visits Welcome Page**
   - `VoiceAgentContainer` component mounts
   - Generates room name: `user-{userId}`

3. **Token Request**
   - Frontend calls `POST /api/livekit/token` with:
     - `roomName`: `user-{userId}`
     - `participantIdentity`: `user-{userId}`
   - Backend generates JWT token with room join permissions

4. **Frontend Connects**
   - `LiveKitRoom` component connects to LiveKit server
   - Uses token for authentication
   - Joins room: `user-{userId}`

5. **Agent Auto-Dispatch**
   - LiveKit server detects new participant in room
   - Agent server automatically dispatches agent to room
   - Agent joins as participant with identity like `agent-{uuid}`

6. **Communication Established**
   - Frontend publishes microphone audio
   - Agent subscribes to user audio
   - Agent processes audio → LLM → TTS → publishes audio
   - Frontend subscribes to agent audio
   - Audio visualizer shows agent speaking state

7. **User Disconnects**
   - User clicks disconnect or closes page
   - Frontend leaves room
   - Agent detects participant left
   - Agent cleans up and exits room

### 7.6 Implementation Checklist

#### Step 1: Update Frontend Room Naming
- [ ] Update `VoiceAgentContainer.tsx` to generate user-specific room names
- [ ] Use format: `user-{userId}` or `user-{userId}-{sessionId}`

#### Step 2: Verify Agent Configuration
- [ ] Ensure `voice_agent.py` has `@server.rtc_session()` decorator
- [ ] Verify agent does NOT set `agent_name` (for automatic dispatch)
- [ ] Confirm agent uses `await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)`
- [ ] Check agent has proper LiveKit credentials in environment

#### Step 3: Agent Environment Setup
- [ ] Create `.env` file in agent directory (or use system env vars)
- [ ] Set `LIVEKIT_URL` (e.g., `ws://localhost:7880`)
- [ ] Set `LIVEKIT_API_KEY` (must match backend/server)
- [ ] Set `LIVEKIT_API_SECRET` (must match backend/server)
- [ ] Set any LLM/STT/TTS API keys needed by agent

#### Step 4: Start Services in Correct Order
- [ ] Start LiveKit server (if self-hosted)
- [ ] Start backend API server: `cd server && npm run dev`
- [ ] Start agent: `python voice_agent.py start` (in agent directory)
- [ ] Start frontend: `cd client && npm run dev`

#### Step 5: Testing
- [ ] Test token generation: Verify `/api/livekit/token` returns valid token
- [ ] Test frontend connection: Check browser console for connection status
- [ ] Test agent dispatch: Verify agent logs show room join
- [ ] Test audio: Speak and verify agent responds
- [ ] Test visualizer: Check audio bars animate when agent speaks
- [ ] Test disconnect: Verify clean disconnection

### 7.7 Troubleshooting Guide

#### Issue: Agent Not Joining Room

**Symptoms:**
- Frontend connects successfully
- No agent in room participants
- Agent logs show no activity

**Solutions:**
1. Verify agent is running: `ps aux | grep voice_agent.py`
2. Check agent logs for errors
3. Verify `LIVEKIT_URL` matches frontend/server
4. Verify `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` match
5. Check agent has `@server.rtc_session()` decorator (no `agent_name`)
6. Ensure LiveKit server is running and accessible

#### Issue: Token Generation Fails

**Symptoms:**
- Frontend shows "Failed to connect" error
- Backend logs show token generation error

**Solutions:**
1. Verify backend `.env` has `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
2. Check token endpoint receives valid Supabase session token
3. Verify room name format is valid (no special characters)
4. Check backend logs for specific error messages

#### Issue: Audio Not Working

**Symptoms:**
- Connection successful but no audio
- Visualizer shows no activity

**Solutions:**
1. Check browser microphone permissions
2. Verify `RoomAudioRenderer` is included in component tree
3. Check agent is publishing audio tracks
4. Verify agent STT/TTS models are configured correctly
5. Check browser console for WebRTC errors

#### Issue: Agent Joins Wrong Room

**Symptoms:**
- Multiple users see same agent
- Agent in unexpected room

**Solutions:**
1. Verify frontend generates unique room names per user
2. Check room name format: `user-{userId}` (not `default-room`)
3. Verify token endpoint uses correct room name from request

### 7.8 Agent Code Example (Reference)

**Minimal `voice_agent.py` structure:**

```python
import asyncio
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    cli,
    llm,
    server,
    voice_assistant,
)
from livekit import rtc

# Configure your models (STT, LLM, TTS)
# ... model setup ...

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    print(f"Agent joining room: {ctx.room.name}")
    
    # Set up voice assistant
    assistant = voice_assistant.VoiceAssistant(
        vad=voice_assistant.VAD.load(),
        stt=your_stt_model,
        llm=your_llm_model,
        tts=your_tts_model,
    )
    
    # Connect to room (automatic dispatch already handled)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Start assistant
    assistant.start(ctx.room)
    
    # Wait for completion
    await assistant.aclose()
    print(f"Agent leaving room: {ctx.room.name}")

if __name__ == "__main__":
    cli.run_app(entrypoint)
```

### 7.9 Environment Variables Summary

**Agent Directory (`.env` or system environment):**
```bash
# LiveKit Connection (REQUIRED)
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# AI Model APIs (as needed by your agent)
OPENAI_API_KEY=your_openai_key  # If using OpenAI
# ... other model API keys ...
```

**Backend (`server/.env`):**
```bash
# ... existing Supabase vars ...
LIVEKIT_URL=http://localhost:7880
LIVEKIT_API_KEY=your_livekit_api_key  # Must match agent
LIVEKIT_API_SECRET=your_livekit_api_secret  # Must match agent
```

**Frontend (`client/.env`):**
```bash
# ... existing Supabase vars ...
VITE_LIVEKIT_URL=ws://localhost:7880  # Must match agent/server
```

### 7.10 Next Steps After Agent Connection

Once agent is successfully connecting:

1. **Enhance Agent Logic**
   - Add custom instructions/personality
   - Implement conversation context/memory
   - Add tool calling for external APIs

2. **Frontend Enhancements**
   - Add transcription display
   - Show agent thinking/processing state
   - Add conversation history

3. **Monitoring & Analytics**
   - Track agent response times
   - Monitor room connections/disconnections
   - Log conversation quality metrics

---

## Environment Variables

### Frontend (`client/.env`)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=ws://your-livekit-server:7880
```

### Backend (`server/.env`)
```
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
LIVEKIT_URL=http://your-livekit-server:7880
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api/me` | Get current user info (id, email, name) | Yes |
| POST | `/api/livekit/token` | Generate LiveKit room access token | Yes |

---

## Getting Started

### Basic Setup (Without Agent)

1. Set up Supabase project and get credentials
2. Fill in `.env` files in both `client/` and `server/`
3. Install dependencies: `npm install` in both `client/` and `server/`
4. Start backend: `cd server && npm run dev`
5. Start frontend: `cd client && npm run dev`
6. Open `http://localhost:5173` in browser

### Full Setup (With Voice Agent)

1. Complete Basic Setup steps above
2. Set up LiveKit server (self-hosted or cloud)
3. Configure agent environment variables (see Phase 7.9)
4. Start LiveKit server
5. Start backend: `cd server && npm run dev`
6. Start agent: `python voice_agent.py start` (in agent directory)
7. Start frontend: `cd client && npm run dev`
8. Open `http://localhost:5173` in browser and log in
9. Voice agent should automatically connect when you visit Welcome page

---

## Future Enhancements (Out of Scope for Now)

- Password reset functionality
- Email verification flow
- Social login providers (Google, GitHub)
- User profile page with editable info
- Remember me / persistent sessions
- Profile picture upload
