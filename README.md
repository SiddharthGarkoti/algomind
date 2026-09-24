# AlgoMind 🧠⚡
### Adaptive Learning, DSA Mentorship & Automated Anti-Cheat Proctoring Platform

[![Live Demo](https://img.shields.io/badge/Live%20Platform-Render-00C7B7?style=flat-square&logo=render&logoColor=white)](https://algomind-frontend-dvfp.onrender.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Web%20Store-AlgoMind%20Fair%20Play%20v1.0.1-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SiddharthGarkoti%2Falgomind-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/SiddharthGarkoti/algomind)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square)](LICENSE)
[![Privacy Policy](https://img.shields.io/badge/Privacy-Policy-blue.svg?style=flat-square)](PRIVACY.md)

---

## 📌 Project Overview

**AlgoMind** is an integrated software platform engineered to help students, developers, and university computer science cohorts practice Data Structures and Algorithms (DSA) through structured guidance, objective performance tracking, and live proctored coding assessments.

Learners and academic institutions face two persistent bottlenecks:
1. **Passive Solution Copying**: Raw access to general chatbots often leads students to copy-paste completed code rather than developing algorithmic intuition and reasoning through constraints.
2. **Integrity During Lab Contests**: Conducting lab programming tests on third-party competitive platforms (LeetCode, Codeforces) lacks lightweight, non-invasive proctoring to prevent opening solution tabs or switching to forbidden resources.

AlgoMind resolves these challenges through:
* **A Socratic AI Chatbot & Mentorship Engine** that delivers targeted hints, complexity analyses, and edge-case diagnostics without disclosing complete solution code.
* **The AlgoMind Fair Play Extension (v1.0.1)** for Chrome (Manifest V3), executing live tab-focus, continuous blur, and forbidden subpath monitoring.
* **Multi-Platform Analytics** unifying statistics and topic mastery across LeetCode and Codeforces into an interactive radar visualization.
* **An In-Browser Arena IDE** featuring Monaco Editor and multi-language compilation (`C++`, `Python`, `Java`, `C`, `JavaScript`) with custom `stdin` support.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & Extension Layer"]
        ReactApp["React 18 + Vite Web Application\n(Dashboard, Arena IDE, Party Rooms, Analytics)"]
        ChromeExt["AlgoMind Fair Play Extension v1.0.1\n(Manifest V3 Service Worker + Content Scripts)"]
    end

    subgraph BackendLayer ["Django REST Framework Backend Layer"]
        AuthService["Authentication & Security\n(JWT, Email OTP, OAuth2)"]
        ArenaService["DSA Arena & Sandbox Proxy\n(Custom stdin execution, test validation)"]
        ChallengeHub["Code Party & Proctoring Hub\n(Heartbeat synchronizer, strike counter, spectator observer)"]
        AnalyticsService["Platform Analytics & Scrapers\n(LeetCode GraphQL & Codeforces API client)"]
        AIEngine["Socratic AI Mentor Gateway\n(Prompt constraint engine, plan generator)"]
    end

    subgraph AIAndExecution ["AI Engine & Sandbox Compilers"]
        LLMService["AlgoMind LLM Engine\n(Socratic Mentorship, Bug Diagnosis & Step-by-Step Hints)"]
        WandboxJudge0["Compiler Sandboxes\n(Judge0 / Wandbox Execution Engines)"]
    end

    subgraph ExternalAndData ["Persistence & External Platforms"]
        Database[("PostgreSQL / SQLite Database\n(Users, Parties, Submissions, Ratings)")]
        LeetCodePlatform["LeetCode Platform\n(Profile stats & solve verification)"]
        CodeforcesPlatform["Codeforces Platform\n(Ratings & contest submission scraping)"]
    end

    ReactApp <-->|REST API / JWT Bearer| BackendLayer
    ChromeExt <-->|Window postMessage Bridge| ReactApp
    ChromeExt -.->|Tab Focus & Subpath Monitoring| LeetCodePlatform
    ChromeExt -.->|Tab Focus & Subpath Monitoring| CodeforcesPlatform

    AIEngine <-->|Socratic Prompt Inference| LLMService
    ArenaService <-->|Compile & Execute with Custom stdin| WandboxJudge0
    AnalyticsService <-->|Scrape & Index Solves| LeetCodePlatform
    AnalyticsService <-->|Fetch Handles & Ratings| CodeforcesPlatform
    BackendLayer <--> Database
```

---

## 💻 Technology Stack

### 🌐 Web Application Stack

| Component | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite | High-performance single-page application architecture |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | In-browser syntax highlighting and IDE editing experience |
| **Routing & Navigation**| React Router v7 (`react-router-dom`) | Declarative client-side routing, protected auth routes, and contest rooms |
| **Styling** | Tailwind CSS, PostCSS, Autoprefixer | Cohesive dark-mode design system with responsive layouts |
| **Backend Framework** | Django 6.0, Django REST Framework (DRF) | Scalable REST API endpoints, serializers, and permission middleware |
| **Authentication** | Django SimpleJWT (`djangorestframework-simplejwt`) | Stateless JWT access and refresh token authentication lifecycle |
| **Database** | PostgreSQL / SQLite | Persistence for users, challenges, submissions, ratings, and notifications |
| **Code Execution** | Wandbox & Judge0 API Gateway | High-speed proxy compilation supporting custom `stdin` execution |
| **Platform Connectors** | Custom scraping & REST API clients | Live solve verification and stats extraction for LeetCode & Codeforces |
| **Email Service** | Django Core Mail (SMTP / Console Fallback) | Secure 6-digit OTP verification for account registration |

---

### 🛡️ Chrome Extension Tech Stack (`AlgoMind Fair Play v1.0.1`)

The companion browser extension enforces contest integrity during live ranked sessions without capturing keystrokes, webcam footage, or intrusive audio recordings.

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Architecture** | Chrome Extension Manifest V3 | Service worker background architecture adhering to modern security standards |
| **Service Worker** | Modern JavaScript (ES Modules) | `background.js` manages session state, heartbeat timers, and violation debouncing |
| **Content Scripts** | Vanilla JavaScript | `content/algomind.js` (application bridge) & `content/platforms.js` (tab monitor) |
| **Chrome APIs** | `chrome.tabs`, `chrome.windows`, `chrome.alarms`, `chrome.storage.local`, `chrome.notifications`, `chrome.runtime` | Real-time tab lifecycle tracking, periodic heartbeats, and local configuration persistence |
| **UI & Overlays** | HTML5, Vanilla CSS3 | Lightweight popup interface (`popup/popup.html`) and in-page status HUD overlay |
| **Communication** | Window `postMessage` & DRF REST API | Bidirectional message bridge connecting the React frontend to background worker |

---

## 🤖 AlgoMind Socratic AI Engine & DSA Chatbot

AlgoMind avoids generic code completion. Instead, its algorithmic mentor uses strict system constraints to reinforce student problem-solving:

```
                       ┌─────────────────────────────────────────┐
                       │          User Problem Context           │
                       │  (Problem Title, Description, Code)     │
                       └───────────────────┬─────────────────────┘
                                           │
                       ┌───────────────────▼─────────────────────┐
                       │    AlgoMind Socratic Prompt System      │
                       │  (Strict Non-Disclosure Instructions)   │
                       └───────────────────┬─────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
┌────────▼────────┐              ┌─────────▼─────────┐             ┌─────────▼────────┐
│  Targeted Hints │              │ Algorithm Explain │             │  Bug Diagnostics │
│ Nudges student  │              │ Conceptual time & │             │ Identifies logic │
│ forward (no code)│             │ space complexity  │             │ & edge case bugs │
└─────────────────┘              └───────────────────┘             └──────────────────┘
```

1. **Targeted Hints**: Identifies invariant properties, optimal data structures, or subproblem formulations without presenting the solution.
2. **Algorithmic Explanation**: Breaks down algorithmic paradigms (Dynamic Programming state transitions, Tree/Graph traversals) using intuitive mental models.
3. **Bug Diagnostics**: Highlights boundary bugs, unhandled empty inputs, and off-by-one errors without refactoring the code on the user's behalf.
4. **Adaptive Study Plan Synthesis**: Evaluates weak topics identified by platform scrapers and generates multi-week milestone schedules across chosen study intensities (*Light*, *Balanced*, or *Intense*).

---

## 🔄 User Flows in Detail

AlgoMind supports three distinct operational flows designed for personal development, cohort-based academic lab coursework, and faculty administration.

---

### Flow 1: Individual Learner User Flow

The individual flow is self-directed and tailored for personal interview prep and skill progression.

```mermaid
flowchart TD
    A[Visit AlgoMind Platform] --> B[Register with Email OTP or OAuth2]
    B --> C[Connect Competitive Profiles\nLeetCode & Codeforces Handles]
    C --> D[Generate Profile Analytics\nWeak-Area Radar & Topic Breakdown]
    D --> E{Choose Practice Path}
    E -->|Self-Paced Practice| F[Explore In-Browser Arena IDE]
    E -->|Structured Growth| G[Generate Adaptive AI Study Plan]
    F --> H[Write Code with Custom stdin Input]
    H --> I[Encounter Blocker / Edge Case Failure]
    I --> J[Consult Socratic AI Mentor\nHints & Complexity Insights]
    J --> H
    H --> K[Submit & Earn Rating Points]
    G --> L[Complete Daily Milestones]
    L --> M[Award +200 Rating Completion Bonus]
```

#### Detailed Breakdown:
1. **Onboarding & Handle Linking**: The learner signs in via email OTP or GitHub/Google OAuth. They connect their public LeetCode and Codeforces handles. AlgoMind validates the profiles and crawls solved problem distributions.
2. **Skill Gap Diagnostics**: The analytics dashboard categorizes problems into core algorithm tags (Graphs, DP, Binary Search, Greedy, Trees, Arrays). A radar chart exposes topic weaknesses.
3. **Adaptive Goal Track**: The learner selects an intensity (*Light* 1–2 problems/day, *Balanced* 3–4 problems/day, or *Intense* 5+ problems/day). The AI plan generator constructs a personalized roadmap.
4. **Arena IDE & Socratic Guidance**: While coding in the Arena IDE, the student executes testcases with custom `stdin`. When stuck, they query the Socratic AI Mentor for hints or bug explanations without having the solution spoiled.
5. **Rating Progression**: Verified submissions award rating points, contributing to level progression (`User.award_rating()`).

---

### Flow 2: Student with College / University Login Flow

The student flow is structured for lab assessments, classroom contests, and scheduled university coding examinations.

```mermaid
flowchart TD
    A[Student Enters Lab Environment] --> B[Authenticate with College Email Domain]
    B --> C[Ensure AlgoMind Fair Play Extension Active]
    C --> D[Extension Injects DOM Sentinel & Pairs with App]
    D --> E[Enter 6-Character Party Room Code]
    E --> F[Waiting Lobby: Verification of Extension Handshake]
    F --> G[Instructor Triggers Contest Start]
    G --> H[Contest HUD Activates on Permitted Tabs]
    H --> I[Solve Problems on LeetCode / Codeforces / Arena]
    I --> J{Fair Play Rule Check}
    J -->|Window Blur or Tab Switch| K[Record Strike + Visual Alert]
    J -->|Access /solutions or /discuss| L[Immediate Violation Strike]
    J -->|Heartbeat Signal Dropped >12s| M[Automatic Match Forfeit]
    J -->|Cumulative Strikes >= MaxStrikes| M
    J -->|Compliant Behaviour| N[Solve Problem Successfully]
    N --> O[Backend Scraper Verifies Solve Timestamp]
    O --> P[Update Live Room Leaderboard & Level Score]
```

#### Detailed Breakdown:
1. **Verified Lab Check-In**: Students log in using their verified institutional email.
2. **Extension Handshake**: The React web app detects the companion extension via an injected DOM sentinel (`__algomind_extension_installed__`). If the extension is missing or disabled, the student is blocked from entering ranked contest rooms.
3. **Lobby Joining**: The student submits the 6-character room code provided by the lab instructor and enters the waiting lobby.
4. **Active Contest Monitoring**: Once the host triggers the contest, the extension receives the configuration payload (`partyCode`, `maxStrikes`). A live floating HUD overlay appears on permitted domains.
5. **Strict Proctoring Enforcement**:
   - Leaving the window registers a blur violation strike.
   - Navigating to forbidden URLs (such as LeetCode's `/solutions` or Codeforces' `/blog`) registers an immediate strike.
   - If the extension process is killed or uninstalled, the missed 4-second pulse triggers an automatic match forfeit after 12 seconds.
6. **Submission Verification & Scoring**: Upon solving an assigned problem, the backend verifies the solution timestamp against the contest start time, updating participant ranking in real time.

---

### Flow 3: Admin / Institution / Faculty User Flow

The admin flow empowers department faculty, lab instructors, and contest hosts to supervise coding sessions with zero grading friction.

```mermaid
flowchart TD
    A[Faculty / Admin Login] --> B[Navigate to Challenges Hub]
    B --> C[Configure Custom Contest Room]
    C --> D[Set Duration, Strikes Tolerance 1-5, and Topic Mode]
    D --> E[Select Problems Manually or via AI Topic Shuffle]
    E --> F[Toggle Host Spectator Mode ON]
    F --> G[Initialize Room & Receive 6-Character Code]
    G --> H[Disseminate Code to Student Cohort]
    H --> I[Monitor Live Lobby as Students Check In]
    I --> J[Click Start Contest to Lock Room]
    J --> K[Live Proctoring Supervision Dashboard]
    K --> L[Observe Real-Time Window Blurs & Tab Strikes]
    K --> M[Track Live Heartbeat Pulses & Forfeits]
    K --> N[Live Leaderboard with Verified Solve Timestamps]
    N --> O[Contest Concludes / Timer Expires]
    O --> P[Export Final Class Standings & Integrity Audit Log]
    P --> Q[Publish Announcements in Community Feed]
```

#### Detailed Breakdown:
1. **Contest Session Configuration**: Instructors navigate to `/challenges` and configure match parameters:
   - Match duration (e.g., 60, 90, or 120 minutes).
   - Problem selection: Specific problem links or topic-filtered shuffle.
   - Integrity tolerance: Host-configurable strike threshold (1 to 5 strikes).
2. **Host Spectator Mode Activation**: Instructors toggle `host_spectator=True`. This marks their membership as `is_spectator=True`, enabling complete visibility without appearing on the scoreboard or altering participant ranks.
3. **Lobby Orchestration**: The host shares the 6-character party code with students and monitors the waiting room as participants connect and complete the extension handshake.
4. **Live Proctoring Oversight**: During the active contest, the instructor supervises a real-time monitor:
   - Real-time strike alerts showing student usernames and violation types.
   - Active heartbeat statuses to detect attempts at disconnecting or tampering with the extension.
   - Dynamic solve completion counters.
5. **Post-Contest Review & Community Management**: After the contest expires, the instructor reviews final rankings, verified submission timestamps, and anti-cheat event logs. Administrators (`is_admin=True`) can publish official problem breakdowns to the community discussion board.

---

## 📈 Rating & Progression System

AlgoMind features an internal rating and level progression engine to measure consistency and performance.

### 1. Base Metrics & Leveling
* **Starting Rating**: Newly registered accounts begin with a base rating of **1,000**.
* **Level Progression**: Levels increment every 500 rating points:
  $$\text{Level} = \max\left(1, \left\lfloor \frac{\text{Rating}}{500} \right\rfloor\right)$$
* **Non-Negative Bounding**: Rating is bounded below by 0: $\text{Rating} = \max(0, \text{Rating} + \Delta)$.

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

### 3. Contest Win Bonus Formula
In ranked code parties, the 1st place award scales dynamically with participant count:
$$\text{Points}_{\text{Rank 1}} = 100 + 10 \times \max(0, N_{\text{participants}} - 1)$$
This guarantees greater reward for winning larger, more competitive cohort sessions.

---

## 🛡️ Fair Play Extension — Rule Matrix

```
┌────────────────────────────────────────┬──────────────────┬──────────────────────────┐
│ Event Triggered                        │ Grace Period     │ System Action            │
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
* **Restricted Subpaths**:
  * LeetCode: `/solutions`, `/discuss`, `/explore`, `/companies`
  * Codeforces: `/blog`, `/tutorial`

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
# If placeholder or omitted, Django automatically outputs OTPs to the console in development
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
python manage.py runserver 127.0.0.1:8000
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
*Frontend runs locally at: `http://127.0.0.1:3000/`*

---

### 3. Chrome Extension Setup (`AlgoMind-Extension`)

* **Option A: Chrome Web Store**: Install directly from the official [Chrome Web Store](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib).
* **Option B: Local Developer Mode**:
  1. Open Chrome and go to `chrome://extensions/`.
  2. Enable the **Developer mode** toggle in the top-right corner.
  3. Click **Load unpacked**.
  4. Select the `AlgoMind-Extension` directory from this repository.

---

## ⚖️ License & Legal Notice

**Copyright (c) 2025–2026 Siddharth Garkoti. All rights reserved.**

### ⚠️ Proprietary Software Notice
This software, including its source code, architecture, browser extension, user interface designs, and documentation, is **PROPRIETARY and CONFIDENTIAL**.

* **NOT Open for Free Copying**: This repository is **NOT** open source and is **NOT** open for free copying, cloning, modification, reproduction, redistribution, sublicensing, or commercial exploitation.
* **Permission Required**: Prior explicit written authorization from **Siddharth Garkoti** is strictly required to reproduce, deploy, adapt, or utilize this project or any part of its source code in any commercial, institutional, or educational capacity.
* **Legal Enforcement**: Any unauthorized use, unauthorized reproduction, distribution, scraping, or intellectual property infringement will be prosecuted to the maximum extent permitted by applicable law, including DMCA takedown requests, immediate revocation of access, and legal proceedings for statutory damages and injunctive relief.

For licensing inquiries or institutional deployment permissions, please contact:
* Author: **[Siddharth Garkoti](https://github.com/SiddharthGarkoti)**
* Repository: **[https://github.com/SiddharthGarkoti/algomind](https://github.com/SiddharthGarkoti/algomind)**