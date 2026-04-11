from rest_framework import serializers
from .models import Tag, Problem, Submission


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'name']


class ProblemListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Problem
        fields = ['id', 'title', 'slug', 'difficulty', 'tags', 'created_at']


class ProblemDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Problem
        fields = ['id', 'title', 'slug', 'description', 'difficulty',
                  'tags', 'examples', 'constraints', 'created_at']


class SubmissionSerializer(serializers.ModelSerializer):
    username      = serializers.CharField(source='user.username',    read_only=True)
    problem_title = serializers.CharField(source='problem.title',    read_only=True)
    problem_slug  = serializers.CharField(source='problem.slug',     read_only=True)

    class Meta:
        model  = Submission
        fields = ['id', 'user', 'username', 'problem', 'problem_title',
                  'problem_slug', 'code', 'language', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Submission
        fields = ['problem', 'code', 'language', 'status', 'notes']

    def validate_problem(self, value):
        if not value.is_active:
            raise serializers.ValidationError('This problem is no longer active.')
        return value
