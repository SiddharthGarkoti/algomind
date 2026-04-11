from django.contrib import admin
from .models import FriendRequest, Friendship

@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'receiver', 'status', 'created_at']
    list_filter   = ['status']
    search_fields = ['sender__username', 'receiver__username']

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display  = ['user1', 'user2', 'created_at']
    search_fields = ['user1__username', 'user2__username']
