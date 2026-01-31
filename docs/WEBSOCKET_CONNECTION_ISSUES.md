# WebSocket Connection Issues - Root Cause Analysis & Solutions

## Executive Summary

The VoiceAgentContainer is failing to connect to the LiveKit server due to **multiple configuration mismatches** and **Phase 7 (Agent Integration) not being implemented**. This document provides a comprehensive analysis of all issues and step-by-step solutions.

---

## Issue Overview

### Symptoms Observed
1. **WebSocket Connection Failure**: `WebSocket connection to 'ws://localhost:7880/rtc/v1?...' failed`
2. **Failed Validate Request**: HTTP request to `http://localhost:7880/rtc/v1/validate?access_token=...` fails
3. **Frontend State**: Shows "Disconnected from voice agent" with Reconnect button
4. **Browser Console**: Shows WebSocket connection errors

### Error Details
```
WebSocket connection to 'ws://localhost:7880/rtc/v1?access_token=eyJhbGciOiJIUzI1NiJ9...' failed
```

---

## Root Cause Analysis

### Issue #1: Frontend Environment Variable Missing ⚠️ **CRITICAL**

**Problem:**
- `client/.env` has `VITE_LIVEKIT_URL=` (empty value)
- Frontend code falls back to hardcoded `ws://localhost:7880`
- Backend is configured for cloud LiveKit: `wss://hypemeup-lexdxwj7.livekit.cloud`

**Evidence:**
```typescript
// VoiceAgentContainer.tsx line 23
const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'
```

```bash
# client/.env
VITE_LIVEKIT_URL=  # Empty!

# server/.env
LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"  # Cloud server
```

**Impact:** Frontend tries to connect to non-existent localhost server instead of cloud LiveKit.

---

### Issue #2: Protocol Mismatch ⚠️ **CRITICAL**

**Problem:**
- Frontend uses `ws://` (non-secure WebSocket)
- Cloud LiveKit requires `wss://` (secure WebSocket over TLS)
- Even if URL is fixed, protocol mismatch will cause connection failure

**Evidence:**
- Frontend fallback: `ws://localhost:7880` (non-secure)
- Backend config: `wss://hypemeup-lexdxwj7.livekit.cloud` (secure)

**Impact:** Browser will reject insecure WebSocket connections to secure endpoints.

---

### Issue #3: Phase 7 Not Implemented ⚠️ **CRITICAL**

**Problem:**
- Phase 7 in PLAN.md describes agent integration requirements
- No Python agent files found in codebase
- Agent is not running to handle room connections
- Even if frontend connects successfully, there will be no agent to communicate with

**Evidence:**
- PLAN.md Phase 7 marked as "🚧 IN PROGRESS"
- Checklist items in Phase 7.6 are unchecked:
  - [ ] Ensure `voice_agent.py` has `@server.rtc_session()` decorator
  - [ ] Verify agent does NOT set `agent_name` (for automatic dispatch)
  - [ ] Start agent: `python voice_agent.py start`
- No `voice_agent.py` or Python agent files found in codebase

**Impact:** Frontend can connect to LiveKit server, but no agent will join the room, resulting in one-way communication failure.

---

### Issue #4: URL Format Mismatch

**Problem:**
- Frontend expects WebSocket URL format: `ws://` or `wss://`
- Backend `.env` uses HTTP format: `wss://hypemeup-lexdxwj7.livekit.cloud`
- LiveKit client SDK expects WebSocket URL, not HTTP URL

**Note:** This is actually correct - LiveKit WebSocket URLs use `wss://` protocol. The issue is that frontend isn't reading this value.

---

## Detailed Solution Steps

### Solution Step 1: Fix Frontend Environment Variable ✅ **IMMEDIATE FIX**

**Action Required:**

1. **Update `client/.env`:**
   ```bash
   VITE_LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"
   ```

2. **Verify the URL matches backend:**
   - Backend `.env`: `LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"`
   - Frontend `.env`: `VITE_LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"`

3. **Restart frontend dev server:**
   ```bash
   cd client
   npm run dev
   ```

**Expected Result:** Frontend will now attempt to connect to the correct cloud LiveKit server.

**Verification:**
- Check browser console - WebSocket URL should show `wss://hypemeup-lexdxwj7.livekit.cloud`
- Network tab should show connection attempts to cloud server, not localhost

---

### Solution Step 2: Verify Backend Token Generation ✅ **VERIFY**

**Action Required:**

1. **Check backend is running:**
   ```bash
   cd server
   npm run dev
   ```

2. **Verify token endpoint works:**
   ```bash
   curl -X POST http://localhost:3001/api/livekit/token \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
     -d '{"roomName": "test-room", "participantIdentity": "test-user"}'
   ```

3. **Check backend logs for errors:**
   - Should see token generation success
   - No errors about missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET

**Expected Result:** Token endpoint returns valid JWT token.

**Verification:**
- Token response contains `{"token": "eyJhbGc..."}`
- No 500 errors in backend logs

---

### Solution Step 3: Implement Phase 7 - Agent Setup 🚧 **REQUIRED FOR FULL FUNCTIONALITY**

**Action Required:**

#### 3.1 Create Python Agent File

Create `voice_agent.py` in project root or dedicated `agent/` directory:

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
# Example with OpenAI (adjust based on your needs)
from livekit.agents import openai

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    print(f"Agent joining room: {ctx.room.name}")
    
    # Set up voice assistant with OpenAI models
    assistant = voice_assistant.VoiceAssistant(
        vad=voice_assistant.VAD.load(),  # Voice Activity Detection
        stt=openai.STT(),  # Speech-to-Text
        llm=openai.LLM(model="gpt-4o-mini"),  # Language Model
        tts=openai.TTS(voice="alloy"),  # Text-to-Speech
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

#### 3.2 Create Agent Environment File

Create `agent/.env` (or set system environment variables):

```bash
# LiveKit Connection (REQUIRED - must match backend)
LIVEKIT_URL=wss://hypemeup-lexdxwj7.livekit.cloud
LIVEKIT_API_KEY=APIQspisdiizYvw
LIVEKIT_API_SECRET=RQxvhruq2RjTrbYlgtzECoBcf79MfikuXuQb43owJaeB

# AI Model APIs (as needed)
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** 
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` **MUST match** backend `.env` values
- Use `wss://` (secure) for cloud LiveKit, `ws://` for localhost

#### 3.3 Install Agent Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install LiveKit agents SDK
pip install livekit livekit-agents livekit-agents-openai
```

#### 3.4 Start the Agent

```bash
# From agent directory
python voice_agent.py start

# Or using livekit-agents CLI
livekit-agents start voice_agent.py
```

**Expected Result:** Agent connects to LiveKit server and waits for room connections.

**Verification:**
- Agent logs show: "Connected to LiveKit server"
- Agent logs show: "Waiting for room connections"
- When frontend connects, agent logs show: "Agent joining room: user-{userId}"

---

### Solution Step 4: Verify Complete Connection Flow ✅ **TESTING**

**Action Required:**

1. **Start all services in order:**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev
   
   # Terminal 2: Agent
   cd agent && python voice_agent.py start
   
   # Terminal 3: Frontend
   cd client && npm run dev
   ```

2. **Test connection flow:**
   - Open browser: `http://localhost:5173`
   - Log in with Supabase credentials
   - Navigate to Welcome page
   - Check browser console for connection status
   - Check agent logs for room join confirmation

3. **Verify audio communication:**
   - Grant microphone permissions when prompted
   - Speak into microphone
   - Verify agent responds with audio
   - Check audio visualizer animates when agent speaks

**Expected Result:** Complete bidirectional audio communication between frontend and agent.

**Verification Checklist:**
- [ ] Frontend connects to LiveKit server (no WebSocket errors)
- [ ] Token generation succeeds (check Network tab)
- [ ] Agent joins room (check agent logs)
- [ ] Frontend shows "Connected" state (not "Disconnected")
- [ ] Microphone audio is captured (check browser permissions)
- [ ] Agent responds to speech (hear audio response)
- [ ] Audio visualizer shows activity when agent speaks

---

## Configuration Summary

### Correct Configuration Files

#### `client/.env`
```bash
VITE_SUPABASE_URL="https://oqhrnyttqdcxysbkmmja.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_-YWVZ-PXZ-7066M4BEtztQ_ZPdGhRAz"
VITE_LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"
```

#### `server/.env`
```bash
PORT=3001
SUPABASE_URL="https://oqhrnyttqdcxysbkmmja.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_publishable_-YWVZ-PXZ-7066M4BEtztQ_ZPdGhRAz"
LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"
LIVEKIT_API_KEY="APIQspisdiizYvw"
LIVEKIT_API_SECRET="RQxvhruq2RjTrbYlgtzECoBcf79MfikuXuQb43owJaeB"
```

#### `agent/.env` (to be created)
```bash
LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"
LIVEKIT_API_KEY="APIQspisdiizYvw"
LIVEKIT_API_SECRET="RQxvhruq2RjTrbYlgtzECoBcf79MfikuXuQb43owJaeB"
OPENAI_API_KEY="your_openai_api_key_here"
```

**Critical:** All three files must use the **same** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` values.

---

## Troubleshooting Guide

### Problem: WebSocket Still Fails After Fixing .env

**Possible Causes:**
1. Frontend dev server not restarted (env vars cached)
2. Browser cache (hard refresh: Ctrl+Shift+R)
3. CORS issues (check backend CORS config)
4. LiveKit server not accessible (check network/firewall)

**Solutions:**
```bash
# 1. Stop and restart frontend
cd client
npm run dev

# 2. Clear browser cache and hard refresh
# Chrome: Ctrl+Shift+R or Cmd+Shift+R

# 3. Check backend CORS allows frontend origin
# server/src/index.ts should have:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
```

---

### Problem: Token Generation Fails

**Possible Causes:**
1. Missing or incorrect LIVEKIT_API_KEY/SECRET in backend
2. Invalid Supabase session token
3. Backend not running

**Solutions:**
```bash
# 1. Verify backend .env has correct values
cat server/.env | grep LIVEKIT

# 2. Check backend logs for specific error
cd server && npm run dev
# Look for token generation errors

# 3. Test token endpoint manually
curl -X POST http://localhost:3001/api/livekit/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d '{"roomName": "test", "participantIdentity": "test"}'
```

---

### Problem: Agent Not Joining Room

**Possible Causes:**
1. Agent not running
2. Agent environment variables don't match backend
3. Agent code has incorrect configuration
4. LiveKit server connection failed

**Solutions:**
```bash
# 1. Verify agent is running
ps aux | grep voice_agent.py  # Linux/Mac
tasklist | findstr python      # Windows

# 2. Check agent logs for errors
# Look for connection errors or authentication failures

# 3. Verify agent .env matches backend .env
# LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET must match

# 4. Check agent code has @server.rtc_session() decorator
# And does NOT set agent_name (for automatic dispatch)
```

---

### Problem: Audio Not Working

**Possible Causes:**
1. Browser microphone permissions denied
2. RoomAudioRenderer not included in component tree
3. Agent not publishing audio tracks
4. STT/TTS models not configured correctly

**Solutions:**
1. **Check browser permissions:**
   - Chrome: Settings > Privacy > Site Settings > Microphone
   - Ensure localhost:5173 has microphone access

2. **Verify VoiceAgentContainer includes RoomAudioRenderer:**
   ```typescript
   // Should be in VoiceAgentContent component
   <RoomAudioRenderer />
   ```

3. **Check agent logs:**
   - Should see audio processing messages
   - Should see TTS generation messages

4. **Verify agent models:**
   - STT model is configured and working
   - TTS model is configured and working
   - LLM model is configured and working

---

## Phase 7 Implementation Checklist

Based on PLAN.md Phase 7, here's what needs to be completed:

### Step 1: Update Frontend Room Naming ✅ **ALREADY DONE**
- [x] `VoiceAgentContainer.tsx` generates user-specific room names
- [x] Uses format: `user-{userId}`

### Step 2: Verify Agent Configuration ❌ **NOT DONE**
- [ ] Create `voice_agent.py` with `@server.rtc_session()` decorator
- [ ] Verify agent does NOT set `agent_name` (for automatic dispatch)
- [ ] Confirm agent uses `await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)`
- [ ] Check agent has proper LiveKit credentials in environment

### Step 3: Agent Environment Setup ❌ **NOT DONE**
- [ ] Create `.env` file in agent directory
- [ ] Set `LIVEKIT_URL` (must match backend: `wss://hypemeup-lexdxwj7.livekit.cloud`)
- [ ] Set `LIVEKIT_API_KEY` (must match backend: `APIQspisdiizYvw`)
- [ ] Set `LIVEKIT_API_SECRET` (must match backend: `RQxvhruq2RjTrbYlgtzECoBcf79MfikuXuQb43owJaeB`)
- [ ] Set LLM/STT/TTS API keys (e.g., `OPENAI_API_KEY`)

### Step 4: Start Services in Correct Order ❌ **NOT DONE**
- [ ] Start backend API server: `cd server && npm run dev`
- [ ] Start agent: `python voice_agent.py start` (in agent directory)
- [ ] Start frontend: `cd client && npm run dev`

### Step 5: Testing ❌ **NOT DONE**
- [ ] Test token generation: Verify `/api/livekit/token` returns valid token
- [ ] Test frontend connection: Check browser console for connection status
- [ ] Test agent dispatch: Verify agent logs show room join
- [ ] Test audio: Speak and verify agent responds
- [ ] Test visualizer: Check audio bars animate when agent speaks
- [ ] Test disconnect: Verify clean disconnection

---

## Quick Fix Summary

### Immediate Actions (5 minutes)

1. **Fix frontend .env:**
   ```bash
   # Edit client/.env
   VITE_LIVEKIT_URL="wss://hypemeup-lexdxwj7.livekit.cloud"
   ```

2. **Restart frontend:**
   ```bash
   cd client && npm run dev
   ```

3. **Test connection:**
   - Open browser, log in, check console
   - Should see connection attempt to cloud server (not localhost)

### Full Solution (30-60 minutes)

1. **Complete immediate actions above**

2. **Create and configure agent:**
   - Create `voice_agent.py` (see Solution Step 3.1)
   - Create `agent/.env` (see Solution Step 3.2)
   - Install dependencies (see Solution Step 3.3)
   - Start agent (see Solution Step 3.4)

3. **Test complete flow:**
   - Follow Solution Step 4 verification checklist

---

## Additional Notes

### Why Phase 7 Matters

Phase 7 is **critical** because:
- Frontend can connect to LiveKit server ✅
- Token generation works ✅
- But without agent, there's no one to talk to ❌
- Agent must be running and configured correctly for bidirectional communication

### Architecture Reminder

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React    │────────▶│  Node.js   │────────▶│  LiveKit   │
│  Frontend  │ Token   │   API      │ Token   │   Server   │
│            │ Request │  Server    │ Gen     │  (Cloud)   │
└────────────┘         └────────────┘         └────────────┘
      │                                              │
      │ WebSocket Connection                         │
      │ (wss://hypemeup-lexdxwj7.livekit.cloud)     │
      │                                              │
      │                                              │
      │         ┌─────────────┐                      │
      └────────▶│   Python   │◀─────────────────────┘
                │   Agent    │ Auto Dispatch
                │            │
                └────────────┘
```

All components must be running and properly configured for the system to work.

---

## Conclusion

The WebSocket connection failure is caused by **three main issues**:

1. ✅ **Fixable immediately**: Frontend `.env` missing `VITE_LIVEKIT_URL` value
2. ✅ **Fixable immediately**: Protocol mismatch (`ws://` vs `wss://`)
3. ⚠️ **Requires implementation**: Phase 7 agent not created/running

**Priority:**
1. Fix frontend `.env` (5 minutes) - will resolve WebSocket connection error
2. Implement Phase 7 agent (30-60 minutes) - required for full functionality

After completing both, the voice agent should work end-to-end.

---

## References

- PLAN.md Phase 7: Agent Integration & Connection
- LiveKit Documentation: https://docs.livekit.io/
- LiveKit Agents SDK: https://github.com/livekit/agents
- LiveKit React Components: https://docs.livekit.io/reference/components/react/
