# Workout Analytics - Brainstorming & Plan

## Overview

Store voice agent call summaries in Supabase and create an analytics dashboard to track user workout **strength** and **consistency**.

**Data Flow:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Voice Agent    │────▶│  Node.js API    │────▶│    Supabase     │
│  (End of Call)  │     │  /api/voice-    │     │    Database     │
│                 │     │  agent-summary  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌─────────────────┐             │
                        │  React App      │◀────────────┘
                        │  Analytics Page │
                        └─────────────────┘
```

---

## Part 1: Data Collection & Storage

### 1.1 Voice Agent Payload

The voice agent sends this to `/api/voice-agent-summary` at the end of each call:

```json
{
  "user_id": "abc123-uuid-here",
  "workout_performed": "Barbell Bench Press",
  "activity": "Strength",
  "sets": 4,
  "reps": 12,
  "muscle_target": "Chest, Triceps, Anterior Deltoids",
  "workout_time": "45:30"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | **Yes*** | User's UUID (from dispatch metadata) |
| `workout_performed` | string | Yes | Name of the exercise performed |
| `activity` | string | No | Type of activity (Strength, Cardio, Flexibility, etc.) |
| `sets` | number | No | Number of sets completed |
| `reps` | number | No | Reps per set |
| `muscle_target` | string | No | Comma-separated muscle groups targeted |
| `workout_time` | string | No | Duration in "MM:SS" format |
| `room_id` | string | No | Legacy fallback - used as user_id if user_id not provided |

*`user_id` is required. If not provided, `room_id` will be used as the user_id.

**Note:** Each voice agent call logs a single exercise. Multiple exercises in one session = multiple calls.

---

## Part 2: Supabase Database Schema

### 2.1 Tables Design

#### Table: `workout_logs`
Stores each workout entry from voice agent calls.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `workout_performed` | text | Exercise name |
| `activity` | text | Activity type (Strength, Cardio, etc.) |
| `sets` | integer | Number of sets |
| `reps` | integer | Reps per set |
| `muscle_target` | text | Target muscle groups |
| `workout_time` | text | Duration (MM:SS format) |
| `workout_time_seconds` | integer | Duration in seconds (calculated) |
| `created_at` | timestamptz | When the workout was logged |

```sql
DROP TABLE IF EXISTS workout_logs CASCADE;

CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  workout_performed TEXT NOT NULL,
  activity TEXT,
  sets INTEGER,
  reps INTEGER,
  muscle_target TEXT,
  workout_time TEXT,
  workout_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_created_at ON workout_logs(created_at);

-- RLS: Users can only see their own logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON workout_logs
  FOR SELECT USING (auth.uid()::text = user_id);

-- Allow service role to bypass RLS for inserts
CREATE POLICY "Service role full access" ON workout_logs
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Part 3: API Endpoints

### 3.1 Update Summary Endpoint

**Endpoint:** `POST /api/voice-agent-summary`

Update the existing test endpoint to:
1. Accept user_id (passed from voice agent or extracted from auth)
2. Parse workout_time to seconds
3. Insert into `workout_logs` table

```typescript
import { supabaseAdmin } from '../lib/supabase.js'

// Helper: Convert "MM:SS" to seconds
const parseWorkoutTime = (time: string): number => {
  const [minutes, seconds] = time.split(':').map(Number)
  return (minutes * 60) + (seconds || 0)
}

router.post('/voice-agent-summary', async (req, res) => {
  try {
    const { 
      user_id,  // Must be provided by voice agent
      workout_performed, 
      activity, 
      sets, 
      reps, 
      muscle_target, 
      workout_time 
    } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Calculate duration in seconds
    const workoutTimeSeconds = workout_time 
      ? parseWorkoutTime(workout_time) 
      : null

    // Insert workout log
    const { data, error } = await supabaseAdmin
      .from('workout_logs')
      .insert({
        user_id,
        workout_performed,
        activity,
        sets,
        reps,
        muscle_target,
        workout_time,
        workout_time_seconds: workoutTimeSeconds,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ error: 'Failed to save workout log' })
    }

    res.json({ success: true, workout_id: data.id })
  } catch (error) {
    console.error('Error processing workout summary:', error)
    res.status(500).json({ error: 'Failed to process summary' })
  }
})
```

**Note:** The `user_id` must be passed by the voice agent. This can be:
- Extracted from the room name (`user-{userId}`)
- Passed as metadata when dispatching the agent
- Included in the payload from the agent

### 3.2 Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Overall stats (total workouts, streaks, total time) |
| GET | `/api/analytics/workouts` | List of recent workouts with pagination |
| GET | `/api/analytics/workouts/:id` | Single workout detail |
| GET | `/api/analytics/exercises` | Unique exercises with counts |
| GET | `/api/analytics/exercises/:name` | History for specific exercise |
| GET | `/api/analytics/consistency` | Consistency metrics (streaks, frequency) |

---

## Part 4: Analytics Features

### 4.1 Consistency Metrics

Track how consistently the user works out:

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Current Streak** | Consecutive days with workouts | Count days from today backwards |
| **Longest Streak** | Best consecutive days ever | Historical max |
| **Weekly Average** | Avg workouts per week | Total workouts / weeks active |
| **Monthly Calendar** | Visual heatmap of activity | Days with workouts highlighted |
| **Workout Frequency** | Workouts per week trend | Rolling average |

**SQL Example - Current Streak:**
```sql
WITH workout_days AS (
  SELECT DISTINCT DATE(created_at) as workout_date
  FROM workout_logs
  WHERE user_id = $1
  ORDER BY workout_date DESC
),
streaks AS (
  SELECT 
    workout_date,
    workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date DESC))::int AS streak_group
  FROM workout_days
)
SELECT COUNT(*) as current_streak
FROM streaks
WHERE streak_group = (SELECT streak_group FROM streaks LIMIT 1);
```

### 4.2 Strength Metrics

Track strength progression over time:

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Volume Progress** | Total volume per workout | sets × reps |
| **Exercise Frequency** | How often each exercise is performed | Count per exercise |
| **Total Time** | Cumulative workout time | Sum of workout_time_seconds |
| **Exercise Trends** | Sets/reps progression over time | Line chart per exercise |

**SQL Example - Exercise Progression (e.g., Bench Press):**
```sql
SELECT 
  DATE(created_at) as date,
  workout_performed,
  sets,
  reps,
  (sets * reps) as volume,
  workout_time
FROM workout_logs
WHERE user_id = $1
  AND LOWER(workout_performed) LIKE '%bench%'
ORDER BY created_at;
```

**SQL Example - Total Stats:**
```sql
SELECT 
  COUNT(*) as total_workouts,
  SUM(sets * reps) as total_volume,
  SUM(workout_time_seconds) as total_time_seconds,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM workout_logs
WHERE user_id = $1;
```

### 4.3 Dashboard Widgets

```
┌────────────────────────────────────────────────────────────────┐
│  📊 Your Workout Analytics                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 🔥 Streak   │  │ 💪 Workouts │  │ ⏱️ Total    │             │
│  │    12 days  │  │    48 total │  │   36 hours  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  📅 This Month                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  M  T  W  T  F  S  S   M  T  W  T  F  S  S  ...          │  │
│  │  ●  ●  ○  ●  ●  ○  ○   ●  ●  ●  ○  ●  ○  ○  ...          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💪 Strength Progress - Bench Press                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  185 ─────────────────────────────────────●              │  │
│  │  175 ─────────────────────────●───────────               │  │
│  │  165 ─────────────●───────────                           │  │
│  │  155 ──●──────────                                       │  │
│  │      Jan    Feb    Mar    Apr    May                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📝 Recent Workouts                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Today - Chest & Triceps - 45min - RPE 8                 │  │
│  │  Yesterday - Legs - 52min - RPE 9                        │  │
│  │  Jan 28 - Back & Biceps - 38min - RPE 7                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Frontend Components

### 5.1 New Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/analytics` | `AnalyticsDashboard.tsx` | Main analytics page |
| `/analytics/workouts` | `WorkoutHistory.tsx` | Full workout list |
| `/analytics/workouts/:id` | `WorkoutDetail.tsx` | Single workout view |
| `/analytics/exercises` | `ExerciseLibrary.tsx` | Exercise progress hub |
| `/analytics/exercises/:name` | `ExerciseDetail.tsx` | Single exercise history |

### 5.2 Component Structure

```
client/src/
├── pages/
│   ├── Analytics/
│   │   ├── AnalyticsDashboard.tsx   # Main dashboard
│   │   ├── WorkoutHistory.tsx       # Workout list
│   │   ├── WorkoutDetail.tsx        # Single workout view
│   │   ├── ExerciseLibrary.tsx      # Exercise overview
│   │   └── Analytics.css            # Styling
│   └── ...
├── components/
│   ├── Analytics/
│   │   ├── StatsCard.tsx            # Stat display card
│   │   ├── StreakCalendar.tsx       # Monthly heatmap
│   │   ├── StrengthChart.tsx        # Line chart for progression
│   │   ├── WorkoutCard.tsx          # Workout summary card
│   │   ├── ExerciseProgress.tsx     # Exercise trend mini-chart
│   │   └── PRBadge.tsx              # Personal record badge
│   └── ...
└── hooks/
    ├── useAnalytics.ts              # Fetch analytics data
    ├── useWorkouts.ts               # Workout CRUD operations
    └── useExerciseHistory.ts        # Exercise-specific data
```

### 5.3 Charting Library Options

| Library | Pros | Cons |
|---------|------|------|
| **Recharts** | React-native, easy to use, good docs | Bundle size |
| **Chart.js + react-chartjs-2** | Mature, flexible | Config-heavy |
| **Victory** | Beautiful defaults, animation | Learning curve |
| **Nivo** | D3-based, declarative, responsive | Heavier |
| **Lightweight option: uPlot** | Tiny, fast | Less pretty defaults |

**Recommendation:** Start with **Recharts** for simplicity, or **Chart.js** if you need more customization.

---

## Part 6: Implementation Phases

### Phase 1: Database & API Foundation ✅ COMPLETE
- [x] Create Supabase table (`workout_logs`) - simple table, no RLS
- [x] `POST /api/voice-agent-summary` - save workout data
- [x] `GET /api/workouts?user_id=xxx` - fetch user's workouts
- [x] `GET /api/workouts/:id` - fetch single workout
- [ ] Test with voice agent

### Phase 2: Analytics API Endpoints ✅ COMPLETE
- [x] `GET /api/analytics/summary` - total workouts, time, volume, streak
- [x] `GET /api/analytics/exercises` - exercise breakdown with counts
- [x] `GET /api/analytics/consistency` - streaks, frequency, calendar data

### Phase 3: Frontend - Dashboard ✅ COMPLETE
- [x] Install Recharts charting library
- [x] Create `Analytics.tsx` page with full dashboard
- [x] Add navigation link from Welcome page
- [x] Stats cards (streak, workouts, time, volume)
- [x] Exercise frequency bar chart
- [x] Exercise distribution pie chart
- [x] Consistency stats section
- [x] Recent workouts table
- [x] Exercise breakdown table

### Phase 4: Frontend - Charts & Details
- [ ] Install charting library (Recharts)
- [ ] Build `VolumeChart` component (sets × reps over time)
- [ ] Build workout detail page
- [ ] Build exercise history page
- [ ] Add responsive styling

### Phase 5: Polish & Enhancements
- [ ] Add loading states
- [ ] Handle empty states (no workouts yet)
- [ ] Add date range filters
- [ ] Export data option (CSV)
- [ ] Performance optimization (caching, pagination)

---

## Open Questions & Decisions

### Q1: User ID in Payload ✅ RESOLVED
**Solution:** Pass `user_id` directly from voice agent dispatch metadata.

The voice agent receives `userId` in dispatch metadata (set during `/api/livekit/token`) and includes it directly in the summary payload:

```typescript
// Endpoint accepts user_id, with room_id as simple fallback
const finalUserId = user_id || room_id
```

**Priority order:**
1. `user_id` - passed directly from voice agent metadata (preferred)
2. `room_id` - used directly as user_id if user_id not provided (legacy fallback)

### Q2: Exercise Name Normalization
**Problem:** "Bench Press" vs "bench press" vs "Barbell Bench Press"

**Options:**
1. Store as-is, normalize on display (lowercase comparison)
2. Normalize on insert (trim, lowercase, map aliases)
3. Let users edit/correct after the fact

**Recommendation:** Store as-is for now, normalize in queries.

### Q3: Historical Data Backfill
**Question:** Do you have existing summary logs that need importing?

### Q4: Goal Setting
**Future feature:** Should users set goals (e.g., "Workout 4x/week", "Complete 100 sets/week")?

### Q5: Gamification
**Future feature:** Badges, achievements, leaderboards?

---

## Technical Notes

### Workout Time Parsing
Convert "MM:SS" format to seconds:

```typescript
const parseWorkoutTime = (time: string): number => {
  const [minutes, seconds] = time.split(':').map(Number)
  return (minutes * 60) + (seconds || 0)
}

// Example: "45:30" → 2730 seconds
```

### Formatting Time for Display
Convert seconds back to readable format:

```typescript
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Example: 2730 → "45:30"
```

### Muscle Target Parsing
Parse comma-separated muscle targets:

```typescript
const parseMuscleTargets = (target: string): string[] => {
  return target.split(',').map(m => m.trim())
}

// Example: "Chest, Triceps, Anterior Deltoids" → ["Chest", "Triceps", "Anterior Deltoids"]
```

---

## Next Steps

1. **Review this plan** and discuss any questions/changes
2. **Create Supabase table** (`workout_logs`) with provided SQL
3. **Update voice agent** to include `room` in payload (if not already)
4. **Update API endpoint** to store data in Supabase (user_id extracted from room)
5. **Test with real agent calls**
6. **Build analytics API endpoints**
7. **Build frontend dashboard**

---

*Created: January 31, 2026*
*Last Updated: January 31, 2026*
