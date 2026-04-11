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


class TopicStat(models.Model):
    STRENGTH = [
        ('strong', 'Strong'),
        ('medium', 'Medium'),
        ('weak',   'Weak'),
    ]
    user           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='topic_stats')
    topic          = models.CharField(max_length=100)
    problems_solved = models.PositiveIntegerField(default=0)
    total_attempts = models.PositiveIntegerField(default=0)
    accuracy       = models.FloatField(default=0.0)
    avg_time_mins  = models.FloatField(default=0.0)
    easy_count     = models.PositiveIntegerField(default=0)
    medium_count   = models.PositiveIntegerField(default=0)
    hard_count     = models.PositiveIntegerField(default=0)
    strength       = models.CharField(max_length=10, choices=STRENGTH, default='medium')
    last_updated   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'topic']

    def __str__(self):
        return f"{self.user.username} | {self.topic} | {self.strength}"


class SubmissionLog(models.Model):
    VERDICTS = [
        ('AC',  'Accepted'),
        ('WA',  'Wrong Answer'),
        ('TLE', 'Time Limit Exceeded'),
        ('RE',  'Runtime Error'),
        ('CE',  'Compile Error'),
    ]
    user           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submission_logs')
    platform       = models.CharField(max_length=20, choices=PLATFORMS)
    problem_name   = models.CharField(max_length=255)
    topic          = models.CharField(max_length=100, blank=True)
    difficulty     = models.CharField(max_length=10, blank=True)
    verdict        = models.CharField(max_length=5, choices=VERDICTS)
    time_taken_mins = models.FloatField(default=0.0)
    attempt_number = models.PositiveIntegerField(default=1)
    submitted_at   = models.DateTimeField()

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} | {self.problem_name} | {self.verdict}"


class ActivityLog(models.Model):
    user           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_logs')
    date           = models.DateField()
    problems_solved = models.PositiveIntegerField(default=0)
    submissions    = models.PositiveIntegerField(default=0)
    platforms_used = models.JSONField(default=list)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} | {self.date} | {self.problems_solved} solved"


class ContestHistory(models.Model):
    user           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contest_history')
    platform       = models.CharField(max_length=20, choices=PLATFORMS)
    contest_name   = models.CharField(max_length=255)
    rank           = models.PositiveIntegerField(null=True, blank=True)
    rating_before  = models.IntegerField(default=0)
    rating_after   = models.IntegerField(default=0)
    rating_change  = models.IntegerField(default=0)
    problems_solved = models.PositiveIntegerField(default=0)
    held_at        = models.DateTimeField()

    class Meta:
        ordering = ['-held_at']

    def __str__(self):
        return f"{self.user.username} | {self.contest_name} | {self.rating_change:+d}"