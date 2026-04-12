from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Notification


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'password', 'password2']

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
        fields = ['id', 'email', 'username', 'streak', 'level',
                  'rating', 'bio', 'avatar', 'last_active', 'date_joined', 'is_admin']
        read_only_fields = ['id', 'email', 'streak', 'level',
                            'rating', 'date_joined', 'last_active', 'is_admin']


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'streak', 'level', 'rating', 'avatar', 'is_admin']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = [
            'id', 'notif_type', 'title', 'body',
            'related_id', 'avatar_text', 'color', 'read', 'created_at',
        ]
        read_only_fields = fields
