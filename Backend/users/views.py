from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers as drf_serializers

from .models import User, Notification
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    PublicUserSerializer, NotificationSerializer,
)



# ── Email-based JWT login (fixes simplejwt USERNAME_FIELD='email' quirk) ──────
class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Override simplejwt to explicitly use email for authentication.
    By default simplejwt uses USERNAME_FIELD but may fall back to 'username'
    in some versions — this ensures email+password always works.
    """
    username_field = 'email'

    def validate(self, attrs):
        email    = attrs.get('email', '')
        password = attrs.get('password', '')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise drf_serializers.ValidationError(
                {'detail': 'No account found with this email address.'}
            )

        if not user.check_password(password):
            raise drf_serializers.ValidationError(
                {'detail': 'Incorrect password. Please try again.'}
            )

        if not user.is_active:
            raise drf_serializers.ValidationError(
                {'detail': 'This account has been disabled.'}
            )

        refresh = RefreshToken.for_user(user)
        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }


class EmailLoginView(TokenObtainPairView):
    """POST /auth/login/ — accepts { email, password }"""
    serializer_class = EmailTokenObtainPairSerializer



# ── OTP Email Verification ─────────────────────────────────────────────────────
import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings as django_settings


def _otp_cache_key(email):
    return f'algomind_reg_otp_{email.lower().strip()}'


def _send_otp_email(email, otp):
    """
    Sends OTP email using:
    1. Brevo REST API (HTTPS port 443) if BREVO_API_KEY is configured.
       (Works 100% on Render, sends to ANY recipient with 0 domain verification required).
    2. Resend REST API (HTTPS port 443) if RESEND_API_KEY is configured.
       (If Resend fails due to sandbox restriction, gracefully falls back to SMTP).
    3. Django standard SMTP (Gmail/TLS) with multipart HTML + plain-text.
    """
    import requests
    from django.core.mail import EmailMultiAlternatives

    html_content = (
        f"<div style='font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;border-radius:16px;color:#f8fafc;border:1px solid #1e293b;'>"
        f"<div style='margin-bottom:24px;'>"
        f"<span style='font-size:24px;'>🧠</span> "
        f"<span style='font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;'>Algo<span style='color:#6366f1;'>Mind</span></span>"
        f"</div>"
        f"<h2 style='font-size:20px;font-weight:700;color:#f8fafc;margin:0 0 12px 0;'>Verify Your Email Address</h2>"
        f"<p style='color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px 0;'>Use the one-time code below to verify your account. It expires in 10 minutes.</p>"
        f"<div style='background:#1e1b4b;border:1px solid #4338ca;padding:16px 24px;border-radius:12px;text-align:center;margin:0 0 24px 0;'>"
        f"<span style='font-family:monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#818cf8;'>{otp}</span>"
        f"</div>"
        f"<p style='color:#64748b;font-size:12px;line-height:1.5;margin:0;'>If you did not request this verification code, please ignore this email.</p>"
        f"</div>"
    )
    plain_text = (
        f"Your AlgoMind verification code is: {otp}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone.\n\n"
        f"If you did not request this, please ignore this email."
    )

    # 1. Brevo HTTPS API (Can send to ANY email address, free 300/day, no custom domain required)
    brevo_key = getattr(django_settings, 'BREVO_API_KEY', '').strip()
    if brevo_key:
        brevo_sender = getattr(django_settings, 'BREVO_SENDER_EMAIL', 'AlgoMind.Support@gmail.com')
        payload = {
            "sender": {"name": "AlgoMind", "email": brevo_sender},
            "to": [{"email": email}],
            "subject": f"AlgoMind — Verification Code: {otp}",
            "htmlContent": html_content,
            "textContent": plain_text
        }
        resp = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers={
                "api-key": brevo_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        if resp.status_code in (200, 201):
            return "brevo"
        raise Exception(f"Brevo API error ({resp.status_code}): {resp.text}")

    # 2. Resend HTTPS API (Falls back to SMTP if in sandbox mode and sending to external user)
    resend_key = getattr(django_settings, 'RESEND_API_KEY', '').strip()
    if resend_key:
        resend_from = getattr(django_settings, 'RESEND_FROM_EMAIL', 'AlgoMind <onboarding@resend.dev>')
        payload = {
            "from": resend_from,
            "to": [email],
            "subject": f"AlgoMind — Verification Code: {otp}",
            "html": html_content,
            "text": plain_text
        }
        try:
            resp = requests.post(
                "https://api.resend.com/emails",
                json=payload,
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            if resp.status_code in (200, 201):
                return "resend"
            print(f"[AlgoMind Email] Resend API failed ({resp.status_code}): {resp.text}. Falling back to SMTP...")
        except Exception as re_err:
            print(f"[AlgoMind Email] Resend request exception: {re_err}. Falling back to SMTP...")

    # 3. Standard Django SMTP with Multipart HTML
    from_email = getattr(django_settings, 'DEFAULT_FROM_EMAIL', None) or 'AlgoMind <AlgoMind.Support@gmail.com>'
    msg = EmailMultiAlternatives(
        subject=f'AlgoMind — Verification Code: {otp}',
        body=plain_text,
        from_email=from_email,
        to=[email],
        reply_to=['AlgoMind.Support@gmail.com'],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
    return "smtp"



class SendOTPView(APIView):
    """
    POST /auth/send-otp/
    Body: { "email": "user@example.com" }

    Generates a 6-digit OTP, stores it in cache for 10 minutes, and
    sends it to the given email. Rate-limited to 1 request per 60s per email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email or '@' not in email:
            return Response({'detail': 'A valid email address is required.'}, status=400)

        # Check if user already registered
        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=400)

        # Rate-limit: don't resend if a code was issued in the last 60 seconds
        rate_key = f'algomind_otp_rate_{email}'
        if cache.get(rate_key):
            return Response({'detail': 'Please wait 60 seconds before requesting another code.'}, status=429)

        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        cache.set(_otp_cache_key(email), otp, timeout=600)     # valid 10 minutes
        cache.set(rate_key, True, timeout=60)                   # rate-limit window

        # Send email (SMTP or Resend HTTPS REST API)
        delivery_error = None
        try:
            _send_otp_email(email, otp)
        except Exception as e:
            delivery_error = e
            if django_settings.DEBUG:
                print(f'\n=======================================================')
                print(f'[AlgoMind OTP DEV] Send error: {e}')
                print(f'[AlgoMind OTP DEV] OTP for {email}: {otp}')
                print(f'=======================================================\n')
            else:
                cache.delete(_otp_cache_key(email))
                cache.delete(rate_key)
                return Response({'detail': f'Failed to send email: {e}'}, status=500)

        resp = {'detail': 'Verification code sent. Check your inbox (and spam folder).'}
        is_dummy = getattr(django_settings, 'IS_DUMMY_EMAIL', False) or (
            'console' in getattr(django_settings, 'EMAIL_BACKEND', '').lower()
        )
        has_resend = bool(getattr(django_settings, 'RESEND_API_KEY', '').strip())
        if django_settings.DEBUG and ((is_dummy and not has_resend) or delivery_error):
            resp['dev_otp'] = otp
            resp['detail'] = f'Verification code generated! (Dev OTP: {otp})'

        return Response(resp)



class VerifyOTPView(APIView):
    """
    POST /auth/verify-otp/
    Body: { "email": "...", "otp": "123456" }
    Returns 200 if valid, 400 if invalid/expired.
    Does NOT consume the OTP — consumption happens at register time.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp   = (request.data.get('otp')   or '').strip()
        stored = cache.get(_otp_cache_key(email))
        if not stored:
            return Response({'detail': 'Verification code has expired or was not requested. Please click "Resend code".'}, status=400)
        if stored != otp:
            return Response({'detail': 'Incorrect verification code. Please check and try again.'}, status=400)
        return Response({'detail': 'Code verified.'})


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = (request.data.get('email') or '').strip().lower()
        otp   = (request.data.get('otp')   or '').strip()

        # Require OTP verification before account creation
        stored = cache.get(_otp_cache_key(email))
        if not stored:
            return Response(
                {'detail': 'Verification code has expired or was not requested. Please click "Resend code".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if stored != otp:
            return Response(
                {'detail': 'Incorrect verification code. Please check and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        cache.delete(_otp_cache_key(email))      # consume the OTP
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data['refresh']).blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user  = self.request.user
        now   = timezone.now()
        today = now.date()
        # Use .date() comparison so streak works with the new DateTimeField
        last_date = user.last_active.date() if user.last_active else None
        if last_date != today:
            yesterday   = today - timezone.timedelta(days=1)
            user.streak = (user.streak + 1) if last_date == yesterday else 1
        # Always write exact datetime so online-presence polling works
        user.last_active = now
        user.save(update_fields=['streak', 'last_active'])
        return user


class PublicProfileView(generics.RetrieveAPIView):
    queryset           = User.objects.all()
    serializer_class   = PublicUserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = 'username'


class LeaderboardView(APIView):
    """
    GET /api/auth/leaderboard/?limit=50
    Returns top users ranked by rating, with online status omitted (no WS yet).
    When the requesting user is authenticated, injects their own entry.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 50)), 200)
        top_users = User.objects.order_by('-rating')[:limit]

        result = []
        for rank, user in enumerate(top_users, start=1):
            result.append({
                'rank':     rank,
                'id':       user.id,
                'username': user.username,
                'avatar':   request.build_absolute_uri(user.avatar.url) if user.avatar else None,
                'rating':   user.rating,
                'level':    user.level,
                'streak':   user.streak,
                'is_self':  (request.user.is_authenticated and request.user.id == user.id),
            })

        # If the authenticated user is not in the top list, append their entry
        if request.user.is_authenticated:
            in_list = any(e['is_self'] for e in result)
            if not in_list:
                me   = request.user
                rank = User.objects.filter(rating__gt=me.rating).count() + 1
                result.append({
                    'rank':     rank,
                    'id':       me.id,
                    'username': me.username,
                    'avatar':   request.build_absolute_uri(me.avatar.url) if me.avatar else None,
                    'rating':   me.rating,
                    'level':    me.level,
                    'streak':   me.streak,
                    'is_self':  True,
                })

        return Response({'leaderboard': result, 'total': User.objects.count()})


class UserSearchView(APIView):
    """
    GET /api/auth/search/?q=<query>
    Search users by username (for adding friends).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'results': []})

        users = User.objects.filter(username__icontains=q).exclude(id=request.user.id)[:20]
        return Response({'results': PublicUserSerializer(users, many=True).data})


# ── Notification views ────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """
    GET /api/auth/notifications/?limit=30
    Returns the latest notifications for the authenticated user.
    Includes streak-at-risk system notification if streak > 0 and user
    hasn't solved today (last_active < today).
    """
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        limit = min(int(self.request.query_params.get('limit', 30)), 100)
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')[:limit]

    def list(self, request, *args, **kwargs):
        limit   = min(int(request.query_params.get('limit', 30)), 100)
        base_qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        unread  = base_qs.filter(read=False).count()   # count BEFORE slicing
        qs      = base_qs[:limit]
        data    = NotificationSerializer(qs, many=True).data

        # Inject a live "streak at risk" system notification if applicable
        user  = request.user
        today = timezone.now().date()
        streak_at_risk = (
            user.streak > 0 and
            user.last_active is not None and
            user.last_active.date() < today  # .date() because last_active is now DateTimeField
        )

        return Response({
            'notifications': data,
            'unread':        unread,
            'streak_at_risk': streak_at_risk,
        })


class MarkNotificationReadView(APIView):
    """POST /api/auth/notifications/<pk>/read/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user, read=False
        ).update(read=True)
        return Response({'marked': updated > 0})


class MarkAllNotificationsReadView(APIView):
    """POST /api/auth/notifications/read-all/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            recipient=request.user, read=False
        ).update(read=True)
        return Response({'marked': count})


class DeleteNotificationView(APIView):
    """DELETE /api/auth/notifications/<id>/delete/"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        from .models import Notification
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.delete()
            return Response({'detail': 'Deleted'}, status=200)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


class FriendOnlineStatusView(APIView):
    """
    GET /api/auth/friends/online/
    Returns which friends were active today (last_active == today).
    Also marks the current user as online (updates last_active).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from friends.models import Friendship
        now           = timezone.now()
        five_mins_ago = now - timezone.timedelta(minutes=5)

        # Get all friendships
        friendships = Friendship.objects.filter(
            models.Q(user1=request.user) | models.Q(user2=request.user)
        ).select_related('user1', 'user2')

        online_friends = []
        for fs in friendships:
            friend    = fs.user2 if fs.user1_id == request.user.id else fs.user1
            # "Online" = visited AlgoMind in the last 5 minutes
            is_online = (
                friend.last_active is not None and
                friend.last_active >= five_mins_ago
            )
            online_friends.append({
                'id':        friend.id,
                'username':  friend.username,
                'is_online': is_online,
                'avatar':    request.build_absolute_uri(friend.avatar.url) if friend.avatar else None,
            })

        return Response({'friends': online_friends})


class AIInsightNotificationView(APIView):
    """
    GET /api/auth/ai-insight/
    Returns a dynamic AI-generated insight message for the notification card
    based on real user data (streak, rating, weak areas, friends to beat).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from friends.models import Friendship
        from analytics.models import PlatformProfile
        from users.models import User
        user = request.user
        UserClass = type(user)

        rating = user.rating or 0
        streak = user.streak or 0
        insights = []

        # 1. Top 5 Global Rank Logic
        higher_rated_count = UserClass.objects.filter(rating__gt=rating).count()
        rank = higher_rated_count + 1

        if rank > 5:
            # We are not top 5. Find the gap to the 5th place user.
            top_5 = UserClass.objects.order_by('-rating')[:5]
            if len(top_5) == 5:
                fifth_rating = top_5[4].rating or 0
                gap = fifth_rating - rating
                if gap > 0:
                    insights.append(f"Gain *{gap} rating* to enter the *Top 5*!")
        else:
            insights.append(f"You are ranked *#{rank}* globally! Defend your spot.")

        # 2. Friend Rival Logic
        friendships = Friendship.objects.filter(
            models.Q(user1=request.user) | models.Q(user2=request.user)
        ).select_related('user1', 'user2')
        
        closest_rival = None
        smallest_gap = float('inf')
        
        for fs in friendships:
            friend = fs.user2 if fs.user1_id == user.id else fs.user1
            f_rating = friend.rating or 0
            if f_rating > rating:
                gap = f_rating - rating
                if gap < smallest_gap:
                    smallest_gap = gap
                    closest_rival = friend

        if closest_rival:
            insights.append(f"Gain *{smallest_gap} rating* to beat *{closest_rival.username}*!")

        # 3. Streak Milestone Logic
        milestones = [7, 30, 50, 100, 365]
        next_milestone = next((m for m in milestones if m > streak), None)
        if next_milestone:
            days_left = next_milestone - streak
            insights.append(f"Solve for *{days_left} more days* to hit your *{next_milestone}-day* milestone!")

        # 4. Weak Areas Logic
        for profile in PlatformProfile.objects.filter(user=user)[:1]:
            weak = profile.topic_stats.order_by('problems_solved').first()
            if weak:
                insights.append(f"Master *{weak.topic_name}* to push your *rating*.")

        # Ensure we have at least a few
        if len(insights) < 3:
            insights.append("Solve *1 more* problem to solidify your *knowledge* today!")
            
        return Response({'insights': insights[:4]})


class MentorAnalysisView(APIView):
    """
    GET /api/auth/mentor-analysis/
    Returns a real AI-generated coach card:
      - specialist: the topic the user is weakest in (used as card subtitle)
      - observation: what the AI noticed about their recent performance
      - insight: a deeper insight about their pattern
      - weakness: the specific gap/misconception
      - direction: one concrete action to take
    Falls back to data-driven hardcoded messages if AI is unavailable.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from analytics.models import TopicStats, PlatformStats, PlatformProfile
        from ai_engine.services import call_ai

        user = request.user

        # Gather all topic stats across all platforms
        all_topic_stats = []
        for profile in PlatformProfile.objects.filter(user=user).prefetch_related('topic_stats', 'stats'):
            for ts in profile.topic_stats.order_by('problems_solved'):
                all_topic_stats.append({
                    'topic': ts.topic_name,
                    'slug':  ts.topic_slug,
                    'solved': ts.problems_solved,
                    'platform': profile.platform_name,
                })

        # Sort: weakest first
        all_topic_stats.sort(key=lambda x: x['solved'])

        # Aggregate easy/medium/hard across platforms
        total_easy = total_medium = total_hard = 0
        for profile in PlatformProfile.objects.filter(user=user):
            try:
                s = profile.stats
                total_easy   += s.easy_solved
                total_medium += s.medium_solved
                total_hard   += s.hard_solved
            except Exception:
                pass

        total_solved = total_easy + total_medium + total_hard
        streak = user.streak
        rating = user.rating

        weak_topics  = [t for t in all_topic_stats if t['solved'] <= 5][:3]
        strong_topics = sorted(all_topic_stats, key=lambda x: -x['solved'])[:2]

        weak_str   = ', '.join(f"{t['topic']} ({t['solved']} solved)" for t in weak_topics) or 'none identified'
        strong_str = ', '.join(f"{t['topic']} ({t['solved']} solved)" for t in strong_topics) or 'none yet'
        specialist = weak_topics[0]['topic'] if weak_topics else (strong_topics[0]['topic'] if strong_topics else 'DSA')

        prompt = (
            f"You are an expert DSA coach reviewing a student's profile.\n"
            f"Student stats: {total_solved} total solved (Easy {total_easy}, Medium {total_medium}, Hard {total_hard}), "
            f"Rating {rating}, {streak}-day streak.\n"
            f"Weak areas (fewest problems solved): {weak_str}.\n"
            f"Strong areas: {strong_str}.\n\n"
            f"Write a short coaching card in JSON with exactly these keys:\n"
            f"  observation: one sentence (max 15 words) about what you noticed\n"
            f"  insight: one sentence (max 15 words) about a pattern you see\n"
            f"  weakness: one sentence (max 15 words) naming the specific gap\n"
            f"  direction: one concrete action (max 12 words)\n"
            f"  specialist: the single weakest topic name (1-3 words)\n"
            f"Be specific and dynamic. Use the actual topic names. Output only valid JSON, no extra text."
        )

        try:
            raw = call_ai('insight', prompt).strip()
            # Strip markdown code fences if present
            if raw.startswith('```'):
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            import json
            data = json.loads(raw.strip())
            # Validate required keys
            for key in ('observation', 'insight', 'weakness', 'direction', 'specialist'):
                if key not in data:
                    raise ValueError(f'Missing key: {key}')
        except Exception:
            # Fallback: data-driven hardcoded messages
            if weak_topics:
                w = weak_topics[0]['topic']
                data = {
                    'specialist': w,
                    'observation': f"You've solved very few {w} problems so far.",
                    'insight': 'Medium problems are your current bottleneck.' if total_medium > total_hard else 'Easy problems dominate your solve history.',
                    'weakness': f'{w} fundamentals need more practice.',
                    'direction': f'Solve 3 {w} problems this week.',
                }
            elif total_solved == 0:
                data = {
                    'specialist': 'Getting Started',
                    'observation': "No problems solved yet — let's change that.",
                    'insight': 'Consistent daily practice builds intuition fast.',
                    'weakness': 'No data yet to pinpoint weaknesses.',
                    'direction': 'Solve one Easy problem today to start.',
                }
            else:
                data = {
                    'specialist': strong_topics[0]['topic'] if strong_topics else 'DSA',
                    'observation': f"You've solved {total_solved} problems — good momentum!",
                    'insight': 'Focus on harder problems to level up your rating.',
                    'weakness': 'Hard problems are underrepresented in your history.',
                    'direction': 'Try one Hard problem to push your limits.',
                }

        return Response(data)

class AwardPlanCompletionView(APIView):
    """
    POST /auth/award-plan-completion/
    Gives user exactly 200 rating points once per topic completed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        topic_id = request.data.get('topic_id')
        request.user.award_plan_completion()
        return Response({'detail': 'Plan part completed, 200 rating awarded!', 'new_rating': request.user.rating})

class DeleteAccountView(APIView):
    """
    DELETE /auth/delete-account/
    Completely deletes the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        request.user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
