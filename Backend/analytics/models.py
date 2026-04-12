from django.db import models
from django.conf import settings


PLATFORMS = [
    ('leetcode',   'LeetCode'),
    ('codeforces', 'Codeforces'),
    ('codechef',   'CodeChef'),
    ('hackerrank', 'HackerRank'),
]


class PlatformProfile(models.Model):
    user          = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='platform_profiles')
    platform_name = models.CharField(max_length=20, choices=PLATFORMS)
    handle        = models.CharField(max_length=100)
    connected_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'platform_name']

    def __str__(self):
        return f"{self.user.username} | {self.platform_name} | {self.handle}"


class PlatformStats(models.Model):
    profile         = models.OneToOneField(PlatformProfile, on_delete=models.CASCADE, related_name='stats')
    rating          = models.IntegerField(default=0)
    problems_solved = models.PositiveIntegerField(default=0)
    contests        = models.PositiveIntegerField(default=0)
    easy_solved     = models.PositiveIntegerField(default=0)
    medium_solved   = models.PositiveIntegerField(default=0)
    hard_solved     = models.PositiveIntegerField(default=0)
    last_updated    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.profile} stats"


class TopicStats(models.Model):
    """Per-topic solved counts fetched from the platform (e.g. LeetCode tag stats)."""
    profile         = models.ForeignKey(PlatformProfile, on_delete=models.CASCADE, related_name='topic_stats')
    topic_name      = models.CharField(max_length=100)
    topic_slug      = models.CharField(max_length=100)
    problems_solved = models.PositiveIntegerField(default=0)
    last_updated    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['profile', 'topic_slug']
        ordering        = ['-problems_solved']

    def __str__(self):
        return f"{self.profile.platform_name} | {self.topic_name}: {self.problems_solved}"
