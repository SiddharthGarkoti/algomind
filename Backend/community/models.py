from django.db import models
from django.conf import settings


POST_TYPES = [
    ('update', 'Update'),
    ('tip',    'Tip'),
    ('note',   'Dev Note'),
]


class CommunityPost(models.Model):
    """
    Only users with is_admin=True (or Django staff) can create posts.
    This is enforced at the view layer.
    """
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts')
    post_type  = models.CharField(max_length=10, choices=POST_TYPES, default='update')
    title      = models.CharField(max_length=255)
    body       = models.TextField()
    tags       = models.CharField(max_length=200, blank=True, help_text='Comma-separated tags')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def tag_list(self):
        return [t.strip() for t in self.tags.split(',') if t.strip()]

    @property
    def like_count(self):
        return self.likes.count()


class PostLike(models.Model):
    post    = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='likes')
    user    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['post', 'user']
