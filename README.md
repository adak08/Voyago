# ✈️ Voyago — Travel Smartly and Wisely

A full-stack **MERN** group trip planning platform with AI-powered itineraries, real-time chat, expense splitting, and photo sharing.

---

## 🚀 Features

- **AI Trip Planner** — Python AI microservice (FastAPI + LangGraph + Gemini + OpenWeather + OpenRouteService) generates day-by-day itineraries with weather, route, and dynamic budget breakdowns
- **Real-time Group Chat** — Socket.IO powered messaging with typing indicators, emoji reactions, file/media uploads, and read receipts
- **Smart Expense Splitting** — Equal, custom, and percentage splits with balance calculation and receipt uploads
- **Itinerary Board** — AI-generated or manually editable itinerary synced live across all members
- **Photo Gallery** — Drag-and-drop uploads via Cloudinary with lightbox viewer
- **Authentication** — JWT + Refresh Token rotation, OTP email verification, Google OAuth, and Forgot Password flow
- **Notifications** — Real-time in-app notifications for trip events, expenses, and chat
- **Trip Management** — Create trips, join via invite code or email, transfer admin rights

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, Socket.IO Client, React Router v6 |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB + Mongoose |
| AI | Python FastAPI + LangGraph + Google Gemini 2.5 Flash + OpenWeather + OpenRouteService |
| Media | Cloudinary (photos, receipts, chat media) |
| Email | Nodemailer |
| Cache / Scaling | Redis (optional, for Socket.IO multi-server adapter) |
| Auth | JWT (access + refresh tokens), Google OAuth |

---

## 📁 Project Structure

```
voyago/
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── components/       # UI components (ChatBox, ExpenseWidget, etc.)
│   │   │   └── ai/           # AI result display components
│   │   ├── pages/            # Route pages (Dashboard, TripDetails, AIPlannerPage, etc.)
│   │   ├── services/         # Axios API service modules
│   │   ├── store/            # Zustand state stores
│   │   └── hooks/            # Custom hooks (useSocket)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                   # Express backend
│   └── src/
│       ├── config/           # DB, Cloudinary, Socket.IO setup
│       ├── controllers/      # Route handlers
│       ├── middlewares/      # Auth, error handling, rate limiting, validation
│       ├── models/           # Mongoose schemas
│       ├── routes/           # Express routers
│       ├── services/
│       │   └── orchestrator/ # Calls Python AI planner service
│       ├── utils/            # Helpers (expense calc, OTP, invite code)
│       ├── app.js
│       └── index.js
│
└── ai_service/               # Python AI planning microservice
  ├── main.py               # FastAPI app
  ├── routes/               # /plan, /plan-test, /agents/status
  ├── graph/                # LangGraph nodes/workflow
  ├── tools/                # weather, route, budget utilities
  └── schemas/              # Request schema
```

---

## ⚙️ Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB (local or Atlas)
- A Cloudinary account
- API keys (see Environment Variables below)

---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/voyago.git
cd voyago
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

### 4. Install AI service dependencies

```bash
cd ../ai_service
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🌐 Environment Variables

### Server — `server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/voyago

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=7d
JWT_RESET_SECRET=your_reset_secret_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Voyago <noreply@voyago.com>

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Python AI service endpoint
PYTHON_SERVICE_URL=http://127.0.0.1:8000

# Redis (optional — for multi-server Socket.IO scaling)
REDIS_URL=redis://localhost:6379
```

### AI Service — `ai_service/.env`

```env
# Gemini
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Weather + Route
OPENWEATHER_KEY=your_openweather_api_key
ORS_API_KEY=your_openrouteservice_key
```

### Client — `client/.env` (optional)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id  # Falls back to server-side if not set
```

---

## ▶️ Running the App

### Development

Open three terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — AI Service:**
```bash
cd ai_service
# Windows
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 — Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`. The backend runs on `http://localhost:5000`, and the AI service runs on `http://127.0.0.1:8000`.

### Production

```bash
# Build the frontend
cd client && npm run build

# Start the backend
cd ../server && npm start
```

---

## 📡 API Endpoints

### Auth — `/api/v1/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register with name, email, password |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/login` | Email/password login |
| POST | `/google` | Google OAuth login |
| GET | `/google-client-id` | Get Google client ID |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/verify-reset-otp` | Verify reset OTP |
| POST | `/reset-password` | Reset password with token |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (invalidates refresh token) |
| GET | `/me` | Get current user |
| PATCH | `/update-profile` | Update name / avatar |

### Trips — `/api/v1/trips`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all user trips |
| POST | `/` | Create a new trip |
| POST | `/ai-import` | Save an AI-generated trip |
| POST | `/join` | Join trip via invite code |
| GET | `/invite/:code` | Preview trip by invite code |
| GET | `/:id` | Get trip by ID |
| PUT | `/:id` | Update trip (admin only) |
| DELETE | `/:id` | Delete trip (admin only) |
| DELETE | `/:id/leave` | Leave a trip |
| PATCH | `/:id/transfer-admin` | Transfer admin role |
| POST | `/:id/invite-email` | Send invite via email |
| POST | `/:id/upload` | Upload trip photo |
| GET | `/:tripId/messages` | Get paginated chat messages |
| POST | `/:tripId/messages` | Send a message (REST fallback) |

### Expenses — `/api/v1/expenses`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Add expense (with optional receipt) |
| GET | `/:tripId` | Get trip expenses |
| GET | `/:tripId/balances` | Get who owes whom |
| GET | `/:tripId/settlements` | Get settlements |
| POST | `/settle` | Create a settlement |
| DELETE | `/:id` | Delete expense |

### Itinerary — `/api/v1/itinerary`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/:tripId` | Get itinerary |
| PUT | `/:tripId` | Update itinerary manually |
| POST | `/:tripId/generate` | Generate itinerary with AI |
| POST | `/:tripId/day` | Add a day |
| DELETE | `/:tripId/day/:dayIndex` | Remove a day |

### AI Planner — `/api/v1/ai`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/plan-trip` | Generate full AI trip plan |
| GET | `/agents/status` | Check which API keys are configured |

### Chat — `/api/v1/chat`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload chat media file |

### Notifications — `/api/v1/notifications`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all notifications |
| PATCH | `/read-all` | Mark all as read |
| PATCH | `/:id/read` | Mark one as read |
| DELETE | `/:id` | Delete notification |

---

## 🗄️ Database Models

| Model | Description |
|---|---|
| `User` | Auth, profile, Google OAuth, refresh token |
| `Trip` | Title, destination, dates, members, invite code, photos |
| `Itinerary` | AI-generated or manual day-by-day plan, weather/route/budget data |
| `Expense` | Amount, category, paidBy, splits (equal/unequal/percentage), receipt |
| `Settlement` | Payment records between trip members |
| `Message` | Chat messages with media support and emoji reactions |
| `Notification` | In-app notifications for trip events |
| `OTP` | Email verification and password reset OTPs (TTL-indexed) |

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join_trip` | Client → Server | Join a trip room |
| `leave_trip` | Client → Server | Leave a trip room |
| `send_message` | Client → Server | Send a chat message |
| `receive_message` | Server → Client | New message broadcast |
| `typing` | Client → Server | Typing indicator |
| `user_typing` | Server → Client | Typing broadcast |
| `message_seen` | Client ↔ Server | Mark messages as read |
| `add_reaction` | Client → Server | Add emoji reaction |
| `remove_reaction` | Client → Server | Remove emoji reaction |
| `reaction_updated` | Server → Client | Reaction state broadcast |
| `expense_added` | Server → Client | New expense sync |
| `itinerary_synced` | Server → Client | Itinerary update sync |
| `trip_photo_uploaded` | Server → Client | New photo sync |
| `trip_admin_transferred` | Server → Client | Admin change sync |
| `new_notification` | Server → Client | Real-time notification |

---

## 🤖 AI Planning Architecture

Trip planning now flows through a dedicated Python AI service:

```
Client (AIPlannerPage)
  -> Node API (/api/v1/ai/plan-trip)
  -> Python AI Service (/plan)
     ├── weather tool    -> OpenWeather
     ├── route tool      -> OpenRouteService
     ├── budget tool     -> baseline estimate
     ├── planner node    -> Gemini itinerary generation
     └── budget sync     -> recompute totals from itinerary activity costs
```

If weather/route APIs are unavailable, the service still returns partial results with `available: false` while itinerary generation continues.

---

## 📦 Running Tests

```bash
cd server
npm test
```

---

## 📝 Notes

- The trip status cron job (upcoming → ongoing → completed) runs daily at midnight IST
- Redis is optional; without it Socket.IO uses an in-memory adapter (single-server only)
- Cloudinary is required for photo uploads, chat media, and expense receipts
- AI planning depends on the Python service; ensure `PYTHON_SERVICE_URL` is configured and `ai_service` is running
- Gemini key is required in `ai_service/.env` for itinerary generation

---

## 📄 License

MIT