from rest_framework import serializers
from .models import PlatformProfile, PlatformStats, TopicStats, PLATFORMS


class ConnectPlatformSerializer(serializers.Serializer):
    platform_name = serializers.ChoiceField(choices=[p[0] for p in PLATFORMS])
    handle        = serializers.CharField(max_length=100)


class PlatformStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PlatformStats
        fields = ['rating', 'problems_solved', 'contests',
                  'easy_solved', 'medium_solved', 'hard_solved', 'last_updated']


class TopicStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TopicStats
        fields = ['topic_name', 'topic_slug', 'problems_solved', 'last_updated']


class PlatformProfileSerializer(serializers.ModelSerializer):
    stats       = PlatformStatsSerializer(read_only=True)
    topic_stats = TopicStatsSerializer(many=True, read_only=True)

    class Meta:
        model  = PlatformProfile
        fields = ['id', 'platform_name', 'handle', 'connected_at', 'stats', 'topic_stats']
