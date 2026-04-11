from django.contrib import admin
from .models import PlatformProfile, PlatformStats

class PlatformStatsInline(admin.StackedInline):
    model = PlatformStats
    extra = 0

@admin.register(PlatformProfile)
class PlatformProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'platform_name', 'handle', 'connected_at']
    list_filter   = ['platform_name']
    search_fields = ['user__username', 'handle']
    inlines       = [PlatformStatsInline]
