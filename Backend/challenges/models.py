import random
import string
from django.db import models
from django.conf import settings
from django.utils import timezone


def _gen_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Party(models.Model):
    STATUS = [('waiting', 'Waiting'), ('active', 'Active'), ('finished', 'Finished')]
    Q_MODE = [('manual', 'Manual'), ('shuffle', 'AI Shuffle')]

    code             = models.CharField(max_length=8, unique=True, default=_gen_code)
    host             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_parties')
    name             = models.CharField(max_length=100, default='Code Party')
    status           = models.CharField(max_length=20, choices=STATUS, default='waiting')
    question_mode    = models.CharField(max_length=20, choices=Q_MODE, default='shuffle')
    duration_minutes = models.IntegerField(default=60)
    max_questions    = models.IntegerField(default=4)
    created_at       = models.DateTimeField(auto_now_add=True)
    started_at       = models.DateTimeField(null=True, blank=True)
    ends_at          = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'parties'
        ordering = ['-created_at']

    def __str__(self):
        return f'Party {self.code} ({self.status})'

    @property
    def time_remaining_seconds(self):
        if self.status == 'active' and self.ends_at:
            delta = self.ends_at - timezone.now()
            return max(0, int(delta.total_seconds()))
        return 0

    @property
    def is_expired(self):
        return self.status == 'active' and self.ends_at and timezone.now() > self.ends_at


class PartyMember(models.Model):
    party       = models.ForeignKey(Party, on_delete=models.CASCADE, related_name='members')
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='party_memberships')
    joined_at   = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    rank        = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = [['party', 'user']]
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user.username} in {self.party.code}'

    @property
    def completed_count(self):
        return self.completions.filter(verified=True).count()


class PartyQuestion(models.Model):
    PLATFORMS    = [('leetcode', 'LeetCode'), ('codeforces', 'Codeforces')]
    DIFFICULTIES = [('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]

    party      = models.ForeignKey(Party, on_delete=models.CASCADE, related_name='questions')
    title      = models.CharField(max_length=300)
    platform   = models.CharField(max_length=20, choices=PLATFORMS, default='leetcode')
    url        = models.URLField()
    slug       = models.CharField(max_length=300)   # LC titleSlug or CF "contestId-index"
    difficulty = models.CharField(max_length=10, choices=DIFFICULTIES, default='medium')
    order      = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.title} ({self.party.code})'


class QuestionCompletion(models.Model):
    member       = models.ForeignKey(PartyMember, on_delete=models.CASCADE, related_name='completions')
    question     = models.ForeignKey(PartyQuestion, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField(auto_now_add=True)
    verified     = models.BooleanField(default=True)

    class Meta:
        unique_together = [['member', 'question']]
