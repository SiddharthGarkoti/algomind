from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('users.urls')),
    path('api/dsa/',        include('dsa.urls')),
    path('api/ai/',         include('ai_engine.urls')),
    path('api/analytics/',  include('analytics.urls')),
    path('api/friends/',    include('friends.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
    path('api/notifications/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
