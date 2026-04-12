"""
OAuth views — Authorization Code flow for GitHub and Google.

Endpoints:
  GET /api/auth/oauth/github/             – redirect to GitHub authorize
  GET /api/auth/oauth/github/callback/    – exchange code → JWT → frontend
  GET /api/auth/oauth/google/             – redirect to Google authorize
  GET /api/auth/oauth/google/callback/    – exchange code → JWT → frontend
"""
import secrets
import requests
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponseRedirect
from django.views import View

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

# ── Google OAuth constants ────────────────────────────────────────────────────
GOOGLE_AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USER_API  = 'https://www.googleapis.com/oauth2/v3/userinfo'

# ── GitHub OAuth constants ────────────────────────────────────────────────────
GITHUB_AUTH_URL  = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_USER_API  = 'https://api.github.com/user'
GITHUB_EMAIL_API = 'https://api.github.com/user/emails'


# ── shared helpers ───────────────────────────────────────────────────────────

def _jwt_redirect(user, is_new: bool) -> HttpResponseRedirect:
    """Mint JWT tokens for *user* and redirect to the frontend callback page."""
    refresh = RefreshToken.for_user(user)
    params  = urlencode({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'is_new':  'true' if is_new else 'false',
    })
    return HttpResponseRedirect(f'{FRONTEND_URL}/oauth-callback?{params}')


def _error_redirect(msg: str) -> HttpResponseRedirect:
    params = urlencode({'error': msg})
    return HttpResponseRedirect(f'{FRONTEND_URL}/?{params}')


def _get_or_create_oauth_user(provider: str, oauth_id: str, email: str, name: str, avatar_url: str):
    """
    Look up an existing user by (provider, oauth_id).
    If not found, try to find by email (link the account).
    Otherwise create a fresh account.
    Returns (user, is_new).
    """
    # 1️⃣ Exact OAuth match
    try:
        user = User.objects.get(oauth_provider=provider, oauth_id=str(oauth_id))
        return user, False
    except User.DoesNotExist:
        pass

    # 2️⃣ Email match — link existing email account to this OAuth provider
    if email:
        try:
            user = User.objects.get(email=email)
            user.oauth_provider = provider
            user.oauth_id       = str(oauth_id)
            user.save(update_fields=['oauth_provider', 'oauth_id'])
            return user, False
        except User.DoesNotExist:
            pass

    # 3️⃣ Create new account
    base_username = (name or (email.split('@')[0] if email else '') or 'user') \
                    .replace(' ', '_').lower()[:20]
    username = base_username
    counter  = 1
    while User.objects.filter(username=username).exists():
        username = f'{base_username}{counter}'
        counter  += 1

    user = User.objects.create_user(
        username=username,
        email=email or f'{oauth_id}@{provider}.oauth',
        password=secrets.token_hex(32),   # random unusable password
        oauth_provider=provider,
        oauth_id=str(oauth_id),
    )
    return user, True


# ── Google ───────────────────────────────────────────────────────────────────

class GoogleBeginView(View):
    """Redirect the browser to Google's OAuth consent screen."""

    def get(self, request):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return _error_redirect('Google OAuth is not configured.')

        callback_uri = f'{request.scheme}://{request.get_host()}/api/auth/oauth/google/callback/'
        params = urlencode({
            'client_id':             client_id,
            'redirect_uri':          callback_uri,
            'response_type':         'code',
            'scope':                 'openid email profile',
            'access_type':           'online',
            'prompt':                'select_account',
        })
        return HttpResponseRedirect(f'{GOOGLE_AUTH_URL}?{params}')


class GoogleCallbackView(View):
    """Exchange the authorization code for tokens, get user info, mint our JWT."""

    def get(self, request):
        code  = request.GET.get('code')
        error = request.GET.get('error')

        if error or not code:
            return _error_redirect(error or 'Google denied access.')

        client_id     = getattr(settings, 'GOOGLE_CLIENT_ID',     '')
        client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        callback_uri  = f'{request.scheme}://{request.get_host()}/api/auth/oauth/google/callback/'

        # 1️⃣ Exchange code for Google tokens
        token_resp = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                'code':          code,
                'client_id':     client_id,
                'client_secret': client_secret,
                'redirect_uri':  callback_uri,
                'grant_type':    'authorization_code',
            },
            timeout=10,
        )
        token_data   = token_resp.json()
        google_token = token_data.get('access_token')

        if not google_token:
            return _error_redirect('Failed to get Google access token.')

        # 2️⃣ Fetch Google user info via userinfo endpoint
        user_resp   = requests.get(
            GOOGLE_USER_API,
            headers={'Authorization': f'Bearer {google_token}'},
            timeout=10,
        )
        google_user = user_resp.json()

        oauth_id   = google_user.get('sub')            # Google's stable user ID
        email      = google_user.get('email', '')
        name       = google_user.get('name', '')
        avatar_url = google_user.get('picture', '')

        if not oauth_id:
            return _error_redirect('Could not retrieve Google profile.')

        # 3️⃣ Get or create Django user
        user, is_new = _get_or_create_oauth_user(
            provider   = 'google',
            oauth_id   = oauth_id,
            email      = email,
            name       = name,
            avatar_url = avatar_url,
        )

        # 4️⃣ Redirect to frontend with JWT tokens
        return _jwt_redirect(user, is_new)


# ── GitHub ───────────────────────────────────────────────────────────────────

class GitHubBeginView(View):
    """Redirect the browser to GitHub's OAuth authorize page."""

    def get(self, request):
        client_id = getattr(settings, 'GITHUB_CLIENT_ID', '')
        if not client_id:
            return _error_redirect('GitHub OAuth is not configured.')

        callback_uri = f'{request.scheme}://{request.get_host()}/api/auth/oauth/github/callback/'
        params = urlencode({
            'client_id':    client_id,
            'scope':        'read:user user:email',
            'redirect_uri': callback_uri,
        })
        return HttpResponseRedirect(f'{GITHUB_AUTH_URL}?{params}')


class GitHubCallbackView(View):
    """Exchange the code for tokens, get user info, mint our JWT."""

    def get(self, request):
        code  = request.GET.get('code')
        error = request.GET.get('error')

        if error or not code:
            return _error_redirect(error or 'GitHub denied access.')

        client_id     = getattr(settings, 'GITHUB_CLIENT_ID',     '')
        client_secret = getattr(settings, 'GITHUB_CLIENT_SECRET', '')
        callback_uri  = f'{request.scheme}://{request.get_host()}/api/auth/oauth/github/callback/'

        # 1️⃣ Exchange code for access token
        token_resp = requests.post(
            GITHUB_TOKEN_URL,
            headers={'Accept': 'application/json'},
            data={
                'client_id':     client_id,
                'client_secret': client_secret,
                'code':          code,
                'redirect_uri':  callback_uri,
            },
            timeout=10,
        )
        token_data = token_resp.json()
        gh_token   = token_data.get('access_token')

        if not gh_token:
            return _error_redirect('Failed to get GitHub access token.')

        # 2️⃣ Fetch GitHub user profile
        headers    = {'Authorization': f'token {gh_token}', 'Accept': 'application/json'}
        github_user = requests.get(GITHUB_USER_API, headers=headers, timeout=10).json()

        oauth_id = github_user.get('id')
        name     = github_user.get('name') or github_user.get('login') or ''
        email    = github_user.get('email')

        # GitHub sometimes withholds the primary email — fetch it separately
        if not email:
            emails_resp = requests.get(GITHUB_EMAIL_API, headers=headers, timeout=10)
            emails = emails_resp.json() if emails_resp.ok else []
            email  = next(
                (e['email'] for e in emails if e.get('primary') and e.get('verified')),
                emails[0]['email'] if emails else None,
            )

        if not oauth_id:
            return _error_redirect('Could not retrieve GitHub profile.')

        # 3️⃣ Get or create Django user
        user, is_new = _get_or_create_oauth_user(
            provider   = 'github',
            oauth_id   = oauth_id,
            email      = email or '',
            name       = name,
            avatar_url = github_user.get('avatar_url', ''),
        )

        # 4️⃣ Redirect to frontend with JWT tokens
        return _jwt_redirect(user, is_new)
