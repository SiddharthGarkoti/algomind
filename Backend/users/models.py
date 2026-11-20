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
    # 3 points for easy question, 4 for medium, 5 for hard (no extra bonus)
    # LeetCode contest rating impact: +100 Elo for every +200 rating after 1500 (at 1700 -> +100, at 1900 -> +200, etc.)
    # 15 points for completion of one plan part
    DIFFICULTY_POINTS = {'easy': 3, 'medium': 4, 'hard': 5}

    def award_question_rating(self, difficulty: str, from_platform: bool = False) -> int:
        """Call when a user solves a question in-app or verifies from external platform."""
        diff = (difficulty or 'easy').lower()
        pts = self.DIFFICULTY_POINTS.get(diff, 3)
        self.award_rating(pts)
        return pts

    def award_plan_completion(self):
        """15 points for completion of one plan part."""
        self.award_rating(15)

    def award_contest_win(self, rank: int, total_participants: int):
        """On-app contest rating award placeholder."""
        pass

    def recalculate_rating(self) -> int:
        """
        Recalculates the user's authentic Elo rating according to defined rules:
        - Baseline: 1000
        - Problem solves: 3 for Easy, 4 for Medium, 5 for Hard (no bonus)
        - LeetCode contest rating impact: +100 Elo for every +200 rating after 1500 (at 1700 -> +100, at 1900 -> +200...)
        - Plan parts completed: 15 points each
        - In-app verified solves (not on platform): 3 for Easy, 4 for Medium, 5 for Hard
        """
        base_elo = 1000

        # 1. Connected platforms solved problems (3 Easy, 4 Medium, 5 Hard)
        platform_points = 0
        contest_bonus = 0
        try:
            for profile in self.platform_profiles.select_related('stats').all():
                st = getattr(profile, 'stats', None)
                if st:
                    easy = int(st.easy_solved or 0)
                    hard = int(st.hard_solved or 0)
                    total = int(st.problems_solved or 0)
                    med = int(st.medium_solved) if (st.medium_solved is not None and st.medium_solved > 0) else max(0, total - easy - hard)
                    platform_points += (easy * 3) + (med * 4) + (hard * 5)

                    # LeetCode contest rating bonus: +100 for every +200 above 1500 (1700 -> 100, 1900 -> 200, etc.)
                    if profile.platform_name == 'leetcode':
                        lc_rating = int(st.rating or 0)
                        if lc_rating >= 1700:
                            contest_bonus += ((lc_rating - 1500) // 200) * 100
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

        new_rating = base_elo + platform_points + contest_bonus + plan_points + in_app_points
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
