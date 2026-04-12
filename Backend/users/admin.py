from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Notification

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['email', 'username', 'streak', 'level', 'rating', 'is_staff']
    search_fields = ['email', 'username']
    list_filter   = ['level', 'is_staff']
    fieldsets     = UserAdmin.fieldsets + (
        ('AlgoMind Stats', {'fields': ('streak', 'last_active', 'level', 'rating', 'bio', 'avatar')}),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['recipient', 'notif_type', 'title', 'read', 'created_at']
    list_filter   = ['notif_type', 'read']
    search_fields = ['recipient__username', 'title', 'body']
    readonly_fields = ['created_at']
    # Admins can create system/achievement notifications manually from the admin panel
