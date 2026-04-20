# AlgoMind: Adaptive + Competitive Learning System

🌐 **Live Website**: [https://algomind-frontend-dvfp.onrender.com/](https://algomind-frontend-dvfp.onrender.com/)

AlgoMind is a next-generation, **Adaptive + Competitive Learning System** designed to revolutionize how you master Data Structures and Algorithms (DSA). By bridging the gap between personalized mentorship and gamified competition, AlgoMind actively tracks your coding progress, curates adaptive challenges tailored to your skill level, and fuels your motivation through head-to-head friend streaks and live leaderboards—all integrated seamlessly into your existing coding workflow.

### 🧠 Core Components
- **Backend (`/Backend`)**: A high-performance Django REST API powering our intelligent engines. Features include JWT/OAuth (GitHub & Google) authentication, Email OTP security, integrated AI providers (Gemini, Groq, OpenAI) for real-time problem-solving analysis, and robust persistent models for rich analytics.
- **Frontend (`/frontend`)**: A visually stunning, highly-responsive React + Vite application. Crafted with Tailwind to deliver dynamic UI elements and a premium competitive user experience.
- **Chrome Extension (`/AlgoMind-Extension`)**: Your silent coding partner. A seamless browser integration mapping to tracking scripts that effortlessly logs your coding submissions and metrics in real-time.

## 🚀 Getting Started

### Backend Setup
1. Navigate to the `Backend/` directory.
2. Create and activate a Python virtual environment.
3. Install dependencies.
4. Run migrations: `python manage.py migrate`.
5. Start the server: `python manage.py runserver`.

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

### Chrome Extension Setup
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right.
3. Click "Load unpacked" and select the `AlgoMind-Extension/` directory from this repository.

## 🗂️ Project Repository Map
There are a few dedicated core directories maintaining code separations concisely:
- `Backend/` - Core Django APIs and views.
- `frontend/` - Standard React UI client.
- `AlgoMind-Extension/` - The dedicated root for the browser extension's logic (`background.js`, `manifest.json`, etc.).
- `.archive/` - Hidden backup files and directories representing previous migrations/duplicate configs.