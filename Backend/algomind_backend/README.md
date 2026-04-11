# AlgoMind Backend

AI-powered DSA learning platform — Django + DRF + JWT.

## Setup

```bash
# 1. Install dependencies
uv add djangorestframework djangorestframework-simplejwt django-cors-headers django-environ django-filter Pillow openai

# 2. Copy env file
cp .env.example .env
# Edit .env and set SECRET_KEY and OPENAI_API_KEY

# 3. Run migrations
python manage.py makemigrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Start server
python manage.py runserver
```

---

## API Reference

All protected routes require:  `Authorization: Bearer <access_token>`

### Auth  `/api/auth/`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `register/` | No | Register new user |
| POST | `login/` | No | Login → returns access + refresh tokens |
| POST | `token/refresh/` | No | Refresh access token |
| POST | `logout/` | Yes | Logout (blacklist refresh token) |
| GET/PATCH | `profile/` | Yes | View or update own profile |
| GET | `profile/<username>/` | No | View public profile |

### DSA  `/api/dsa/`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `tags/` | Yes | List all tags |
| GET | `problems/` | Yes | List problems (filter: `?difficulty=easy&tag=dp&search=two+sum`) |
| GET | `problems/<id>/` | Yes | Problem detail |
| POST | `submit/` | Yes | Submit solution |
| GET | `submissions/` | Yes | My submissions |
| GET | `submissions/problem/<id>/` | Yes | My submissions for a problem |

### AI Engine  `/api/ai/`
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `hint/` | Yes | `{problem_id?, message}` | Get a hint |
| POST | `explain/` | Yes | `{problem_id?, message}` | Get explanation |
| POST | `debug/` | Yes | `{problem_id?, message}` | Debug code |

Response format: `{ "response": "..." }`

### Analytics  `/api/analytics/`
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `connect/` | Yes | `{platform_name, handle}` | Connect a platform |
| GET | `dashboard/` | Yes | — | Unified stats dashboard |

Platforms: `leetcode`, `codeforces`, `codechef`, `hackerrank`

### Friends  `/api/friends/`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `send/` | Yes | Send friend request `{receiver_id}` |
| GET | `requests/` | Yes | View pending incoming requests |
| POST | `requests/<id>/accept/` | Yes | Accept a request |
| POST | `requests/<id>/reject/` | Yes | Reject a request |
| GET | `list/` | Yes | List all friends |
| DELETE | `remove/<user_id>/` | Yes | Remove a friend |

---

## Project Structure

```
algomind_backend/
├── core/               # settings, urls, wsgi
├── users/              # custom User model, auth APIs
├── dsa/                # Problems, Tags, Submissions
├── ai_engine/          # Hint / Explain / Debug via OpenAI
├── analytics/          # Multi-platform stats aggregation
├── friends/            # Friend requests & friendships
├── manage.py
├── requirements.txt
└── .env.example
```
