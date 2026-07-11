# Habit Tracker Pro — Full Codebase Reference

> **Purpose**: Single reference file so any agent/developer can understand the entire project without reading individual source files. Update this file whenever the structure changes.

---

## Project Layout

```
habit-tracker-pro/
├── api/                        # Vercel Serverless Backend (Node.js)
│   ├── _models/
│   │   ├── Habit.js            # Habit schema
│   │   ├── HabitLog.js         # Per-day completion log schema
│   │   ├── User.js             # User schema (auth, XP, level)
│   │   └── Category.js         # Custom categories
│   ├── _utils/
│   │   └── dbConnect.js        # MongoDB connection singleton
│   ├── auth/
│   │   ├── login.js            # POST /api/auth/login
│   │   ├── signup.js           # POST /api/auth/signup
│   │   ├── me.js               # GET/PUT /api/auth/me
│   │   ├── logout.js           # POST /api/auth/logout
│   │   └── ...                 # forgot-password, reset-password
│   ├── habits/
│   │   ├── index.js            # GET/POST /api/habits
│   │   └── [id].js             # GET/PUT/DELETE /api/habits/:id
│   ├── habit-logs/
│   │   ├── index.js            # GET/POST/DELETE /api/habit-logs
│   │   └── token.js            # PUT /api/habit-logs/token (streak freeze)
│   ├── analytics/
│   │   ├── index.js            # GET /api/analytics
│   │   └── history.js          # GET /api/analytics/history
│   ├── categories/
│   │   └── index.js            # GET/POST /api/categories
│   └── notifications/          # Push notification endpoints
│
├── src/                        # Web App (Vite + React + Tailwind)
│   ├── App.jsx                 # Root: auth state, swipe nav, view routing
│   ├── components/
│   │   ├── layout/
│   │   │   ├── GlobalLayout.jsx    # Background effects, max-width container
│   │   │   ├── Navbar.jsx          # Top nav with Home/Dashboard tabs + logout
│   │   │   └── GlassCard.jsx       # Reusable glass card wrapper
│   │   ├── ui/
│   │   │   └── Icons.jsx           # 13 SVG icons map + IconRenderer
│   │   └── views/
│   │       ├── HomeView.jsx        # Gamification header + grid of components
│   │       ├── DailyTasks.jsx      # Task list with toggle, edit, delete, friction
│   │       ├── UpcomingTasks.jsx    # "Right Now" + "Up Next" reminder cards
│   │       ├── NewTaskForm.jsx     # Full task create/edit form
│   │       ├── Heatmap.jsx         # GitHub-style activity heatmap + tokens
│   │       ├── DashboardView.jsx   # Analytics: stats, charts, history table
│   │       ├── LoginView.jsx       # Login/signup form
│   │       ├── ResetPasswordView.jsx
│   │       └── LoadingScreen.jsx
│   └── hooks/
│       └── useNotifications.js     # Push notification scheduling
│
├── mobile/                     # Mobile App (Expo SDK 57 + React Native 0.86)
│   ├── App.js                  # Root: auth, navigation (Stack + Tab)
│   ├── .env                    # EXPO_PUBLIC_API_URL
│   ├── CODEBASE_REFERENCE.md   # THIS FILE
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js        # API client + all endpoint functions
│   │   ├── screens/
│   │   │   ├── HomeScreen.js       # Full-featured: logs, toggle, skip days, FAB
│   │   │   ├── DashboardScreen.js  # Analytics with charts + history
│   │   │   ├── LoginScreen.js      # Email/password login
│   │   │   ├── AddHabitScreen.js   # Create/edit habit form
│   │   │   └── SettingsScreen.js   # Profile, stats, logout
│   │   └── components/
│   │       ├── Icons.js            # Icon key → lucide component map
│   │       ├── HabitItem.js        # Rich habit row component
│   │       └── FrictionModal.js    # Negative habit friction modal
│   ├── package.json
│   ├── babel.config.js          # nativewind + reanimated plugins
│   └── tailwind.config.js
```

---

## Data Models (MongoDB via Mongoose)

### User
```js
{
  name:                 String (required),
  email:                String (required, unique),
  password:             String (required, bcrypt hashed),
  xp:                   Number (default: 0),
  level:                Number (default: 1),
  streakTokens:         Number (default: 3),
  resetPasswordToken:   String,
  resetPasswordExpires: Date,
  pushSubscriptions:    Array,
  createdAt:            Date,
}
```

### Habit
```js
{
  userId:       ObjectId -> User (required),
  name:         String (required, max 100),     // NOT "title"
  icon:         String (default: 'star'),       // key from Icons map
  category:     String (default: 'General'),
  habitType:    String enum ['positive','negative'] (default: 'positive'),
  dependsOn:    ObjectId -> Habit (optional, for task chaining),
  moodTrackingEnabled: Boolean (default: false),
  dateRange: {
    isDaily:    Boolean (default: true),
    startDate:  Date,
    endDate:    Date,
  },
  skipDays:     [String] (e.g. ['Sun','Sat']),
  scheduledTime: {
    timeOption:     String enum ['any','fixed','range'] (default: 'any'),
    fixedTime:      String (e.g. '09:00'),
    timeRangeStart: String,
    timeRangeEnd:   String,
  },
  isVisible:    Boolean (default: true),         // soft-delete flag
  createdAt:    Date,
}
```

### HabitLog
```js
{
  userId:         ObjectId -> User (required),
  habitId:        ObjectId -> Habit (required),
  status:         String enum ['completed','skipped'] (required),
  dateString:     String (YYYY-MM-DD format, required),
  mood:           String enum ['great','neutral','bad'],
  completionTime: Date,
  loggedAt:       Date (default: now),
}
// Compound unique index: { habitId, dateString }
```

### Category
```js
{
  userId: ObjectId -> User (required),
  name:   String (required),
}
```

---

## API Endpoints

### Auth
| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user: { name, email, xp, level, streakTokens } }` |
| POST | `/api/auth/signup` | `{ name, email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — | `{ name, email, xp, level, streakTokens }` |
| PUT | `/api/auth/me` | `{ xp?, level?, streakTokens? }` | Updated user |
| POST | `/api/auth/logout` | — | Clears cookie |

**Auth mechanism**: Cookie (`auth_token`) on web, `Bearer` token header on mobile.

### Habits
| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| GET | `/api/habits` | — | `{ success, data: [Habit] }` (visible only, sorted createdAt desc) |
| POST | `/api/habits` | Full habit object | `{ success, data: Habit }` |
| GET | `/api/habits/:id` | — | `{ success, data: Habit }` |
| PUT | `/api/habits/:id` | Partial habit object | `{ success, data: Habit }` |
| DELETE | `/api/habits/:id` | — | Soft-delete (sets isVisible=false) |

### Habit Logs
| Method | Endpoint | Body/Query | Response |
|--------|----------|------------|----------|
| GET | `/api/habit-logs` | `?dateString=YYYY-MM-DD` OR `?startDate=...&endDate=...` | `{ success, data: [HabitLog] }` |
| POST | `/api/habit-logs` | `{ habitId, status, dateString, mood? }` | `{ success, data: HabitLog }` (upsert) |
| DELETE | `/api/habit-logs` | `{ habitId, dateString }` | Removes the log (undo completion) |
| PUT | `/api/habit-logs/token` | `{ dateString }` | Creates 'skipped-token' log for streak freeze |

### Analytics
| Method | Endpoint | Response Shape |
|--------|----------|----------------|
| GET | `/api/analytics` | `{ success, data: { completionRate, currentStreak, totalTasksDone, weeklyProgress: [{date, completed}], habitDistribution: [{name, value}] } }` |
| GET | `/api/analytics/history` | `{ success, data: [HabitLog (populated habitId -> {name, icon, category})] }` |

### Categories
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/categories` | — | `{ success, data: [Category] }` |
| POST | `/api/categories` | `{ name }` | `{ success, data: Category }` |

---

## Web App Icons Map (keys used in Habit.icon)

Available icon keys: `sleep`, `reading`, `workout`, `nutrition`, `growth`, `coffee`, `water`, `coding`, `writing`, `music`, `cardio`, `art`, `star` (default/fallback)

All are SVG path-based icons rendered via `<IconRenderer iconName="..." className="..." />`.

---

## Mobile App Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~57.0.4 | Core framework |
| react-native | 0.86.0 | UI layer |
| nativewind | ^2.0.11 | Tailwind CSS for RN (className prop) |
| tailwindcss | ^3.3.2 | CSS utility classes |
| lucide-react-native | ^1.23.0 | SVG icons (maps to web's custom Icons) |
| react-native-svg | 15.15.4 | SVG rendering (required by lucide) |
| react-native-gifted-charts | ^1.4.77 | Bar charts on Dashboard |
| react-native-reanimated | 4.5.0 | Animations |
| react-native-linear-gradient | ^2.8.3 | Gradient effects |
| expo-secure-store | ^57.0.0 | Secure token storage |
| @react-navigation/* | ^7.x | Stack + Tab navigation |

---

## Mobile API Client Pattern

```js
// All API calls go through apiClient which:
// 1. Reads Bearer token from SecureStore
// 2. Sets Content-Type: application/json
// 3. Prepends EXPO_PUBLIC_API_URL (from .env)
// 4. Throws on non-2xx with server error message
const data = await apiClient('/api/endpoint', { method, body });
```

---

## Implementation Status

### ✅ Phase 1 Complete — Bug Fixes
- Fixed `.env` trailing slash causing double-slash in API URLs
- Fixed `habit.title` → `habit.name` in HomeScreen
- Expanded `api/index.js` with all missing endpoints (habit CRUD, logs, categories, updateMe)

### ✅ Phase 2 Complete — Core Functionality
- `src/components/Icons.js` — Maps 13 icon keys to lucide-react-native components
- `src/components/HabitItem.js` — Rich habit row: checkbox, icon, name, category badge, time, lock
- `src/components/FrictionModal.js` — Negative habit friction: countdown + reflection
- `src/screens/HomeScreen.js` — Full rewrite: logs-based completion, toggle API, skip days, FAB, friction
- `src/screens/AddHabitScreen.js` — Full form: name, icon picker, category, skip days, schedule, date range
- `src/screens/SettingsScreen.js` — Profile, XP/Level/Tokens stats, logout
- `src/screens/DashboardScreen.js` — Improved with distribution bars, icons in history
- `App.js` — Tab icons, AddHabit + Settings stack screens, logout flow

### ❌ Phase 3+4 (Future)
- Activity Heatmap with streak freeze tokens
- Upcoming/Current task reminder cards
- Swipe navigation between Home and Dashboard
