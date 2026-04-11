from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['email', 'username', 'streak', 'level', 'rating', 'is_staff']
    search_fields = ['email', 'username']
    list_filter   = ['level', 'is_staff']
    fieldsets     = UserAdmin.fieldsets + (
        ('AlgoMind Stats', {'fields': ('streak', 'last_active', 'level', 'rating', 'bio', 'avatar')}),
    )
