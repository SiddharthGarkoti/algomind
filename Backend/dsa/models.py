from django.db import models
from django.conf import settings


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Problem(models.Model):
    DIFFICULTY = [('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')]

    title       = models.CharField(max_length=255)
    slug        = models.SlugField(unique=True)
    description = models.TextField()
    difficulty  = models.CharField(max_length=10, choices=DIFFICULTY)
    tags        = models.ManyToManyField(Tag, related_name='problems', blank=True)
    examples    = models.TextField(blank=True)
    constraints = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['difficulty', 'title']

    def __str__(self):
        return self.title


class Submission(models.Model):
    STATUS = [
        ('accepted', 'Accepted'),
        ('wrong',    'Wrong Answer'),
        ('error',    'Runtime Error'),
        ('pending',  'Pending'),
    ]
    LANGUAGES = [
        ('python',     'Python'),
        ('javascript', 'JavaScript'),
        ('java',       'Java'),
        ('cpp',        'C++'),
        ('c',          'C'),
    ]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    problem    = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions')
    code       = models.TextField()
    language   = models.CharField(max_length=20, choices=LANGUAGES, default='python')
    status     = models.CharField(max_length=20, choices=STATUS, default='pending')
    notes      = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} | {self.problem.title} | {self.status}"
