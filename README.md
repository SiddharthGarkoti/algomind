# AlgoMind 🧠⚡
### AI-Powered Adaptive Learning, Multi-Platform Analytics & Automated Anti-Cheat Proctoring Platform for Academic Institutions & Developers

[![Live Website](https://img.shields.io/badge/Live%20Platform-Render-00C7B7?style=for-the-badge&logo=render&logoColor=white)](https://algomind-frontend-dvfp.onrender.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Web%20Store-AlgoMind%20Fair%20Play%20v1.0.1-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SiddharthGarkoti%2Falgomind-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SiddharthGarkoti/algomind)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

---

## 🏛️ Executive Summary & Institutional Purpose

**AlgoMind** is an enterprise-ready, **Adaptive Learning & Anti-Cheat Proctoring Ecosystem** designed specifically for Universities, Computer Science Departments, Coding Academies, and Competitive Programmers. 

Traditional Data Structures and Algorithms (DSA) instruction faces three major bottlenecks:
1. **Unmonitored Lab Assessment**: Students copy code from LLMs, solution forums, or discussion boards during internal coding tests.
2. **Fragmented Learning Data**: Student progress is scattered across LeetCode, Codeforces, CodeChef, and HackerRank without unified institutional oversight.
3. **Passive AI Reliance**: Raw access to general LLMs leads to copy-pasting code instead of guided problem-solving and algorithmic thinking.

AlgoMind solves these challenges through a unified platform combining **AI-driven Socratic Mentorship**, **Multi-Platform Skill Analytics**, an **In-Browser Arena IDE with `stdin` execution**, and the **AlgoMind Fair Play Browser Extension (v1.0.1)** for real-time automated proctoring.

---

## 🏫 Key Institutional & Enterprise Capabilities

| For University Faculty & Instructors | For Students & Placement Aspirants |
| :--- | :--- |
| 🛡️ **Automated Lab Proctoring**: Host Ranked Code Parties with enforced extension monitoring to detect window blur, tab switching, and solution tab access. | 🤖 **Socratic AI Tutor**: Get step-by-step hints, debugging support, and complexity analysis without spoiling full code solutions. |
| 📊 **Unified Cohort Analytics**: Track student activity across LeetCode and Codeforces in a single dashboard with weak-topic matrices. | 🎯 **Dynamic Adaptive Plans**: Receive AI-curated daily study goals tailored to individual weak areas and interview deadlines. |
| 🏆 **Custom Contest Creation**: Shuffle questions by topic/difficulty from LeetCode & Codeforces or pick manual problem sets. | 💻 **Arena IDE with Custom `stdin`**: Execute C++, Python, Java, C, and JS code in-browser with live compilation logs & test input. |
| 👑 **Host Spectator Mode**: Instructors can monitor live progress, submission verification, and active strikes in real time without competing. | ⚡ **Gamified Peer Battles**: Head-to-head friend matches, ELO-style rating progression (`User.award_rating()`), and live leaderboards. |

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer"]
        ReactApp["React 18 + Vite Frontend\n(Render / Localhost)"]
        ChromeExt["AlgoMind Fair Play Extension v1.0.1\n(Manifest V3 Service Worker)"]
    end

    subgraph BackendLayer ["Django REST Framework Backend Layer"]
        AuthModule["User & Auth Engine\n(JWT, Email OTP, OAuth)"]
        DSAEngine["DSA Arena & Compiler Proxy\n(Wandbox / Judge0)"]
        ChallengeEngine["Code Party & Proctoring Hub\n(Heartbeat & Strike Tracker)"]
        AnalyticsEngine["Analytics & Platform Sync\n(LeetCode / Codeforces Scraper)"]
        AIEngine["AI Multi-Provider Gateway\n(Gemini 2.0 Flash / Groq / OpenAI)"]
    end

    subgraph ExternalServices ["External Ecosystem & Databases"]
        PostgreSQL[("PostgreSQL / SQLite\nDatabase")]
        LeetCode["LeetCode API / Web"]
        Codeforces["Codeforces API"]
        LLMProviders["AI Models:\n- Gemini 2.0 Flash\n- Llama 3.1 8B (Groq)\n- GPT-4o Mini"]
        WandboxAPI["Compiler Gateway"]
    end

    ReactApp <-->|REST API / JWT| BackendLayer
    ChromeExt <-->|Pulse & Violation Events| ReactApp
    ChromeExt -->|Platform Monitoring| LeetCode
    ChromeExt -->|Platform Monitoring| Codeforces

    DSAEngine -->|Execute Code with Stdin| WandboxAPI
    AnalyticsEngine -->|Fetch Stats & Tags| LeetCode
    AnalyticsEngine -->|Fetch Rating & Solves| Codeforces
    AIEngine -->|Failover Pipeline| LLMProviders
    BackendLayer <--> PostgreSQL
```

---

## 🛡️ AlgoMind Fair Play Extension (v1.0.1) — Anti-Cheat Architecture

The **AlgoMind Fair Play** Chrome extension ([Chrome Web Store](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib)) is a Manifest V3 background service worker enforcing academic integrity during ranked assessments and contest parties.

### 🔍 Monitoring & Enforcement Rules

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         VIOLATION DETECTION MATRIX                       │
├────────────────────────────┬──────────────────┬──────────────────────────┤
│ Event Triggered            │ Grace Period     │ System Action            │
├────────────────────────────┼──────────────────┼──────────────────────────┤
│ Focus loss / Window Blur   │ 0 ms             │ Record Strike + Notify   │
│ Continuous blur (>7 sec)   │ 7,000 ms         │ Continuous Strike        │
│ Switch to unapproved tab   │ 2,500 ms         │ Record Strike + Notify   │
│ Access Restricted Subpath  │ 0 ms             │ Record Strike + Notify   │
│ Reaching Max Strikes       │ Immediate        │ Auto-Forfeit Challenge   │
│ Service Worker Inactivation│ 12,000 ms        │ Frontend Heartbeat Forfeit│
└────────────────────────────┴──────────────────┴──────────────────────────┘
```

### 🌐 Domain & Path Whitelisting Rules

* **Allowed Domains**: `leetcode.com`, `codeforces.com`, `atcoder.jp`, `localhost`, `onrender.com`
* **Restricted Subpaths (Immediate Strike)**:
  * LeetCode: `/solutions`, `/discuss`, `/explore`, `/companies`
  * Codeforces: `/blog`, `/tutorial`
* **Heartbeat Pulse Sync**: The extension fires a 4-second pulse heartbeat. If an examinee disables or removes the extension mid-test, the React client (`useExtensionPulse`) catches the missed pulse and immediately registers an automatic forfeit on the backend (`/api/challenges/party/<code>/strike/`).

---

## ✨ Core Features Detailed

### 1. 🔑 Authentication & Security System
* **Email Verification**: Multi-step SMTP OTP registration prevents fake accounts and enforces institutional email domains.
* **Token Authentication**: Secure JWT flow with access and refresh tokens.
* **Social OAuth2**: Single-click sign-in via GitHub and Google OAuth providers.
* **Account Control**: Self-service profile updates, password resets, and complete account deletion endpoints.

### 2. 🤖 AI Mentorship & Personalised Study Pathways
* **Tri-Provider Failover Gateway**: Automatic fallback chain ensures 99.9% uptime:
  1. **Primary**: Google Gemini 2.0 Flash (`google-genai` SDK)
  2. **Secondary**: Groq (`llama-3.1-8b-instant`)
  3. **Tertiary**: OpenAI (`gpt-4o-mini`)
* **Socratic Modes**:
  * `/api/ai/hint/`: Step-by-step guidance without revealing code.
  * `/api/ai/explain/`: Conceptual breakdown of algorithm time/space complexity.
  * `/api/ai/debug/`: Identifies logical flaws, edge cases, and off-by-one errors.
* **AI Adaptive Plan Generator**: Scans student weak areas across connected platforms, combines rating & solved metrics, and builds tailored study intensity paths (*Light*, *Balanced*, *Intense*).

### 3. 💻 In-Browser Arena IDE
* **Execution Sandbox**: High-speed execution powered by backend proxy to avoid client CORS timeouts.
* **Custom `stdin` Support**: Test solution edge cases by injecting custom inputs into C++, Python, Java, C, and JS code.
* **Real-time Diagnostics**: Detailed execution output, runtime errors (`stderr`), compilation errors, memory usage, and execution time profiling.

### 4. ⚔️ Code Parties & Competitive Contests
* **Room Management**: Create public or private rooms with unique 6-character party codes.
* **Question Curation**: Choose questions manually or use **AI Shuffle** filtered by topic and difficulty level.
* **Ranked Mode**: Enforces the AlgoMind Fair Play Extension, configurable strike limits (1–5), and host spectator mode.
* **Automated Verification**: Syncs with platform profiles to verify solved status upon question completion.

### 5. 📊 Analytics & Multi-Platform Profile Sync
* **Platform Connectors**: Deep integration with LeetCode, Codeforces, CodeChef, and HackerRank.
* **Skill Radar & Weak Area Detection**: Categorizes solved problems into core DSA topics (Dynamic Programming, Graphs, Trees, Binary Search, etc.) to expose skill gaps.
* **Rating & XP Progression**: Earn rating points for solving problems, completing study plans, and winning ranked contests.

### 6. 🤝 Social Learning & Gamification
* **Friend Network**: Send, accept, or reject peer requests; track real-time 5-minute online status.
* **Direct Messaging**: In-app chat rooms for peer discussion and code sharing.
* **Community Forum**: Publish posts, discuss interview experiences, and like community solutions.
* **Leaderboards**: Filterable global, institutional, and friends-only leaderboards.

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/send-otp/` | `POST` | Dispatches email OTP verification code |
| `/verify-otp/` | `POST` | Validates OTP code before registration |
| `/register/` | `POST` | Registers new user account |
| `/login/` | `POST` | Authenticates user and returns JWT pair |
| `/token/refresh/` | `POST` | Issues new JWT access token |
| `/profile/` | `GET/PUT` | Retrieves or updates current user profile |
| `/oauth/google/` | `GET/POST` | Google OAuth authentication handler |
| `/oauth/github/` | `GET/POST` | GitHub OAuth authentication handler |

### 💻 DSA Arena & Code Execution (`/api/dsa/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/problems/` | `GET` | Paginated list of DSA problems with difficulty/tag filters |
| `/problems/<id>/` | `GET` | Detailed problem statement, constraints, and examples |
| `/execute-code/` | `POST` | Proxies code execution with custom `stdin` to backend compiler |
| `/submit/` | `POST` | Submits problem code and updates user XP rating |
| `/submissions/` | `GET` | User submission history and status logs |

### 🤖 AI Engine (`/api/ai/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/hint/` | `POST` | Generates guided Socratic hints for a specific problem |
| `/explain/` | `POST` | Explains algorithmic approach and asymptotic complexity |
| `/debug/` | `POST` | Analyzes code snippet for syntax/logical errors |
| `/generate-plan/` | `POST` | Synthesizes personalized study plan based on weak areas |

### 🏆 Code Parties & Proctoring (`/api/challenges/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/party/create/` | `POST` | Initializes custom Code Party (Ranked / Casual) |
| `/party/<code/join/` | `POST` | Joins active party via invitation code |
| `/party/<code/start/` | `POST` | Host triggers contest timer and locks room |
| `/party/<code/pulse/` | `POST` | Extension heartbeat pulse validation |
| `/party/<code/strike/` | `POST` | Registers fair play violation strike |
| `/party/<code/questions/check/` | `POST` | Verifies question completion on external platform |

### 📊 Analytics & Sync (`/api/analytics/`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/connect/` | `POST` | Connects LeetCode / Codeforces handle to user profile |
| `/dashboard/` | `GET` | Returns aggregated problem counts, rating, and topic breakdown |
| `/weak-areas/` | `GET` | Returns bottom 5 DSA topics needing improvement |
| `/refresh/<platform>/` | `POST` | Triggers real-time platform scrape and re-indexing |

---

## 🛠️ Installation & Setup Guide

### 📋 Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: v18.0.0 or higher
* **Package Managers**: `pip` and `npm`
* **Google Chrome**: For running the extension in Developer Mode

---

### 🐍 1. Backend Setup (Django REST Framework)

```bash
# Clone the repository
git clone https://github.com/SiddharthGarkoti/algomind.git
cd algomind/Backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env configuration file
cp .env.example .env
```

#### Configure `Backend/.env`:
```env
DEBUG=True
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com

# Database (PostgreSQL or SQLite fallback)
DATABASE_URL=postgres://user:password@host:5432/dbname

# AI Provider Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Email Verification (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True

# Compiler Gateway Settings
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_AUTH_TOKEN=your_judge0_token
```

#### Apply Migrations & Run Server:
```bash
python manage.py migrate
python manage.py runserver
```
The Django backend will start at `http://127.0.0.1:8000/`.

---

### ⚛️ 2. Frontend Setup (React 18 + Vite)

```bash
cd ../frontend

# Install node dependencies
npm install

# Create frontend environment file
```

#### Configure `frontend/.env`:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

#### Start Development Server:
```bash
npm run dev
```
The React application will run at `http://localhost:5173/`.

---

### 🧩 3. Chrome Extension Installation ("AlgoMind Fair Play")

#### Option A: Direct Web Store Download (Recommended)
Install directly from the official **[Chrome Web Store](https://chromewebstore.google.com/detail/lfpemlimminiefikoofinbldcjoalbib)**.

#### Option B: Developer Mode (Local Source)
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `AlgoMind-Extension` directory from this repository.
5. The extension logo 🛡️ will appear in your Chrome toolbar.

---

## 🎓 University Lab Deployment Framework

Colleges and institutions can easily adopt AlgoMind for weekly programming labs:

1. **Faculty Account Registration**: Instructors create an admin/host account.
2. **Lab Session Creation**: Instructor creates a *Ranked Code Party*, sets the duration (e.g. 90 mins), configures *Max Strikes = 2*, and enables *Host Spectator Mode*.
3. **Student Onboarding**: Students join via the 6-character room code with the AlgoMind extension installed.
4. **Automated Proctoring**: The system monitors focus loss, solution forum lookup, and tab switches while recording strikes automatically.
5. **Instant Analytics Export**: Instructors view verified submission times, participant ranks, and integrity logs.

---

## 📜 License & Citation

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with ❤️ by **[Siddharth Garkoti](https://github.com/SiddharthGarkoti)**.

*If you use AlgoMind for academic research, university coursework, or institutional deployment, please cite or link back to this repository!*