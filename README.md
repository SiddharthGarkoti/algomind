# AlgoMind 🧠⚡
### An Open-Source Adaptive Learning, DSA Mentorship & Automated Proctoring Platform

[![Live Demo](https://img.shields.io/badge/Live%20Platform-Render-00C7B7?style=flat-square&logo=render&logoColor=white)](https://algomind-frontend-dvfp.onrender.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Web%20Store-AlgoMind%20Fair%20Play%20v1.0.1-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SiddharthGarkoti%2Falgomind-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/SiddharthGarkoti/algomind)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Privacy Policy](https://img.shields.io/badge/Privacy-Policy-blue.svg?style=flat-square)](PRIVACY.md)

---

## 📌 Project Overview

**AlgoMind** is an open-source platform designed to help students, developers, and university cohorts practice Data Structures and Algorithms (DSA) more effectively. 

During programming labs and self-study, learners often face two common issues:
1. **Unproductive AI Reliance**: Jumping straight to code solutions from general chatbots instead of understanding the underlying algorithmic technique.
2. **Academic Integrity in Coding Contests**: The lack of lightweight, transparent proctoring during lab assessments and friendly peer contests.

AlgoMind addresses these practical challenges through:
* **A Socratic AI Chatbot & Mentor Engine** that provides step-by-step guidance, algorithmic hints, and debugging insights without leaking full solution code.
* **The AlgoMind Fair Play Chrome Extension (v1.0.1)** for transparent, automated tab-focus and domain monitoring during ranked contests.
* **Unified Profile Analytics** that aggregate problem-solving activity from LeetCode and Codeforces into a consolidated skill radar and topic breakdown.
* **An In-Browser Arena IDE** supporting multi-language execution (`C++`, `Python`, `Java`, `C`, `JavaScript`) with custom `stdin` input.

---

## 💻 Technology Stack

### 🌐 Web Application Stack

| Component | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite | Single-page application architecture and fast client-side builds |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | In-browser syntax highlighting and IDE editing experience |
| **Routing & Navigation**| React Router v7 (`react-router-dom`) | Client-side routing, protected auth routes, and contest rooms |
| **Styling** | Tailwind CSS, PostCSS, Autoprefixer | Responsive, clean UI system with dark-mode support |
| **Backend Framework** | Django 6.0, Django REST Framework (DRF) | RESTful API endpoints, request handling, and business logic |
| **Authentication** | Django SimpleJWT (`djangorestframework-simplejwt`) | Stateless JWT access and refresh token authentication |
| **Database** | PostgreSQL / SQLite | Relational persistence for users, challenges, submissions, and ratings |
| **Code Execution** | Wandbox & Judge0 API Proxy Gateway | Backend compilation and test execution with custom `stdin` |
| **Platform Connectors** | Custom scraping & REST API clients | Live stats retrieval and solve verification for LeetCode & Codeforces |
| **Email Service** | Django Core Mail (SMTP) | One-Time Password (OTP) verification for registration and account safety |

---

### 🛡️ Chrome Extension Tech Stack (`AlgoMind Fair Play v1.0.1`)

The companion browser extension enforces contest integrity during live ranked sessions without recording keystrokes, audio, or video.

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Architecture** | Chrome Extension Manifest V3 | Standard background service worker architecture |
| **Service Worker** | Modern JavaScript (ES Modules) | `background.js` handles state management, session timers, and strike detection |
| **Content Scripts** | Vanilla JavaScript | `content/algomind.js` (application bridge) & `content/platforms.js` (tab monitor) |
| **Chrome APIs** | `chrome.tabs`, `chrome.windows`, `chrome.alarms`, `chrome.storage.local`, `chrome.notifications`, `chrome.runtime` | Tab lifecycle tracking, alarms for periodic heartbeats, persistent local config |
| **UI & Overlays** | HTML5, Vanilla CSS3 | Lightweight popup interface (`popup/popup.html`) and in-page alert HUD overlay |
| **Communication** | Window `postMessage` & DRF REST API | Bidirectional message bridge between the React frontend and background worker |

---

## 🤖 AlgoMind Socratic AI Engine & DSA Chatbot

Instead of acting as a general-purpose code generator that writes solutions on command, AlgoMind's AI engine is tailored specifically as a **Socratic DSA Mentor**:

```
                       ┌─────────────────────────────────────────┐
                       │          User Problem Context           │
                       │  (Problem Title, Description, Code)     │
                       └───────────────────┬─────────────────────┘
                                           │
                       ┌───────────────────▼─────────────────────┐
                       │    AlgoMind Socratic System Prompts     │
                       │  (Strict Non-Disclosure Instructions)   │
                       └───────────────────┬─────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
┌────────▼────────┐              ┌─────────▼─────────┐             ┌─────────▼────────┐
│  /api/ai/hint/  │              │  /api/ai/explain/ │             │  /api/ai/debug/  │
│ Targeted hints  │              │ Conceptual time & │             │ Pinpoints logic  │
│ without code    │              │ space complexity  │             │ & boundary bugs  │
└─────────────────┘              └───────────────────┘             └──────────────────┘
```

### Core Capabilities:
1. **Targeted Hints (`/api/ai/hint/`)**: Delivers conceptual nudges (e.g., suggesting suitable data structures or invariant properties) while strictly withholding solution code.
2. **Algorithmic Explanation (`/api/ai/explain/`)**: Breaks down difficult paradigms (such as Dynamic Programming state transitions or Graph traversals) using intuitive analogies.
3. **Bug Diagnostics (`/api/ai/debug/`)**: Pinpoints logical bugs, missing edge cases (e.g., empty input, overflow, off-by-one errors) without rewriting the student's solution.
4. **Adaptive Study Plan Synthesis (`/api/ai/generate-plan/`)**: Analyzes identified weak topics from linked LeetCode and Codeforces accounts to generate a progressive, multi-week study roadmap based on chosen intensity (*Light*, *Balanced*, or *Intense*).

*Note: The engine can interface with local self-hosted open-source models or API endpoints while applying strict instructional constraints.*

---

## 📈 Rating & Progression System (How it Works)

AlgoMind features an internal rating and level progression engine to track problem-solving consistency and competitive performance.

### 1. Base Metrics & Leveling
* **Starting Rating**: Every newly registered user begins with a baseline rating of **1,000**.
* **Level Calculation**: Level increases dynamically every 500 rating points:
  $$\text{Level} = \max\left(1, \left\lfloor \frac{\text{Rating}}{500} \right\rfloor\right)$$
* **Non-Negative Bound**: Rating is bounded below by 0: $\text{Rating} = \max(0, \text{Rating} + \Delta)$.

### 2. Rating Point Distribution ($\Delta$)

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────┐
│ Activity Trigger                             │ Rating Adjustment                        │
├──────────────────────────────────────────────┼──────────────────────────────────────────┤
│ Arena Easy Problem Solved                    │ +10 to +20 points                        │
│ Arena Medium Problem Solved                  │ +25 to +40 points                        │
│ Arena Hard Problem Solved                    │ +50 points                               │
│ Study Goal / Adaptive Plan Completed         │ +200 points                              │
│ Ranked Party — 1st Place (Winner)            │ +100 points + 10 × (Participants − 1)    │
│ Ranked Party — 2nd Place                     │ +60 points                               │
│ Ranked Party — 3rd Place                     │ +30 points                               │
│ Ranked Party — Other Finishing Participants  │ +10 points                               │
└──────────────────────────────────────────────┴──────────────────────────────────────────┘
```

### 3. Contest Win Formula
For ranked contest parties, the winner's bonus dynamically scales with lobby size:
$$\text{Points}_{\text{Rank 1}} = 100 + 10 \times \max(0, N_{\text{participants}} - 1)$$
This formula rewards participants more significantly when competing in larger group sessions.

---

## 🔄 User Flows Explained

### Comparison: Individual Learner vs. University / Institutional Learner

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────┐
│ Flow Step     │ Individual Self-Study User   │ University / Institutional User          │
├───────────────┼──────────────────────────────┼──────────────────────────────────────────┤
│ Onboarding    │ Registers via email or OAuth │ Registers with university domain email   │
│ Goal Setup    │ Connects personal LC / CF    │ Enrolls in designated course or cohort   │
│ Practice Mode │ Self-directed practice in    │ Scheduled lab contests with enforced     │
│               │ Arena with Socratic AI tutor │ rules and identical problem sets         │
│ Proctoring    │ Optional / Casual mode       │ Enforced Fair Play Extension monitoring  │
│ Assessment    │ Personal progress tracking   │ Cohort leaderboard and submission logs   │
└──────────────────────────────────────────────┴──────────────────────────────────────────┘
```

* **Individual User Flow**:
  1. Signs up with email OTP or GitHub/Google OAuth.
  2. Enters LeetCode or Codeforces usernames to scrape historical metrics and construct an initial topic radar.
  3. Selects a study goal (e.g., "Prepare for Interviews") to generate an adaptive weekly schedule.
  4. Solves problems in the Arena IDE with custom inputs and consults the Socratic AI tutor when stuck.
  5. Can optionally create casual, unranked friendly matches with peers.

* **University / Institutional User Flow**:
  1. Students log in during lab hours using institutional credentials.
  2. The instructor provides a unique 6-character room code for the lab session.
  3. Students must have the AlgoMind Fair Play extension active before joining the session.
  4. Students solve problems within the allotted timeframe under active anti-cheat monitoring.
  5. Submissions are auto-verified against external platforms or backend testcases, updating the live session leaderboard.

---

### Comparison: Admin (Instructor / Host) vs. Student (Participant)

```
       Instructor / Host Flow                         Student / Participant Flow
                 │                                                │
                 ▼                                                ▼
     [ Create Ranked Party ]                             [ Join via Room Code ]
    (Set time, questions, strikes)                                │
                 │                                                ▼
                 ▼                                   [ Extension Verification ]
     [ Enable Spectator Mode ]                       (Manifest V3 active & synced)
  (Observe session without competing)                             │
                 │                                                ▼
                 ▼                                     [ Solve Lab Problems ]
    [ Live Dashboard Monitoring ]                    (Restricted from solution tabs)
   (Real-time blurs, strikes, heartbeats)                         │
                 │                                                ▼
                 ▼                                    [ Auto-Verify Submissions ]
    [ Review Session Results ]                       (Scoreboard update & rating gain)
```

* **Admin / Instructor Flow**:
  1. **Room Creation**: Navigates to `/challenges`, configures party parameters:
     * Question selection: Manual pick or AI Shuffle by difficulty/topic.
     * Match duration (e.g., 60–90 minutes).
     * Integrity threshold: Configures strike tolerance (between 1 and 5 strikes).
     * **Host Spectator Mode**: Toggles `host_spectator=True` so the instructor can oversee the room without competing or appearing in participant rankings.
  2. **Live Monitoring**: Tracks participant heartbeat signals, extension statuses, window blur warnings, and automated strike tallies in real-time.
  3. **Evaluation**: Views verified solve times, participant rankings, and potential integrity infractions upon session conclusion.
  4. **Community Administration**: Instructors with `is_admin=True` can publish announcements and guidelines to the community feed.

* **Student / Participant Flow**:
  1. **Session Entry**: Enters the 6-character party code to join the lobby.
  2. **Extension Check**: The client verifies that the `AlgoMind Fair Play` extension is running. An in-page HUD displays connection status.
  3. **Problem Solving**: Opens problem statements and writes solutions within the Arena or linked platform.
  4. **Violation Prevention**: If the student leaves the window, switches tabs, or opens blacklisted paths (`/solutions`, `/discuss`, `/blog`), a strike is registered and an alert is shown.
  5. **Auto-Verification & Completion**: Solutions are checked against timestamps. Upon completing all questions, the student's finish time is recorded, ranks are assigned, and rating points are awarded.

---

## 🛡️ Fair Play Extension — Rule Matrix

```
┌────────────────────────────────────────┬──────────────────┬──────────────────────────┐
│ Event Triggered                        │ Grace Period     │ Action Taken             │
├────────────────────────────────────────┼──────────────────┼──────────────────────────┤
│ Window blur / focus loss               │ 0 ms             │ Record Strike + Alert    │
│ Continuous blur (>7 seconds)           │ 7,000 ms         │ Additional Strike        │
│ Switch to unwhitelisted tab            │ 2,500 ms         │ Record Strike + Alert    │
│ Access restricted path (/solutions)    │ 0 ms             │ Immediate Strike         │
│ Exceeding maximum strike tolerance     │ Immediate        │ Automatic Forfeit        │
│ Extension disabled / pulse missing     │ 12,000 ms        │ Automatic Forfeit        │
└────────────────────────────────────────┴──────────────────┴──────────────────────────┘
```

* **Whitelisted Domains**: `leetcode.com`, `codeforces.com`, `atcoder.jp`, `localhost`, `onrender.com`.
* **Restricted Subpaths**: LeetCode (`/solutions`, `/discuss`, `/explore`, `/companies`), Codeforces (`/blog`, `/tutorial`).

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth/`)
* `POST /send-otp/`: Dispatches 6-digit email verification code.
* `POST /verify-otp/`: Validates OTP before account creation.
* `POST /register/`: Creates a user account after email verification.
* `POST /login/`: Validates credentials and returns JWT access & refresh tokens.
* `POST /token/refresh/`: Refreshes expired access tokens.
* `GET/PUT /profile/`: Retrieves or updates current user profile.

### 💻 DSA Arena (`/api/dsa/`)
* `GET /problems/`: Paginated problem list with topic and difficulty filters.
* `GET /problems/<id>/`: Fetches problem statement, examples, and constraints.
* `POST /execute-code/`: Proxies execution with custom `stdin` to the compiler backend.
* `POST /submit/`: Evaluates solution and dispatches rating updates.

### 🤖 AI Mentor (`/api/ai/`)
* `POST /hint/`: Returns Socratic, non-solution algorithmic hints.
* `POST /explain/`: Provides conceptual and complexity breakdown of an approach.
* `POST /debug/`: Diagnoses logic errors and edge-case oversights.
* `POST /generate-plan/`: Generates a personalized study pathway based on weak areas.

### 🏆 Code Parties (`/api/challenges/`)
* `POST /party/create/`: Initializes a casual or ranked contest party.
* `POST /party/<code>/join/`: Joins an active lobby using a 6-character code.
* `POST /party/<code>/start/`: Host locks room and initiates contest timer.
* `POST /party/<code>/pulse/`: Validates extension presence via periodic heartbeat.
* `POST /party/<code>/strike/`: Registers proctoring violation strike.
* `POST /party/<code>/questions/check/`: Verifies solution completion on external platform.

---

## 🛠️ Local Development & Setup

### Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: v18.0.0 or higher
* **npm** and **pip**
* **Google Chrome**: For running the extension locally

---

### 1. Backend Setup (Django REST Framework)

```bash
# 1. Navigate to backend directory
cd Backend

# 2. Set up virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create local environment file
cp .env.example .env
```

Configure `Backend/.env`:
```env
DEBUG=True
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com

# Database (defaults to SQLite if DATABASE_URL is unset)
# DATABASE_URL=postgres://user:password@host:5432/dbname

# Email Verification (SMTP for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True

# Compiler Gateway Settings (Optional / Custom)
JUDGE0_BASE_URL=https://ce.judge0.com
JUDGE0_AUTH_TOKEN=
```

Apply database migrations and start server:
```bash
python manage.py migrate
python manage.py runserver
```
*Backend runs locally at: `http://127.0.0.1:8000/`*

---

### 2. Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
*Frontend runs locally at: `http://localhost:5173/`*

---

### 3. Chrome Extension Setup (`AlgoMind-Extension`)

* **Option A: Chrome Web Store**: Install directly from the official [Chrome Web Store](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib).
* **Option B: Local Developer Mode**:
  1. Open Chrome and go to `chrome://extensions/`.
  2. Enable the **Developer mode** toggle (top right).
  3. Click **Load unpacked**.
  4. Select the `AlgoMind-Extension` directory from this repository.

---

## 📜 License & Acknowledgments

This project is licensed under the **[MIT License](LICENSE)**. You are free to use, modify, and distribute this software for personal, educational, or commercial purposes.

* Authored by **[Siddharth Garkoti](https://github.com/SiddharthGarkoti)**.
* Feedback, bug reports, and pull requests are warmly welcomed via [GitHub Issues](https://github.com/SiddharthGarkoti/algomind/issues).