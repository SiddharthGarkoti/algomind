from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Party, PartyMember, PartyQuestion, QuestionCompletion

User = get_user_model()


class PartyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PartyQuestion
        fields = ['id', 'title', 'platform', 'url', 'slug', 'difficulty', 'order']


class CompletionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='question.id')
    class Meta:
        model  = QuestionCompletion
        fields = ['question_id', 'completed_at', 'verified']


class PartyMemberSerializer(serializers.ModelSerializer):
    username         = serializers.CharField(source='user.username')
    avatar           = serializers.SerializerMethodField()
    completed_count  = serializers.IntegerField(read_only=True)
    total_questions  = serializers.SerializerMethodField()
    completions      = CompletionSerializer(many=True, read_only=True)
    is_host          = serializers.SerializerMethodField()

    class Meta:
        model  = PartyMember
        fields = ['id', 'username', 'avatar', 'completed_count', 'total_questions',
                  'completions', 'finished_at', 'rank', 'is_host', 'joined_at']

    def get_avatar(self, obj):
        req = self.context.get('request')
        if req and hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            return req.build_absolute_uri(obj.user.profile.avatar.url)
        return None

    def get_total_questions(self, obj):
        return obj.party.questions.count()

    def get_is_host(self, obj):
        return obj.user_id == obj.party.host_id


class PartySerializer(serializers.ModelSerializer):
    host_username     = serializers.CharField(source='host.username', read_only=True)
    members           = PartyMemberSerializer(many=True, read_only=True)
    questions         = PartyQuestionSerializer(many=True, read_only=True)
    time_remaining    = serializers.IntegerField(source='time_remaining_seconds', read_only=True)
    member_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Party
        fields = ['id', 'code', 'name', 'host_username', 'status', 'question_mode',
                  'duration_minutes', 'max_questions', 'created_at', 'started_at',
                  'ends_at', 'time_remaining', 'members', 'questions', 'member_count']

    def get_member_count(self, obj):
        return obj.members.count()


class CreatePartySerializer(serializers.Serializer):
    name             = serializers.CharField(max_length=100, default='Code Party')
    duration_minutes = serializers.IntegerField(min_value=10, max_value=180, default=60)
    max_questions    = serializers.IntegerField(min_value=1, max_value=10, default=4)
    question_mode    = serializers.ChoiceField(choices=['manual', 'shuffle'], default='shuffle')


class AddQuestionSerializer(serializers.Serializer):
    title      = serializers.CharField(max_length=300)
    platform   = serializers.ChoiceField(choices=['leetcode', 'codeforces'])
    url        = serializers.URLField()
    slug       = serializers.CharField(max_length=300)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
