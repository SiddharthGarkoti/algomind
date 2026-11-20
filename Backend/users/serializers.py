from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Notification


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'password', 'password2']

    def validate_username(self, value):
        val = (value or '').strip()
        if len(val) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("This AlgoMind username is already taken. Please choose a different one.")
        return val

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'streak',
                  'rating', 'bio', 'avatar', 'last_active', 'date_joined', 'is_admin', 'plan_tier',
                  'hide_connected_platforms']
        read_only_fields = ['id', 'email', 'streak',
                            'rating', 'date_joined', 'last_active', 'is_admin', 'plan_tier']

    def validate_username(self, value):
        val = (value or '').strip()
        if len(val) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        existing = User.objects.filter(username__iexact=val)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("This AlgoMind username is already taken. Please choose a different one.")
        return val


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'streak', 'rating', 'bio', 'avatar', 'is_admin', 'plan_tier', 'hide_connected_platforms']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = [
            'id', 'notif_type', 'title', 'body',
            'related_id', 'avatar_text', 'color', 'read', 'created_at',
        ]
        read_only_fields = fields
