from django.contrib import admin
from .models import AIRequest

@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    list_display  = ['user', 'request_type', 'problem', 'created_at']
    list_filter   = ['request_type']
    search_fields = ['user__username']
