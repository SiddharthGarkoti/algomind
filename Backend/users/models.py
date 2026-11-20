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
