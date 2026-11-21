from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Party, PartyMember, PartyQuestion, QuestionCompletion, PartyStrikeLog

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


class PartyStrikeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PartyStrikeLog
        fields = ['id', 'strike_number', 'reason', 'created_at']


class PartyMemberSerializer(serializers.ModelSerializer):
    username               = serializers.CharField(source='user.username')
    avatar                 = serializers.SerializerMethodField()
    completed_count        = serializers.IntegerField(read_only=True)
    total_questions        = serializers.SerializerMethodField()
    completions            = CompletionSerializer(many=True, read_only=True)
    is_host                = serializers.SerializerMethodField()
    strikes                = serializers.IntegerField(read_only=True)
    is_spectator           = serializers.BooleanField(read_only=True)
    is_disqualified        = serializers.BooleanField(read_only=True)
    disqualified_reason    = serializers.CharField(read_only=True)
    current_question_slug  = serializers.CharField(read_only=True)
    current_question_title = serializers.CharField(read_only=True)
    strike_logs            = PartyStrikeLogSerializer(many=True, read_only=True)
    hint_fouls_seconds     = serializers.IntegerField(read_only=True)
    hints_used             = serializers.IntegerField(read_only=True)
    gave_up                = serializers.BooleanField(read_only=True)

    class Meta:
        model  = PartyMember
        fields = ['id', 'username', 'avatar', 'completed_count', 'total_questions',
                  'completions', 'finished_at', 'rank', 'is_host', 'joined_at',
                  'strikes', 'is_spectator', 'is_disqualified', 'disqualified_reason',
                  'current_question_slug', 'current_question_title', 'strike_logs',
                  'hint_fouls_seconds', 'hints_used', 'gave_up']

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
    host_id           = serializers.IntegerField(source='host.id', read_only=True)
    host_username     = serializers.CharField(source='host.username', read_only=True)
    members           = serializers.SerializerMethodField()
    all_members       = serializers.SerializerMethodField()
    questions         = PartyQuestionSerializer(many=True, read_only=True)
    time_remaining    = serializers.IntegerField(source='time_remaining_seconds', read_only=True)
    member_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Party
        fields = ['id', 'code', 'name', 'host_id', 'host_username', 'status', 'question_mode',
                  'duration_minutes', 'max_questions', 'created_at', 'started_at',
                  'ends_at', 'time_remaining', 'members', 'all_members', 'questions', 'member_count',
                  'is_ranked', 'max_strikes', 'host_spectator',
                  'match_type', 'versus_mode', 'versus_topic', 'versus_selection', 'versus_q_data']

    def get_members(self, obj):
        """Exclude spectators from leaderboard/active competitor list."""
        members = obj.members.filter(is_spectator=False)
        return PartyMemberSerializer(members, many=True, context=self.context).data

    def get_all_members(self, obj):
        """Full member list including host/spectators for admin monitor."""
        return PartyMemberSerializer(obj.members.all(), many=True, context=self.context).data

    def get_member_count(self, obj):
        return obj.members.filter(is_spectator=False).count()


class CreatePartySerializer(serializers.Serializer):
    name             = serializers.CharField(max_length=100, default='Code Party')
    duration_minutes = serializers.IntegerField(min_value=0, max_value=360, default=60)
    max_questions    = serializers.IntegerField(min_value=1, max_value=50, default=4)
    question_mode    = serializers.ChoiceField(choices=['manual', 'shuffle', 'versus'], default='shuffle')
    is_ranked        = serializers.BooleanField(default=False)
    max_strikes      = serializers.IntegerField(min_value=0, max_value=50, default=3)
    host_spectator   = serializers.BooleanField(default=False)
    match_type       = serializers.CharField(max_length=20, default='standard', required=False)
    versus_mode      = serializers.CharField(max_length=20, default='competitive', required=False)
    versus_topic     = serializers.CharField(max_length=100, default='', required=False, allow_blank=True)
    versus_selection = serializers.CharField(max_length=20, default='topic', required=False)
    versus_q_data    = serializers.JSONField(default=dict, required=False)


class AddQuestionSerializer(serializers.Serializer):
    title      = serializers.CharField(max_length=300)
    platform   = serializers.ChoiceField(choices=['leetcode', 'codeforces'])
    url        = serializers.URLField()
    slug       = serializers.CharField(max_length=300)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
