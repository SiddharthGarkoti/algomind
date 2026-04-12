from rest_framework import serializers
from .models import AIRequest


class AIRequestSerializer(serializers.Serializer):
    problem_id = serializers.IntegerField(required=False, allow_null=True)
    message    = serializers.CharField(max_length=3000)


class AIResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AIRequest
        fields = ['id', 'request_type', 'user_input', 'ai_response', 'created_at']
