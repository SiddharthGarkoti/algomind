from django.contrib.auth.models import AbstractUser
from django.db import models


OAUTH_PROVIDERS = [
    ('email',  'Email'),
    ('github', 'GitHub'),
    ('google', 'Google'),
]


class User(AbstractUser):
    email         = models.EmailField(unique=True)
    streak        = models.PositiveIntegerField(default=0)
    last_active   = models.DateTimeField(null=True, blank=True)  # Upgraded from DateField — enables 5-min online presence
    level         = models.PositiveIntegerField(default=1)
    rating        = models.PositiveIntegerField(default=1000)
    bio           = models.TextField(blank=True)
    avatar        = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_admin      = models.BooleanField(default=False)  # Community admin / poster
    # OAuth fields
    oauth_provider = models.CharField(max_length=20, choices=OAUTH_PROVIDERS, default='email')
    oauth_id       = models.CharField(max_length=200, blank=True)  # provider's user id
    
    # Billing / Tier
    plan_tier      = models.CharField(max_length=10, default='basic')  # basic, plus, pro
    hide_connected_platforms = models.BooleanField(default=False)  # Privacy: hide LeetCode/CF from public profile

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def award_rating(self, points: int):
        self.rating = max(0, self.rating + points)
        # level up every 500 rating points above the 1000 base
        self.level = max(1, self.rating // 500)
        if self.pk:
            self.save(update_fields=['rating', 'level'])

    # ── Dynamic rating helpers ────────────────────────────────────
    # Elo system rules:
    # 3 points for easy question, 4 for medium, 5 for hard
    # Extra 2 points on each if done from platform (5 for easy, 6 for medium, 7 for hard)
    # 15 points for completion of one plan part
    # No other system of increment!
    DIFFICULTY_POINTS = {'easy': 3, 'medium': 4, 'hard': 5}
    PLATFORM_DIFFICULTY_POINTS = {'easy': 5, 'medium': 6, 'hard': 7}

    def award_question_rating(self, difficulty: str, from_platform: bool = False) -> int:
        """Call when a user solves a question in-app or verifies from external platform."""
        diff = (difficulty or 'easy').lower()
        if from_platform:
            pts = self.PLATFORM_DIFFICULTY_POINTS.get(diff, 5)
        else:
            pts = self.DIFFICULTY_POINTS.get(diff, 3)
        self.award_rating(pts)
        return pts

    def award_plan_completion(self):
        """15 points for completion of one plan part."""
        self.award_rating(15)

    def award_contest_win(self, rank: int, total_participants: int):
        """No other system of increment per system rules."""
        pass

    def recalculate_rating(self) -> int:
        """
        Recalculates the user's authentic Elo rating according to defined rules:
        - Baseline: 1000
        - Platform solves: 5 for Easy (3+2), 6 for Medium (4+2), 7 for Hard (5+2)
        - In-app verified solves (not from platform): 3 for Easy, 4 for Medium, 5 for Hard
        - Plan parts completed: 15 points each
        No other system of increment.
        """
        base_elo = 1000

        # 1. Connected platforms solved problems
        platform_points = 0
        try:
            for profile in self.platform_profiles.select_related('stats').all():
                st = getattr(profile, 'stats', None)
                if st:
                    easy = int(st.easy_solved or 0)
                    hard = int(st.hard_solved or 0)
                    total = int(st.problems_solved or 0)
                    med = int(st.medium_solved) if (st.medium_solved is not None and st.medium_solved > 0) else max(0, total - easy - hard)
                    platform_points += (easy * 5) + (med * 6) + (hard * 7)
        except Exception:
            pass

        # 2. Completed plan parts (15 points each)
        plan_points = 0
        try:
            from analytics.models import CompletedPlan
            plan_points = CompletedPlan.objects.filter(user=self).count() * 15
        except Exception:
            pass

        # 3. In-app verified problems (not from platform)
        in_app_points = 0
        try:
            from analytics.models import VerifiedProblem
            for vp in VerifiedProblem.objects.filter(user=self, is_plan=False):
                d = (vp.difficulty or 'easy').lower()
                in_app_points += 5 if d == 'hard' else (4 if d == 'medium' else 3)
        except Exception:
            pass

        new_rating = base_elo + platform_points + plan_points + in_app_points
        self.rating = new_rating
        self.level = max(1, new_rating // 500)
        if self.pk:
            self.save(update_fields=['rating', 'level'])
        return new_rating


NOTIF_TYPES = [
    ('friend_request',  'Friend Request'),
    ('friend_accepted', 'Friend Accepted'),
    ('system',          'System'),
    ('achievement',     'Achievement'),
    ('message',         'Direct Message'),
    ('party_invite',    'Party Invite'),
]


class Notification(models.Model):
    """
    In-app notification for a user.
    Created automatically by signals (friend requests) or manually by admins.
    """
    recipient   = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, related_name='notifications'
    )
    notif_type  = models.CharField(max_length=20, choices=NOTIF_TYPES, default='system')
    title       = models.CharField(max_length=150)          # e.g. sender username
    body        = models.TextField()                        # message text
    # Optional foreign key to the related object (e.g. FriendRequest id)
    related_id  = models.PositiveIntegerField(null=True, blank=True)
    avatar_text = models.CharField(max_length=10, blank=True)  # initials or emoji
    color       = models.CharField(max_length=10, default='#6366F1')  # hex accent
    read        = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notif_type}] → {self.recipient.username}: {self.title}'
