from pathlib import Path
from datetime import timedelta
import environ
import os

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    # local
    'users',
    'dsa',
    'ai_engine',
    'analytics',
    'friends',
    'community',
    'chat',
    'challenges',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default=f'sqlite:///{BASE_DIR}/db.sqlite3')
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

# ── DRF ──────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# ── JWT ───────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── Frontend URL (used by OAuth redirect) ────────────────────────────
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')

# ── CORS ──────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
])
if FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# ── OAuth credentials ─────────────────────────────────────────────────
GITHUB_CLIENT_ID     = env('GITHUB_CLIENT_ID',     default='')
GITHUB_CLIENT_SECRET = env('GITHUB_CLIENT_SECRET', default='')
GOOGLE_CLIENT_ID     = env('GOOGLE_CLIENT_ID',     default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')

# ── AI keys ───────────────────────────────────────────────────────────
# Priority: Gemini (free) → Groq (free) → OpenAI (paid)
GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
GROQ_API_KEY   = env('GROQ_API_KEY',   default='')
OPENAI_API_KEY = env('OPENAI_API_KEY', default='')

# Code execution proxy
JUDGE0_BASE_URL        = env('JUDGE0_BASE_URL', default='https://ce.judge0.com')
JUDGE0_AUTH_TOKEN      = env('JUDGE0_AUTH_TOKEN', default='')
JUDGE0_CPP_LANGUAGE_ID = env.int('JUDGE0_CPP_LANGUAGE_ID', default=54)
JUDGE0_REQUEST_TIMEOUT = env.float('JUDGE0_REQUEST_TIMEOUT', default=15)
JUDGE0_POLL_ATTEMPTS   = env.int('JUDGE0_POLL_ATTEMPTS', default=12)
JUDGE0_POLL_INTERVAL   = env.float('JUDGE0_POLL_INTERVAL', default=0.75)

# ── Email Settings (For OTP) ──────────────────────────────────────────
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

IS_DUMMY_EMAIL = bool(
    not EMAIL_HOST_USER
    or 'your_email' in EMAIL_HOST_USER.lower()
    or not EMAIL_HOST_PASSWORD
    or 'your_16_digit' in EMAIL_HOST_PASSWORD.lower()
    or 'app_password' in EMAIL_HOST_PASSWORD.lower()
)

if IS_DUMMY_EMAIL:
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
else:
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')

DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=f'AlgoMind <{EMAIL_HOST_USER}>' if not IS_DUMMY_EMAIL else 'AlgoMind <noreply@algomind.io>')

# ── Cloud Email Service Fallback (Resend HTTPS API) ───────────────────
# If Render or cloud hosting blocks outbound SMTP (port 587/465),
# RESEND_API_KEY sends OTPs via HTTPS (port 443) which is never blocked.
RESEND_API_KEY = env('RESEND_API_KEY', default='')
RESEND_FROM_EMAIL = env('RESEND_FROM_EMAIL', default='AlgoMind <onboarding@resend.dev>')

# ── Cloud Email Service (Brevo / Sendinblue HTTPS API) ────────────────
# Brevo offers 300 free emails/day and can send to ANY external user immediately
# without requiring custom domain DNS verification.
BREVO_API_KEY = env('BREVO_API_KEY', default='')
BREVO_SENDER_EMAIL = env('BREVO_SENDER_EMAIL', default='AlgoMind.Support@gmail.com')

