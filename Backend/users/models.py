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
    last_active   = models.DateField(null=True, blank=True)
    level         = models.PositiveIntegerField(default=1)
    rating        = models.PositiveIntegerField(default=1000)
    bio           = models.TextField(blank=True)
    avatar        = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_admin      = models.BooleanField(default=False)  # Community admin / poster
    # OAuth fields
    oauth_provider = models.CharField(max_length=20, choices=OAUTH_PROVIDERS, default='email')
    oauth_id       = models.CharField(max_length=200, blank=True)  # provider's user id

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def award_rating(self, points: int):
        self.rating += points
        # level up every 500 rating points
        self.level = max(1, self.rating // 500)
        self.save(update_fields=['rating', 'level'])


NOTIF_TYPES = [
    ('friend_request', 'Friend Request'),
    ('friend_accepted', 'Friend Accepted'),
    ('system',         'System'),
    ('achievement',    'Achievement'),
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
