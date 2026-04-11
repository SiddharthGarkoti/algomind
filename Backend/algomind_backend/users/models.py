from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    streak = models.PositiveIntegerField(default=0)
    last_active = models.DateField(null=True, blank=True)
    level = models.PositiveIntegerField(default=1)
    rating = models.PositiveIntegerField(default=1000)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def award_rating(self, points: int):
        self.rating += points
        # level up every 500 rating points
        self.level = max(1, self.rating // 500)
        self.save(update_fields=['rating', 'level'])
